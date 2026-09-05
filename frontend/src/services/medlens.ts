import api from './api';
import type { AuthToken, Patient, PatientCreate, Report, DashboardData, Conflict } from '../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthToken>('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post<AuthToken>('/auth/register', { name, email, password }),

  me: () => api.get('/auth/me'),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardService = {
  getStats: () => api.get<DashboardData>('/dashboard/stats'),
};

// ─── Patients ────────────────────────────────────────────────────────────────
export const patientService = {
  list: (search = '', skip = 0, limit = 50) =>
    api.get<{ patients: Patient[]; total: number }>('/patients', {
      params: { search, skip, limit },
    }),

  get: (id: number) => api.get<Patient>(`/patients/${id}`),

  create: (data: PatientCreate) => api.post<Patient>('/patients', data),

  update: (id: number, data: Partial<PatientCreate>) =>
    api.put<Patient>(`/patients/${id}`, data),

  delete: (id: number) => api.delete(`/patients/${id}`),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportService = {
  list: (patientId?: number) =>
    api.get<Report[]>('/reports', { params: patientId ? { patient_id: patientId } : {} }),

  get: (id: number) => api.get<Report>(`/reports/${id}`),

  upload: (patientId: number, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('patient_id', String(patientId));
    form.append('file', file);
    return api.post<Report>('/reports', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  delete: (id: number) => api.delete(`/reports/${id}`),

  getAllConflicts: (patientId?: number, resolved?: boolean) =>
    api.get<Conflict[]>('/reports/conflicts/all', {
      params: {
        ...(patientId !== undefined ? { patient_id: patientId } : {}),
        ...(resolved !== undefined ? { resolved } : {}),
      },
    }),

  resolveConflict: (conflictId: number, note: string) =>
    api.patch<Conflict>(`/reports/conflicts/${conflictId}/resolve`, {
      resolution_note: note,
    }),
};
