import React from 'react';
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { ReportStatus } from '../types';
import { reportStatusClass, reportStatusLabel } from '../utils';

interface Props {
  status: ReportStatus;
}

const icons: Record<ReportStatus, React.ReactNode> = {
  pending:    <Clock size={11} />,
  processing: <Loader2 size={11} className="animate-spin" />,
  complete:   <CheckCircle2 size={11} />,
  failed:     <XCircle size={11} />,
};

export function ReportStatusBadge({ status }: Props) {
  return (
    <span className={reportStatusClass(status)} aria-label={`Report status: ${reportStatusLabel(status)}`}>
      {icons[status]}
      {reportStatusLabel(status)}
    </span>
  );
}
