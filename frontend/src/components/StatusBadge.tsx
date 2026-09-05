import React from 'react';
import { TrendingDown, TrendingUp, Minus, AlertTriangle, HelpCircle } from 'lucide-react';
import type { ResultStatus } from '../types';
import { statusBadgeClass, statusLabel } from '../utils';

interface Props {
  status: ResultStatus;
}

const icons: Record<ResultStatus, React.ReactNode> = {
  normal:   <Minus size={11} />,
  low:      <TrendingDown size={11} />,
  high:     <TrendingUp size={11} />,
  unknown:  <HelpCircle size={11} />,
  conflict: <AlertTriangle size={11} />,
};

export function StatusBadge({ status }: Props) {
  return (
    <span className={statusBadgeClass(status)} aria-label={`Status: ${statusLabel(status)}`}>
      {icons[status]}
      {statusLabel(status)}
    </span>
  );
}
