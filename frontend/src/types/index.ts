// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Patient ──────────────────────────────────────────────────────────────────
export interface Patient {
  id: number;
  patient_id: string;
  name: string;
  date_of_birth?: string | null;
  sex?: string | null;
  symptoms?: string | null;
  existing_conditions?: string | null;
  allergies?: string | null;
  current_medications?: string | null;
  additional_notes?: string | null;
  created_at: string;
  updated_at: string;
  report_count: number;
}

export interface PatientCreate {
  name: string;
  date_of_birth?: string;
  sex?: string;
  symptoms?: string;
  existing_conditions?: string;
  allergies?: string;
  current_medications?: string;
  additional_notes?: string;
}

// ─── Lab Results ─────────────────────────────────────────────────────────────
export type ResultStatus = 'normal' | 'low' | 'high' | 'unknown' | 'conflict';
export type ReportStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface LabResult {
  id: number;
  report_id: number;
  test_name: string;
  value_raw: string;
  value_numeric?: number | null;
  unit?: string | null;
  ref_range_raw?: string | null;
  ref_range_low?: number | null;
  ref_range_high?: number | null;
  status: ResultStatus;
  confidence?: number | null;
  observation?: string | null;
  result_date?: string | null;
  category?: string | null;
  created_at: string;
}

export interface AISummary {
  id: number;
  summary_text: string;
  provider?: string;
  model?: string;
  generated_at: string;
}

export interface Conflict {
  id: number;
  report_id: number;
  patient_id: number;
  test_name: string;
  conflict_type: string;
  description: string;
  result_id_a?: number;
  result_id_b?: number;
  resolved: boolean;
  resolution_note?: string;
  created_at: string;
}

// ─── Report ──────────────────────────────────────────────────────────────────
export interface Report {
  id: number;
  patient_id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size?: number;
  report_date?: string | null;
  report_type?: string | null;
  report_title?: string | null;
  lab_name?: string | null;
  doctor_name?: string | null;
  ocr_used: boolean;
  status: ReportStatus;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
  lab_results: LabResult[];
  ai_summary?: AISummary | null;
  conflicts: Conflict[];
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_patients: number;
  total_reports: number;
  total_results: number;
  pending_reviews: number;
  open_conflicts: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_patients: Array<{
    id: number;
    patient_id: string;
    name: string;
    age?: number;
    sex?: string;
    report_count: number;
    last_report?: string;
  }>;
  recent_reports: Array<{
    id: number;
    original_filename: string;
    patient_id: number;
    report_date?: string;
    status: ReportStatus;
    created_at: string;
  }>;
}
