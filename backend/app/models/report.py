from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Text, ForeignKey,
    Float, Boolean, Enum as SAEnum, Date
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class ResultStatus(str, enum.Enum):
    NORMAL = "normal"
    LOW = "low"
    HIGH = "high"
    UNKNOWN = "unknown"
    CONFLICT = "conflict"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(50), nullable=False)   # pdf / png / jpg
    file_size = Column(Integer, nullable=True)        # bytes

    report_date = Column(Date, nullable=True)         # date from inside the document
    report_type = Column(String(255), nullable=True)  # e.g. "Blood Test", "Radiology"
    report_title = Column(String(512), nullable=True)
    lab_name = Column(String(255), nullable=True)
    doctor_name = Column(String(255), nullable=True)

    raw_text = Column(Text, nullable=True)
    ocr_used = Column(Boolean, default=False)

    status = Column(SAEnum(ReportStatus), default=ReportStatus.PENDING)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="reports")
    uploader = relationship("User")
    lab_results = relationship("LabResult", back_populates="report", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="report", cascade="all, delete-orphan")
    ai_summary = relationship("AISummary", back_populates="report", uselist=False, cascade="all, delete-orphan")


class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)

    test_name = Column(String(255), nullable=False)
    value_raw = Column(String(100), nullable=False)   # exactly as extracted
    value_numeric = Column(Float, nullable=True)      # parsed numeric, if applicable
    unit = Column(String(50), nullable=True)

    # Reference range exactly as shown in the report
    ref_range_raw = Column(String(100), nullable=True)
    ref_range_low = Column(Float, nullable=True)
    ref_range_high = Column(Float, nullable=True)

    # Status is computed by application logic, NOT by AI
    status = Column(SAEnum(ResultStatus), default=ResultStatus.UNKNOWN)

    # AI extraction confidence (0-1)
    confidence = Column(Float, nullable=True)

    # Observation text exactly as it appeared in the report
    observation = Column(Text, nullable=True)

    result_date = Column(Date, nullable=True)
    category = Column(String(100), nullable=True)  # e.g. "Hematology", "Chemistry"

    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="lab_results")


class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    test_name = Column(String(255), nullable=False)
    conflict_type = Column(String(100), nullable=False)  # e.g. "value_change", "unit_mismatch"
    description = Column(Text, nullable=False)

    result_id_a = Column(Integer, ForeignKey("lab_results.id"), nullable=True)
    result_id_b = Column(Integer, ForeignKey("lab_results.id"), nullable=True)

    resolved = Column(Boolean, default=False)
    resolution_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="conflicts")


class AISummary(Base):
    __tablename__ = "ai_summaries"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False, unique=True)

    summary_text = Column(Text, nullable=False)
    provider = Column(String(50), nullable=True)   # "mock" / "openai"
    model = Column(String(100), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="ai_summary")
