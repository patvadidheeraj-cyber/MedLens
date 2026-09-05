"""Dashboard statistics endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.report import Report, LabResult, Conflict, ReportStatus
from app.security.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_patients = db.query(func.count(Patient.id)).scalar() or 0
    total_reports = db.query(func.count(Report.id)).scalar() or 0
    total_results = db.query(func.count(LabResult.id)).scalar() or 0
    pending_reviews = (
        db.query(func.count(Report.id))
        .filter(Report.status.in_([ReportStatus.PENDING, ReportStatus.PROCESSING]))
        .scalar() or 0
    )
    open_conflicts = (
        db.query(func.count(Conflict.id))
        .filter(Conflict.resolved == False)  # noqa: E712
        .scalar() or 0
    )

    recent_patients = (
        db.query(Patient)
        .order_by(Patient.created_at.desc())
        .limit(5)
        .all()
    )

    recent_reports = (
        db.query(Report)
        .order_by(Report.created_at.desc())
        .limit(5)
        .all()
    )

    from datetime import date

    def age_from_dob(dob):
        if not dob:
            return None
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    return {
        "stats": {
            "total_patients": total_patients,
            "total_reports": total_reports,
            "total_results": total_results,
            "pending_reviews": pending_reviews,
            "open_conflicts": open_conflicts,
        },
        "recent_patients": [
            {
                "id": p.id,
                "patient_id": p.patient_id,
                "name": p.name,
                "age": age_from_dob(p.date_of_birth),
                "sex": p.sex,
                "report_count": len(p.reports),
                "last_report": max(
                    (r.created_at for r in p.reports), default=None
                ),
            }
            for p in recent_patients
        ],
        "recent_reports": [
            {
                "id": r.id,
                "original_filename": r.original_filename,
                "patient_id": r.patient_id,
                "report_date": r.report_date,
                "status": r.status.value,
                "created_at": r.created_at,
            }
            for r in recent_reports
        ],
    }
