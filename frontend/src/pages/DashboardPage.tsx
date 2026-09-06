import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, FileText, FlaskConical, Clock, AlertTriangle,
  UserPlus, ArrowRight, RefreshCw
} from 'lucide-react';
import { dashboardService } from '../services/medlens';
import type { DashboardData } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { ReportStatusBadge } from '../components/ReportStatusBadge';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  to?: string;
}

function StatCard({ icon, label, value, bg, to }: StatCardProps) {
  const inner = (
    <div className="card p-5 flex items-center gap-4 transition-all duration-150">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
  if (to) return <Link to={to} className="block">{inner}</Link>;
  return inner;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getStats();
      setData(res.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner className="mt-20" size="lg" label="Loading dashboard…" />;
  if (error || !data) return <ErrorMessage title="Dashboard unavailable" message={error} onRetry={load} />;

  const { stats, recent_patients, recent_reports } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening in your workspace.</p>
        </div>
        <div className="flex gap-2">
          <button
            id="dashboard-add-patient-btn"
            onClick={() => navigate('/patients')}
            className="btn-secondary"
          >
            <UserPlus size={16} /> Add Patient
          </button>
          <button
            id="dashboard-refresh-btn"
            onClick={load}
            className="btn-secondary"
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} className="text-brand-600" />}
          label="Total Patients"
          value={stats.total_patients}
          bg="bg-brand-50"
          to="/patients"
        />
        <StatCard
          icon={<FileText size={20} className="text-violet-600" />}
          label="Total Reports"
          value={stats.total_reports}
          bg="bg-violet-50"
          to="/reports"
        />
        <StatCard
          icon={<FlaskConical size={20} className="text-emerald-600" />}
          label="Extracted Tests"
          value={stats.total_results}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-600" />}
          label="Pending Reviews"
          value={stats.pending_reviews}
          bg="bg-amber-50"
        />
      </div>

      {/* Open conflicts banner */}
      {stats.open_conflicts > 0 && (
        <Link
          to="/conflicts"
          id="dashboard-conflicts-banner"
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition"
        >
          <AlertTriangle className="text-amber-600 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {stats.open_conflicts} unresolved conflict{stats.open_conflicts !== 1 ? 's' : ''} detected
            </p>
            <p className="text-xs text-amber-600">Review inconsistencies across reports</p>
          </div>
          <ArrowRight size={16} className="text-amber-600" />
        </Link>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent patients */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Patients</h2>
            <Link to="/patients" className="text-xs text-brand-600 hover:underline font-medium">
              View all
            </Link>
          </div>
          {recent_patients.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No patients yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Patient</th>
                  <th className="table-header">Age</th>
                  <th className="table-header">Reports</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {recent_patients.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.patient_id}</div>
                    </td>
                    <td className="table-cell text-gray-500">{p.age ? `${p.age} yrs` : '—'}</td>
                    <td className="table-cell text-gray-500">{p.report_count}</td>
                    <td className="table-cell">
                      <Link
                        to={`/patients/${p.id}`}
                        id={`patient-link-${p.id}`}
                        className="text-xs text-brand-600 hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent reports */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Reports</h2>
            <Link to="/reports" className="text-xs text-brand-600 hover:underline font-medium">
              View all
            </Link>
          </div>
          {recent_reports.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="text-gray-300 mx-auto mb-3" size={32} />
              <p className="text-gray-400 text-sm">No reports uploaded yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Report</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody>
                {recent_reports.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="table-cell">
                      <p className="font-medium text-gray-900 truncate max-w-[160px]">{r.original_filename}</p>
                    </td>
                    <td className="table-cell text-gray-500 whitespace-nowrap">{formatDate(r.report_date || r.created_at)}</td>
                    <td className="table-cell"><ReportStatusBadge status={r.status} /></td>
                    <td className="table-cell">
                      <button
                        id={`report-view-${r.id}`}
                        onClick={() => navigate(`/patients/${r.patient_id}`)}
                        className="text-xs text-brand-600 hover:underline font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
