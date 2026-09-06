import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = 'Something went wrong', message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <AlertCircle className="text-rose-400" size={40} />
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        {message && <p className="text-sm text-gray-500 mt-1 max-w-sm">{message}</p>}
      </div>
      {onRetry && (
        <button className="btn-secondary mt-2" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
