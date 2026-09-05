import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Edit2, Calendar, User, Pill, AlertTriangle,
  Activity, FileText, FlaskConical, Brain, Info, ShieldAlert,
  CheckCircle2, XCircle, Loader2, TrendingDown, TrendingUp, Minus,
  HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { patientService, reportService } from '../services/medlens';
import type { Patient, Report, LabResult, Conflict } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { StatusBadge } from '../components/StatusBadge';
import { ReportStatusBadge } from '../components/ReportStatusBadge';
import { Modal } from '../components/Modal';
import { UploadDropzone } from '../components/UploadDropzone';
import { formatDate, ageFromDob, getInitials, confidencePct } from '../utils';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-slate-800 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function TimelineItem({ report, onView }: { report: Report; onView: () => void }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
          <FileText size={14} className="text-brand-600" />
        </div>
        <div className="w-0.5 bg-slate-100 flex-1 mt-1" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-900">{report.original_filename}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {report.report_type || 'Medical Report'} · {formatDate(report.report_date || report.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ReportStatusBadge status={report.status} />
            <button
              id={`view-report-${report.id}`}
              onClick={onView}
              className="text-xs text-brand-600 hover:underline"
            >
              View
            </button>
          </div>
        </div>
        {report.lab_name && (
          <p className="text-xs text-slate-500 mt-1">{report.lab_name}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">{report.lab_results.length} result{report.lab_results.length !== 1 ? 's' : ''} extracted</p>
      </div>
    </div>
  );
}

function LabResultRow({ result }: { result: LabResult }) {
  return (
    <tr className="table-row">
      <td className="table-cell font-medium text-slate-900">{result.test_name}</td>
      <td className="table-cell text-slate-700 font-mono text-sm">{result.value_raw}</td>
      <td className="table-cell text-slate-500">{result.unit || '—'}</td>
      <td className="table-cell text-slate-500">{result.ref_range_raw || '—'}</td>
      <td className="table-cell"><StatusBadge status={result.status} /></td>
      <td className="table-cell text-slate-500 whitespace-nowrap">{formatDate(result.result_date)}</td>
      <td className="table-cell text-slate-400 text-xs">{confidencePct(result.confidence)}</td>
    </tr>
  );
}

function ConflictCard({ conflict, onResolve }: { conflict: Conflict; onResolve: (id: number, note: string) => void }) {
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <div className={`border rounded-xl p-4 ${conflict.resolved ? 'border-slate-100 bg-slate-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {conflict.resolved
            ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            : <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          }
          <div>
            <p className="text-sm font-semibold text-slate-900">{conflict.test_name}</p>
            <p className="text-xs text-slate-500 capitalize mt-0.5">{conflict.conflict_type.replace(/_/g, ' ')}</p>
            <p className="text-sm text-slate-700 mt-1">{conflict.description}</p>
            {conflict.resolved && conflict.resolution_note && (
              <p className="text-xs text-emerald-700 mt-1">Resolved: {conflict.resolution_note}</p>
            )}
          </div>
        </div>
        {!conflict.resolved && (
          <button
            id={`resolve-conflict-${conflict.id}`}
            onClick={() => setOpen((v) => !v)}
            className="btn-secondary text-xs shrink-0"
          >
            {open ? 'Cancel' : 'Resolve'}
          </button>
        )}
      </div>
      {open && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add resolution note…"
            className="input flex-1 text-sm"
            id={`conflict-note-${conflict.id}`}
          />
          <button
            onClick={() => { onResolve(conflict.id, note); setOpen(false); }}
            className="btn-primary text-sm"
            id={`confirm-resolve-${conflict.id}`}
          >
            Mark resolved
          </button>
        </div>
      )}
    </div>
  );
}

function ReportDetail({ report, onClose }: { report: Report; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-slate-400">Type:</span> <span className="text-slate-800">{report.report_type || '—'}</span></div>
        <div><span className="text-slate-400">Date:</span> <span className="text-slate-800">{formatDate(report.report_date)}</span></div>
        <div><span className="text-slate-400">Lab:</span> <span className="text-slate-800">{report.lab_name || '—'}</span></div>
        <div><span className="text-slate-400">Doctor:</span> <span className="text-slate-800">{report.doctor_name || '—'}</span></div>
        <div><span className="text-slate-400">OCR used:</span> <span className="text-slate-800">{report.ocr_used ? 'Yes' : 'No'}</span></div>
        <div><span className="text-slate-400">Results:</span> <span className="text-slate-800">{report.lab_results.length}</span></div>
      </div>

      {report.lab_results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Test</th>
                <th className="table-header">Value</th>
                <th className="table-header">Unit</th>
                <th className="table-header">Ref Range</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.lab_results.map((lr) => (
                <tr key={lr.id} className="table-row">
                  <td className="table-cell font-medium">{lr.test_name}</td>
                  <td className="table-cell font-mono">{lr.value_raw}</td>
                  <td className="table-cell text-slate-500">{lr.unit || '—'}</td>
                  <td className="table-cell text-slate-500">{lr.ref_range_raw || '—'}</td>
                  <td className="table-cell"><StatusBadge status={lr.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report.ai_summary && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">AI Summary</span>
            <span className="text-xs text-blue-500">({report.ai_summary.provider})</span>
          </div>
          <p className="text-sm text-blue-900 whitespace-pre-wrap">{report.ai_summary.summary_text}</p>
        </div>
      )}

      <button onClick={onClose} className="btn-secondary w-full justify-center">Close</button>
    </div>
  );
}

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'timeline' | 'conflicts' | 'summary'>('overview');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [pRes, rRes] = await Promise.all([
        patientService.get(Number(id)),
        reportService.list(Number(id)),
      ]);
      setPatient(pRes.data);
      setReports(rRes.data);
    } catch {
      setError('Failed to load patient profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (file: File, onProgress: (pct: number) => void) => {
    await reportService.upload(Number(id), file, onProgress);
  };

  const handleResolveConflict = async (conflictId: number, note: string) => {
    await reportService.resolveConflict(conflictId, note);
    load();
  };

  if (loading) return <LoadingSpinner className="mt-20" size="lg" label="Loading patient profile…" />;
  if (error || !patient) return <ErrorMessage title="Patient not found" message={error} onRetry={load} />;

  // Aggregate all lab results across reports
  const allResults = reports.flatMap((r) => r.lab_results.map((lr) => ({ ...lr, report: r })));
  const allConflicts = reports.flatMap((r) => r.conflicts);
  const openConflicts = allConflicts.filter((c) => !c.resolved);
  const latestSummary = [...reports].reverse().find((r) => r.ai_summary)?.ai_summary;

  const TABS = [
    { key: 'overview',  label: 'Overview',  icon: <User size={14} /> },
    { key: 'results',   label: `Results (${allResults.length})`, icon: <FlaskConical size={14} /> },
    { key: 'timeline',  label: 'Timeline',  icon: <Calendar size={14} /> },
    { key: 'conflicts', label: `Conflicts ${openConflicts.length > 0 ? `(${openConflicts.length})` : ''}`, icon: <AlertTriangle size={14} /> },
    { key: 'summary',   label: 'AI Summary', icon: <Brain size={14} /> },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="card p-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-bold shrink-0">
            {getInitials(patient.name)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">{patient.patient_id}</span>
              {patient.date_of_birth && <span>{ageFromDob(patient.date_of_birth)}</span>}
              {patient.sex && <span>{patient.sex}</span>}
              <span>{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            id="upload-report-btn"
            onClick={() => setShowUpload(true)}
            className="btn-primary"
          >
            <Upload size={15} /> Upload Report
          </button>
          <button
            id="edit-patient-profile-btn"
            className="btn-secondary"
            onClick={() => navigate(`/patients/${id}/edit`)}
          >
            <Edit2 size={15} /> Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <User size={16} className="text-brand-600" />
                <h2 className="text-sm font-semibold text-slate-900">Patient Information</h2>
                <span className="ml-auto text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">User Provided</span>
              </div>
              <dl className="space-y-3">
                <InfoRow label="Date of Birth" value={patient.date_of_birth ? formatDate(patient.date_of_birth) : null} />
                <InfoRow label="Sex" value={patient.sex} />
                <InfoRow label="Symptoms" value={patient.symptoms} />
                <InfoRow label="Existing Conditions" value={patient.existing_conditions} />
                <InfoRow label="Allergies" value={patient.allergies} />
                <InfoRow label="Current Medications" value={patient.current_medications} />
                <InfoRow label="Additional Notes" value={patient.additional_notes} />
              </dl>
              {!patient.symptoms && !patient.existing_conditions && (
                <p className="text-sm text-slate-400 italic">No clinical information entered.</p>
              )}
            </div>

            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-brand-600" />
                <h2 className="text-sm font-semibold text-slate-900">Quick Stats</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Reports', value: reports.length, color: 'text-brand-600 bg-brand-50' },
                  { label: 'Lab Results', value: allResults.length, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Open Conflicts', value: openConflicts.length, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Abnormal Results', value: allResults.filter((r) => r.status === 'low' || r.status === 'high').length, color: 'text-red-600 bg-red-50' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {activeTab === 'results' && (
          <div className="card overflow-hidden">
            {allResults.length === 0 ? (
              <div className="py-16 text-center">
                <FlaskConical className="text-slate-300 mx-auto mb-3" size={36} />
                <p className="text-slate-500">No lab results extracted yet.</p>
                <p className="text-xs text-slate-400 mt-1">Upload a report to extract results.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header">Test</th>
                      <th className="table-header">Value</th>
                      <th className="table-header">Unit</th>
                      <th className="table-header">Reference Range</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Date</th>
                      <th className="table-header">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allResults.map((r) => <LabResultRow key={r.id} result={r} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="card p-6">
            {reports.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="text-slate-300 mx-auto mb-3" size={36} />
                <p className="text-slate-500">No reports yet.</p>
              </div>
            ) : (
              <div>
                {[...reports]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((r) => (
                    <TimelineItem key={r.id} report={r} onView={() => setViewReport(r)} />
                  ))
                }
              </div>
            )}
          </div>
        )}

        {/* CONFLICTS */}
        {activeTab === 'conflicts' && (
          <div className="space-y-3">
            {allConflicts.length === 0 ? (
              <div className="card py-16 text-center">
                <CheckCircle2 className="text-emerald-400 mx-auto mb-3" size={36} />
                <p className="text-slate-500 font-medium">No conflicts detected</p>
                <p className="text-xs text-slate-400 mt-1">All reports appear consistent.</p>
              </div>
            ) : (
              allConflicts.map((c) => (
                <ConflictCard key={c.id} conflict={c} onResolve={handleResolveConflict} />
              ))
            )}
          </div>
        )}

        {/* AI SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800">Important Disclaimer</p>
                <p className="text-amber-700 mt-1">
                  AI-generated summaries are for informational purposes only. They are NOT medical diagnoses,
                  treatment recommendations, or professional medical advice. Always consult a qualified
                  healthcare professional for any medical decisions.
                </p>
              </div>
            </div>

            {latestSummary ? (
              <div className="card p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-brand-600" />
                  <h2 className="font-semibold text-slate-900">Patient Summary</h2>
                  <span className="text-xs text-slate-400 ml-auto">
                    Generated {formatDate(latestSummary.generated_at)} · {latestSummary.provider}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {latestSummary.summary_text}
                </p>
              </div>
            ) : (
              <div className="card py-16 text-center">
                <Brain className="text-slate-300 mx-auto mb-3" size={36} />
                <p className="text-slate-500">No AI summary available yet.</p>
                <p className="text-xs text-slate-400 mt-1">Upload and process a report to generate a summary.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Medical Report" size="md">
        <UploadDropzone
          patientId={Number(id)}
          onUpload={handleUpload}
          onComplete={() => { setShowUpload(false); load(); }}
        />
      </Modal>

      {/* Report detail modal */}
      <Modal
        open={!!viewReport}
        onClose={() => setViewReport(null)}
        title={viewReport?.original_filename || 'Report Details'}
        size="xl"
      >
        {viewReport && <ReportDetail report={viewReport} onClose={() => setViewReport(null)} />}
      </Modal>
    </div>
  );
}
