import sys
import os
from datetime import date, datetime

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models.user import User
from app.models.patient import Patient
from app.models.report import Report, LabResult, ReportStatus, ResultStatus, AISummary
from app.security.auth import hash_password

def seed_database():
    print("Initializing database tables...")
    init_db()
    
    db = SessionLocal()
    try:
        # 1. Create or get Demo User
        user = db.query(User).filter(User.email == "doctor@medlens.com").first()
        if not user:
            print("Creating Demo Doctor user: doctor@medlens.com / Password123!")
            user = User(
                name="Dr. Sarah Jenkins",
                email="doctor@medlens.com",
                hashed_password=hash_password("Password123!"),
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print("Demo User doctor@medlens.com already exists.")

        # 2. Create Patients if none exist
        if db.query(Patient).count() == 0:
            print("Creating Sample Patients...")
            p1 = Patient(
                patient_id="P-1001",
                name="John Doe",
                date_of_birth=date(1985, 4, 12),
                sex="Male",
                symptoms="Fatigue, mild fever, and joint pain for 2 weeks",
                existing_conditions="Hypertension",
                allergies="Penicillin",
                current_medications="Lisinopril 10mg",
                additional_notes="Patient requested full blood panel review.",
                created_by=user.id
            )
            p2 = Patient(
                patient_id="P-1002",
                name="Emma Watson",
                date_of_birth=date(1992, 9, 20),
                sex="Female",
                symptoms="Shortness of breath on exertion, persistent dry cough",
                existing_conditions="Mild Asthma",
                allergies="Dust mites, Shellfish",
                current_medications="Albuterol inhaler",
                additional_notes="Follow up after chest X-Ray scan.",
                created_by=user.id
            )
            p3 = Patient(
                patient_id="P-1003",
                name="Robert Chen",
                date_of_birth=date(1978, 11, 5),
                sex="Male",
                symptoms="Dizziness and recurring headaches",
                existing_conditions="Type 2 Diabetes",
                allergies="None",
                current_medications="Metformin 500mg, Atorvastatin 20mg",
                additional_notes="Routine metabolic panel review.",
                created_by=user.id
            )
            db.add_all([p1, p2, p3])
            db.commit()
            db.refresh(p1)
            db.refresh(p2)
            db.refresh(p3)

            # 3. Create Sample Reports & Lab Results for John Doe
            print("Creating Sample Medical Reports & Lab Results...")
            report1 = Report(
                patient_id=p1.id,
                uploaded_by=user.id,
                filename="CBC_Complete_Blood_Count.pdf",
                original_filename="CBC_Complete_Blood_Count.pdf",
                file_path="uploads/demo_cbc.pdf",
                file_type="pdf",
                file_size=1048576,
                report_date=date(2026, 8, 15),
                report_type="Hematology",
                report_title="Complete Blood Count (CBC) Panel",
                lab_name="City Central Diagnostics Lab",
                doctor_name="Dr. Sarah Jenkins",
                raw_text="Hemoglobin: 11.2 g/dL (Low). WBC: 12.5 x10^3/uL (High). Platelets: 250 x10^3/uL (Normal).",
                ocr_used=False,
                status=ReportStatus.COMPLETE
            )
            db.add(report1)
            db.commit()
            db.refresh(report1)

            res1 = LabResult(
                report_id=report1.id,
                test_name="Hemoglobin",
                value_raw="11.2",
                value_numeric=11.2,
                unit="g/dL",
                ref_range_raw="13.5 - 17.5",
                ref_range_low=13.5,
                ref_range_high=17.5,
                status=ResultStatus.LOW,
                confidence=0.98,
                observation="Hemoglobin level is slightly below normal range, indicating mild anemia.",
                category="Hematology",
                result_date=date(2026, 8, 15)
            )
            res2 = LabResult(
                report_id=report1.id,
                test_name="White Blood Cells (WBC)",
                value_raw="12.5",
                value_numeric=12.5,
                unit="x10^3/uL",
                ref_range_raw="4.5 - 11.0",
                ref_range_low=4.5,
                ref_range_high=11.0,
                status=ResultStatus.HIGH,
                confidence=0.96,
                observation="Elevated WBC count suggests active inflammatory response or mild infection.",
                category="Hematology",
                result_date=date(2026, 8, 15)
            )
            res3 = LabResult(
                report_id=report1.id,
                test_name="Platelet Count",
                value_raw="250",
                value_numeric=250.0,
                unit="x10^3/uL",
                ref_range_raw="150 - 450",
                ref_range_low=150.0,
                ref_range_high=450.0,
                status=ResultStatus.NORMAL,
                confidence=0.99,
                observation="Platelet count is within expected physiological range.",
                category="Hematology",
                result_date=date(2026, 8, 15)
            )
            summary1 = AISummary(
                report_id=report1.id,
                summary_text="Patient presents mild anemia (Hemoglobin 11.2 g/dL) accompanied by elevated white blood cell count (12.5 x10^3/uL), suggesting a low-grade infection or systemic inflammation. Platelet levels are stable.",
                provider="mock",
                model="mock-v1"
            )
            db.add_all([res1, res2, res3, summary1])
            db.commit()

            print("Database seeded successfully! 🎉")
        else:
            print("Patients already exist in the database.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
