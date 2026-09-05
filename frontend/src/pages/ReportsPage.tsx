import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { reportService } from '../services/medlens';
import type { Report } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { ReportStatusBadge } from '../components/ReportStatusBadge';
import { formatDate } from '../utils';
import { useNavigate } from 'react-router-dom';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await reportService.list();
      setReports(res.data);
    } catch {
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1>Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">{reports.length} report{reports.length !== 1 ? 's' : ''} total</p>
        </div>
        <button id="reports-refresh-btn" onClick={load} className="btn-secondary" aria-label="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : error ? (
          <ErrorMessage title="Failed to load reports" message={error} onRetry={load} />
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FileText className="text-slate-300" size={48} />
            <p className="text-slate-500 font-medium">No reports yet</p>
            <p className="text-xs text-slate-400">Upload reports from a patient's profile page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Report</th>
                  <th className="table-header">Patient</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Results</th>
                  <th className="table-header">Status</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-900 truncate max-w-[200px]">{r.original_filename}</span>
                      </div>
                    </td>
                    <td className="table-cell text-slate-500">#{r.patient_id}</td>
                    <td className="table-cell text-slate-500 whitespace-nowrap">{formatDate(r.report_date || r.created_at)}</td>
                    <td className="table-cell text-slate-500">{r.report_type || '—'}</td>
                    <td className="table-cell text-slate-500">{r.lab_results.length}</td>
                    <td className="table-cell"><ReportStatusBadge status={r.status} /></td>
                    <td className="table-cell">
                      <button
                        id={`go-to-patient-${r.id}`}
                        onClick={() => navigate(`/patients/${r.patient_id}`)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        View Patient
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
