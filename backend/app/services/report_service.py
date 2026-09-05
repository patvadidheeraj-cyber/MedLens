"""
Full report processing pipeline.
Document → Text extraction → OCR? → AI extraction → Validation
→ Reference range calculation → Status → Conflict detection → DB storage
"""
from __future__ import annotations
import os
import uuid
import shutil
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models.report import Report, LabResult, Conflict, AISummary, ReportStatus, ResultStatus
from app.document_processing.extractor import extract_text
from app.document_processing.reference_ranges import (
    parse_reference_range,
    calculate_status,
    try_parse_numeric,
)
from app.ai.providers import get_ai_provider


def _parse_date(raw: Optional[str]) -> Optional[date]:
    if not raw:
        return None
    try:
        from dateutil import parser as dp
        return dp.parse(raw).date()
    except Exception:
        return None


def detect_conflicts(db: Session, new_results: list[LabResult], patient_id: int, report_id: int):
    """
    Compare new lab results against the most recent prior results for each test.
    Flag large numeric deviations (>50%) or unit mismatches.
    """
    from app.models.report import Report as ReportModel
    prior_reports = (
        db.query(ReportModel)
        .filter(
            ReportModel.patient_id == patient_id,
            ReportModel.id != report_id,
            ReportModel.status == ReportStatus.COMPLETE,
        )
        .all()
    )
    prior_results: dict[str, LabResult] = {}
    for pr in prior_reports:
        for lr in pr.lab_results:
            key = lr.test_name.lower().strip()
            if key not in prior_results:
                prior_results[key] = lr

    conflicts_to_add = []
    for new_lr in new_results:
        key = new_lr.test_name.lower().strip()
        prior = prior_results.get(key)
        if not prior:
            continue

        # Unit mismatch
        if (
            prior.unit and new_lr.unit
            and prior.unit.strip().lower() != new_lr.unit.strip().lower()
        ):
            conflicts_to_add.append(
                Conflict(
                    report_id=report_id,
                    patient_id=patient_id,
                    test_name=new_lr.test_name,
                    conflict_type="unit_mismatch",
                    description=(
                        f"Unit changed: previously '{prior.unit}', now '{new_lr.unit}'. "
                        "Verify that results are comparable."
                    ),
                    result_id_a=prior.id,
                    result_id_b=new_lr.id,
                )
            )
            continue

        # Significant numeric change (>50%)
        if prior.value_numeric is not None and new_lr.value_numeric is not None:
            if prior.value_numeric != 0:
                pct_change = abs(new_lr.value_numeric - prior.value_numeric) / abs(prior.value_numeric)
                if pct_change > 0.50:
                    conflicts_to_add.append(
                        Conflict(
                            report_id=report_id,
                            patient_id=patient_id,
                            test_name=new_lr.test_name,
                            conflict_type="significant_change",
                            description=(
                                f"Value changed by {pct_change*100:.0f}%: "
                                f"was {prior.value_raw} {prior.unit or ''}, "
                                f"now {new_lr.value_raw} {new_lr.unit or ''}."
                            ),
                            result_id_a=prior.id,
                            result_id_b=new_lr.id,
                        )
                    )

    for c in conflicts_to_add:
        db.add(c)


async def process_report(report_id: int, db: Session) -> None:
    """
    Full async pipeline. Called after the file is saved to disk.
    Updates the Report record in-place.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        return

    # ── Step 1: Update status → processing ──────────────────────────────────
    report.status = ReportStatus.PROCESSING
    db.commit()

    try:
        # ── Step 2: Text extraction ──────────────────────────────────────────
        raw_text, ocr_used = extract_text(report.file_path, report.file_type)
        report.raw_text = raw_text
        report.ocr_used = ocr_used
        db.commit()

        # ── Step 3: AI extraction ────────────────────────────────────────────
        provider = get_ai_provider()
        extracted = await provider.extract_lab_results(raw_text)

        report.report_date = _parse_date(extracted.get("report_date"))
        report.report_type = extracted.get("report_type")
        report.report_title = extracted.get("report_title")
        report.lab_name = extracted.get("lab_name")
        report.doctor_name = extracted.get("doctor_name")
        db.commit()

        # ── Step 4: Validate + store results ────────────────────────────────
        new_results: list[LabResult] = []
        for item in extracted.get("results", []):
            if not item.get("test_name") or not item.get("value"):
                continue

            value_raw = str(item["value"])
            value_numeric = try_parse_numeric(value_raw)

            ref_raw = item.get("reference_range")
            ref_low, ref_high = parse_reference_range(ref_raw)

            # Status is computed by application logic
            status = calculate_status(value_numeric, ref_low, ref_high)

            result_date = _parse_date(item.get("result_date") or extracted.get("report_date"))

            lr = LabResult(
                report_id=report_id,
                test_name=item["test_name"],
                value_raw=value_raw,
                value_numeric=value_numeric,
                unit=item.get("unit"),
                ref_range_raw=ref_raw,
                ref_range_low=ref_low,
                ref_range_high=ref_high,
                status=status,
                confidence=item.get("confidence"),
                observation=item.get("observation"),
                result_date=result_date,
                category=item.get("category"),
            )
            db.add(lr)
            new_results.append(lr)

        db.flush()  # get IDs for conflict detection

        # ── Step 5: Conflict detection ───────────────────────────────────────
        detect_conflicts(db, new_results, report.patient_id, report_id)

        # ── Step 6: AI summary ───────────────────────────────────────────────
        patient = report.patient
        patient_info = {
            "name": patient.name,
            "sex": patient.sex,
            "date_of_birth": str(patient.date_of_birth) if patient.date_of_birth else None,
        }
        results_for_summary = [
            {
                "test_name": lr.test_name,
                "value_raw": lr.value_raw,
                "unit": lr.unit,
                "ref_range_raw": lr.ref_range_raw,
                "status": lr.status.value,
            }
            for lr in new_results
        ]
        summary_text = await provider.generate_summary(patient_info, results_for_summary)
        ai_sum = AISummary(
            report_id=report_id,
            summary_text=summary_text,
            provider=extracted.get("provider", "mock"),
            model=settings.OPENAI_MODEL if settings.AI_PROVIDER != "mock" else "mock",
        )
        db.add(ai_sum)

        report.status = ReportStatus.COMPLETE
        db.commit()

    except Exception as e:
        db.rollback()
        report.status = ReportStatus.FAILED
        report.error_message = str(e)
        db.commit()
        raise
