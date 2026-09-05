from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List
from app.models.report import ReportStatus, ResultStatus


class LabResultOut(BaseModel):
    id: int
    report_id: int
    test_name: str
    value_raw: str
    value_numeric: Optional[float] = None
    unit: Optional[str] = None
    ref_range_raw: Optional[str] = None
    ref_range_low: Optional[float] = None
    ref_range_high: Optional[float] = None
    status: ResultStatus
    confidence: Optional[float] = None
    observation: Optional[str] = None
    result_date: Optional[date] = None
    category: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AISummaryOut(BaseModel):
    id: int
    summary_text: str
    provider: Optional[str] = None
    model: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class ConflictOut(BaseModel):
    id: int
    report_id: int
    patient_id: int
    test_name: str
    conflict_type: str
    description: str
    result_id_a: Optional[int] = None
    result_id_b: Optional[int] = None
    resolved: bool
    resolution_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReportOut(BaseModel):
    id: int
    patient_id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: Optional[int] = None
    report_date: Optional[date] = None
    report_type: Optional[str] = None
    report_title: Optional[str] = None
    lab_name: Optional[str] = None
    doctor_name: Optional[str] = None
    ocr_used: bool
    status: ReportStatus
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    lab_results: List[LabResultOut] = []
    ai_summary: Optional[AISummaryOut] = None
    conflicts: List[ConflictOut] = []

    class Config:
        from_attributes = True


class ConflictResolve(BaseModel):
    resolution_note: str
