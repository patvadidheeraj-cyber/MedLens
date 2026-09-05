import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInYears } from 'date-fns';
import type { ResultStatus, ReportStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d?: string | null, fmt = 'MMM d, yyyy'): string {
  if (!d) return '—';
  try {
    return format(parseISO(d), fmt);
  } catch {
    try {
      return format(new Date(d), fmt);
    } catch {
      return d;
    }
  }
}

export function ageFromDob(dob?: string | null): string {
  if (!dob) return '—';
  try {
    const age = differenceInYears(new Date(), parseISO(dob));
    return `${age} yrs`;
  } catch {
    return '—';
  }
}

export function fileSize(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function statusBadgeClass(status: ResultStatus): string {
  switch (status) {
    case 'normal':   return 'badge-normal';
    case 'low':      return 'badge-low';
    case 'high':     return 'badge-high';
    case 'conflict': return 'badge-conflict';
    default:         return 'badge-unknown';
  }
}

export function statusLabel(status: ResultStatus): string {
  switch (status) {
    case 'normal':   return 'Normal';
    case 'low':      return 'Low';
    case 'high':     return 'High';
    case 'conflict': return 'Conflict';
    default:         return 'Unknown';
  }
}

export function reportStatusClass(status: ReportStatus): string {
  switch (status) {
    case 'complete':   return 'status-complete';
    case 'processing': return 'status-processing';
    case 'pending':    return 'status-pending';
    case 'failed':     return 'status-failed';
  }
}

export function reportStatusLabel(status: ReportStatus): string {
  switch (status) {
    case 'complete':   return 'Complete';
    case 'processing': return 'Processing';
    case 'pending':    return 'Pending';
    case 'failed':     return 'Failed';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function confidencePct(c?: number | null): string {
  if (c === null || c === undefined) return '—';
  return `${Math.round(c * 100)}%`;
}
