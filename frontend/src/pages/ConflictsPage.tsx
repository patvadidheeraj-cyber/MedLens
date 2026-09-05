import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { reportService } from '../services/medlens';
import type { Conflict } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { formatDate } from '../utils';
import { useNavigate } from 'react-router-dom';

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const resolved = filter === 'all' ? undefined : filter === 'resolved';
      const res = await reportService.getAllConflicts(undefined, resolved);
      setConflicts(res.data);
    } catch {
      setError('Failed to load conflicts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleResolve = async (id: number, note: string) => {
    await reportService.resolveConflict(id, note);
    load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1>Conflicts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Detected inconsistencies across reports</p>
        </div>
        <div className="flex gap-2">
          {(['open', 'resolved', 'all'] as const).map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn-primary' : 'btn-secondary'}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button id="conflicts-refresh-btn" onClick={load} className="btn-secondary" aria-label="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : error ? (
        <ErrorMessage title="Failed to load" message={error} onRetry={load} />
      ) : conflicts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 gap-3">
          <CheckCircle2 className="text-emerald-400" size={48} />
          <p className="text-slate-600 font-medium">No {filter !== 'all' ? filter : ''} conflicts found</p>
          <p className="text-xs text-slate-400">All reports appear consistent.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conflicts.map((c) => (
            <div key={c.id} className={`card p-5 ${c.resolved ? '' : 'border-amber-200'}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  {c.resolved
                    ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    : <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className="font-semibold text-slate-900">{c.test_name}</p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">{c.conflict_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-700 mt-2">{c.description}</p>
                    {c.resolved && c.resolution_note && (
                      <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Resolved: {c.resolution_note}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">{formatDate(c.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!c.resolved && (
                    <button
                      id={`resolve-btn-${c.id}`}
                      onClick={() => {
                        const note = prompt('Resolution note (optional):') ?? '';
                        handleResolve(c.id, note);
                      }}
                      className="btn-secondary text-sm"
                    >
                      Resolve
                    </button>
                  )}
                  <button
                    id={`conflict-view-patient-${c.id}`}
                    onClick={() => navigate(`/patients/${c.patient_id}`)}
                    className="btn-secondary text-sm"
                  >
                    View Patient
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
