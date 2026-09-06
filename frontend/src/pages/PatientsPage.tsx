import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, Edit2, Trash2, Eye, Calendar, Users } from 'lucide-react';
import { patientService } from '../services/medlens';
import type { Patient, PatientCreate } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { Modal } from '../components/Modal';
import { formatDate, ageFromDob, getInitials } from '../utils';
import { useDebounce } from '../hooks/useDebounce';

function PatientForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Patient>;
  onSave: (data: PatientCreate) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<PatientCreate>({
    name: initial?.name || '',
    date_of_birth: initial?.date_of_birth || '',
    sex: initial?.sex || '',
    symptoms: initial?.symptoms || '',
    existing_conditions: initial?.existing_conditions || '',
    allergies: initial?.allergies || '',
    current_medications: initial?.current_medications || '',
    additional_notes: initial?.additional_notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof PatientCreate) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Patient name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      (Object.keys(payload) as (keyof PatientCreate)[]).forEach((key) => {
        if (payload[key] === '') {
          delete payload[key];
        }
      });
      await onSave(payload);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Save failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>
      )}

      {/* USER PROVIDED label */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">User Provided</span>
        <span className="text-xs text-gray-400">— This information is entered by the user, not AI-generated.</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label" htmlFor="pf-name">Full name <span className="text-rose-500">*</span></label>
          <input id="pf-name" className="input" value={form.name} onChange={set('name')} placeholder="Patient full name" required />
        </div>
        <div>
          <label className="label" htmlFor="pf-dob">Date of birth</label>
          <input id="pf-dob" type="date" className="input" value={form.date_of_birth || ''} onChange={set('date_of_birth')} />
        </div>
        <div>
          <label className="label" htmlFor="pf-sex">Sex</label>
          <select id="pf-sex" className="input" value={form.sex || ''} onChange={set('sex')}>
            <option value="">Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="pf-symptoms">Symptoms</label>
          <textarea id="pf-symptoms" className="input resize-none h-20" value={form.symptoms || ''} onChange={set('symptoms')} placeholder="Current or reported symptoms…" />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="pf-conditions">Existing conditions</label>
          <textarea id="pf-conditions" className="input resize-none h-16" value={form.existing_conditions || ''} onChange={set('existing_conditions')} placeholder="Diagnosed conditions, chronic illnesses…" />
        </div>
        <div>
          <label className="label" htmlFor="pf-allergies">Allergies</label>
          <textarea id="pf-allergies" className="input resize-none h-16" value={form.allergies || ''} onChange={set('allergies')} placeholder="Drug or food allergies…" />
        </div>
        <div>
          <label className="label" htmlFor="pf-medications">Current medications</label>
          <textarea id="pf-medications" className="input resize-none h-16" value={form.current_medications || ''} onChange={set('current_medications')} placeholder="Medications currently taking…" />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="pf-notes">Additional notes</label>
          <textarea id="pf-notes" className="input resize-none h-16" value={form.additional_notes || ''} onChange={set('additional_notes')} placeholder="Any other relevant information…" />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
        <button id="patient-form-save-btn" type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Saving…' : 'Save Patient'}
        </button>
      </div>
    </form>
  );
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await patientService.list(debouncedSearch);
      setPatients(res.data.patients);
      setTotal(res.data.total);
    } catch {
      setError('Failed to load patients.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: PatientCreate) => {
    await patientService.create(data);
    setShowAdd(false);
    load();
  };

  const handleEdit = async (data: PatientCreate) => {
    if (!editTarget) return;
    await patientService.update(editTarget.id, data);
    setEditTarget(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await patientService.delete(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Patients</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} patient{total !== 1 ? 's' : ''} total</p>
        </div>
        <button id="add-patient-btn" onClick={() => setShowAdd(true)} className="btn-primary">
          <UserPlus size={16} /> Add Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          id="patient-search"
          type="text"
          placeholder="Search patients by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : error ? (
          <ErrorMessage title="Failed to load" message={error} onRetry={load} />
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="text-gray-300" size={48} />
            <p className="text-gray-500 font-medium">No patients found</p>
            <button id="empty-add-patient-btn" onClick={() => setShowAdd(true)} className="btn-primary">
              <UserPlus size={16} /> Add first patient
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Patient</th>
                <th className="table-header">Age / Sex</th>
                <th className="table-header">Reports</th>
                <th className="table-header">Added</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-50 ring-1 ring-brand-200 flex items-center justify-center text-brand-700 text-sm font-semibold shrink-0">
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <Link to={`/patients/${p.id}`} id={`patient-row-${p.id}`} className="font-medium text-gray-900 hover:text-brand-600">
                          {p.name}
                        </Link>
                        <p className="text-xs text-gray-400">{p.patient_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span>{ageFromDob(p.date_of_birth)}</span>
                    {p.sex && <span className="ml-1 text-gray-400">· {p.sex}</span>}
                  </td>
                  <td className="table-cell text-gray-600">{p.report_count}</td>
                  <td className="table-cell text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(p.created_at)}
                    </div>
                  </td>
                  <td className="table-cell relative">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        id={`view-patient-${p.id}`}
                        onClick={(e) => { e.stopPropagation(); navigate(`/patients/${p.id}`); }}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        title="View profile"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        id={`edit-patient-${p.id}`}
                        onClick={(e) => { e.stopPropagation(); setEditTarget(p); }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        id={`delete-patient-${p.id}`}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Patient" size="lg">
        <PatientForm onSave={handleCreate} onCancel={() => setShowAdd(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Patient" size="lg">
        {editTarget && (
          <PatientForm initial={editTarget} onSave={handleEdit} onCancel={() => setEditTarget(null)} />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Patient" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will permanently
            remove all their reports and extracted data.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button id="confirm-delete-patient-btn" onClick={handleDelete} className="btn-danger flex-1 justify-center">Delete Patient</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
