import os
import uuid
import asyncio
from pathlib import Path
from typing import List, Optional

from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File,
    Form, BackgroundTasks, status
)
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.report import Report, ReportStatus, Conflict
from app.security.auth import get_current_user
from app.schemas.report import ReportOut, ConflictOut, ConflictResolve
from app.services import patient_service
from app.services.report_service import process_report

router = APIRouter(prefix="/reports", tags=["reports"])

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
}
MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def upload_report(
    background_tasks: BackgroundTasks,
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    content_type = file.content_type or ""
    file_ext = ALLOWED_TYPES.get(content_type)
    if not file_ext:
        # Try from filename
        suffix = Path(file.filename or "").suffix.lower().lstrip(".")
        if suffix in ("pdf", "png", "jpg", "jpeg"):
            file_ext = "jpg" if suffix == "jpeg" else suffix
        else:
            raise HTTPException(
                status_code=415,
                detail="Unsupported file type. Upload PDF, PNG, or JPG.",
            )

    file_data = await file.read()
    if len(file_data) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size is {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    # Save file
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}.{file_ext}"
    file_path = upload_dir / unique_name
    file_path.write_bytes(file_data)

    report = Report(
        patient_id=patient_id,
        uploaded_by=current_user.id,
        filename=unique_name,
        original_filename=file.filename or unique_name,
        file_path=str(file_path),
        file_type=file_ext,
        file_size=len(file_data),
        status=ReportStatus.PENDING,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Process in background
    background_tasks.add_task(_run_pipeline, report.id)

    return ReportOut.model_validate(report)


def _run_pipeline(report_id: int):
    """Wrapper to run async pipeline from sync background task."""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        asyncio.run(process_report(report_id, db))
    finally:
        db.close()


@router.get("", response_model=List[ReportOut])
def list_reports(
    patient_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Report)
    if patient_id:
        q = q.filter(Report.patient_id == patient_id)
    reports = q.order_by(Report.created_at.desc()).limit(100).all()
    return [ReportOut.model_validate(r) for r in reports]


@router.get("/{report_id}", response_model=ReportOut)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportOut.model_validate(report)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    # Remove file
    try:
        os.remove(report.file_path)
    except FileNotFoundError:
        pass
    db.delete(report)
    db.commit()


# ── Conflicts ─────────────────────────────────────────────────────────────────

@router.get("/conflicts/all", response_model=List[ConflictOut])
def list_all_conflicts(
    patient_id: Optional[int] = None,
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Conflict)
    if patient_id:
        q = q.filter(Conflict.patient_id == patient_id)
    if resolved is not None:
        q = q.filter(Conflict.resolved == resolved)
    conflicts = q.order_by(Conflict.created_at.desc()).all()
    return [ConflictOut.model_validate(c) for c in conflicts]


@router.patch("/conflicts/{conflict_id}/resolve", response_model=ConflictOut)
def resolve_conflict(
    conflict_id: int,
    data: ConflictResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conflict = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
    conflict.resolved = True
    conflict.resolution_note = data.resolution_note
    db.commit()
    db.refresh(conflict)
    return ConflictOut.model_validate(conflict)
