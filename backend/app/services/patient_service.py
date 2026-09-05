"""Patient service — business logic layer."""
from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.patient import Patient
from app.models.report import Report
from app.schemas.patient import PatientCreate, PatientUpdate


def generate_patient_id() -> str:
    return f"PT-{uuid.uuid4().hex[:8].upper()}"


def create_patient(db: Session, data: PatientCreate, user_id: int) -> Patient:
    patient = Patient(
        patient_id=generate_patient_id(),
        created_by=user_id,
        **data.model_dump(),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def get_patient(db: Session, patient_id: int) -> Patient | None:
    return db.query(Patient).filter(Patient.id == patient_id).first()


def get_patients(db: Session, search: str = "", skip: int = 0, limit: int = 50):
    q = db.query(Patient)
    if search:
        q = q.filter(Patient.name.ilike(f"%{search}%"))
    total = q.count()
    patients = q.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

    # Annotate report counts
    for p in patients:
        p.report_count = db.query(func.count(Report.id)).filter(
            Report.patient_id == p.id
        ).scalar() or 0

    return patients, total


def update_patient(db: Session, patient: Patient, data: PatientUpdate) -> Patient:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    patient.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(patient)
    return patient


def delete_patient(db: Session, patient: Patient) -> None:
    db.delete(patient)
    db.commit()
