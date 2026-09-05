from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.security.auth import get_current_user
from app.schemas.patient import PatientCreate, PatientUpdate, PatientOut, PatientListOut
from app.services import patient_service

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=PatientListOut)
def list_patients(
    search: str = Query("", description="Search by name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patients, total = patient_service.get_patients(db, search=search, skip=skip, limit=limit)
    return PatientListOut(
        patients=[PatientOut.model_validate(p) for p in patients],
        total=total,
    )


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(
    data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = patient_service.create_patient(db, data, user_id=current_user.id)
    p = PatientOut.model_validate(patient)
    p.report_count = 0
    return p


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    from sqlalchemy import func
    from app.models.report import Report
    patient.report_count = db.query(func.count(Report.id)).filter(
        Report.patient_id == patient.id
    ).scalar() or 0
    return PatientOut.model_validate(patient)


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    updated = patient_service.update_patient(db, patient, data)
    return PatientOut.model_validate(updated)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_service.delete_patient(db, patient)
