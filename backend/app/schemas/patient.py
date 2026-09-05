from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class PatientBase(BaseModel):
    name: str
    date_of_birth: Optional[date] = None
    sex: Optional[str] = None
    symptoms: Optional[str] = None
    existing_conditions: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    additional_notes: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(PatientBase):
    name: Optional[str] = None


class PatientOut(PatientBase):
    id: int
    patient_id: str
    created_at: datetime
    updated_at: datetime
    report_count: Optional[int] = 0

    class Config:
        from_attributes = True


class PatientListOut(BaseModel):
    patients: list[PatientOut]
    total: int
