import React from 'react';
import { GitCompare } from 'lucide-react';

export default function ComparisonsPage() {
  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1>Comparisons</h1>
        <p className="text-slate-500 text-sm mt-0.5">Side-by-side report comparison</p>
      </div>
      <div className="card flex flex-col items-center justify-center py-24 gap-4">
        <GitCompare className="text-slate-300" size={48} />
        <p className="text-slate-500 font-medium">Comparison view coming soon</p>
        <p className="text-xs text-slate-400 max-w-sm text-center">
          Select two or more reports from a patient's profile to compare results side by side.
        </p>
      </div>
    </div>
  );
}
