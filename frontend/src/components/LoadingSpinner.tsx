import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = { sm: 16, md: 24, lg: 40 };

export function LoadingSpinner({ className, size = 'md', label = 'Loading…' }: Props) {
  return (
    <div className={cn('flex items-center justify-center gap-2 text-gray-400', className)} role="status" aria-label={label}>
      <Loader2 size={sizeMap[size]} className="animate-spin" />
      {size !== 'sm' && <span className="text-sm">{label}</span>}
    </div>
  );
}
