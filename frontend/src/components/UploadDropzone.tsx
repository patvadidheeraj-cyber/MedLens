import React, { useCallback, useState } from 'react';
import { Upload, FileText, Image, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn, fileSize } from '../utils';

interface Props {
  patientId: number;
  onUpload: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  onComplete: () => void;
}

type Stage = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

const STEPS = [
  'Uploading file',
  'Extracting text',
  'Reading report',
  'Extracting medical data',
  'Validating',
  'Complete',
];

export function UploadDropzone({ patientId: _patientId, onUpload, onComplete }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [uploadPct, setUploadPct] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED.includes(f.type)) {
      setError('Unsupported file type. Please upload a PDF, PNG, or JPG.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File is too large. Maximum size is 20 MB.');
      return;
    }
    setFile(f);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const startUpload = useCallback(async () => {
    if (!file) return;
    setStage('uploading');
    setCurrentStep(0);

    const stepTimer = (step: number, delay: number) =>
      setTimeout(() => setCurrentStep(step), delay);

    try {
      await onUpload(file, (pct) => setUploadPct(pct));
      stepTimer(1, 200);
      stepTimer(2, 800);
      stepTimer(3, 1600);
      stepTimer(4, 2800);
      stepTimer(5, 3600);
      setTimeout(() => {
        setStage('complete');
        setTimeout(onComplete, 1500);
      }, 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload failed. Please try again.';
      setError(msg);
      setStage('error');
    }
  }, [file, onUpload, onComplete]);

  const reset = () => {
    setFile(null);
    setStage('idle');
    setUploadPct(0);
    setCurrentStep(0);
    setError(null);
  };

  const isProcessing = stage === 'uploading' || stage === 'processing';

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {stage === 'idle' && (
        <label
          htmlFor="file-upload"
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all',
            dragging
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <Upload className="text-brand-600" size={24} />
          </div>
          <p className="font-medium text-gray-800">Drag &amp; drop file here</p>
          <p className="text-sm text-gray-500 mt-1">or</p>
          <span className="btn-primary mt-3">Browse Files</span>
          <p className="text-xs text-gray-400 mt-4">PDF, PNG, JPG — max 20 MB</p>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={handleInputChange}
          />
        </label>
      )}

      {/* File preview */}
      {file && stage === 'idle' && (
        <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
          {file.type === 'application/pdf'
            ? <FileText className="text-rose-500 shrink-0" size={28} />
            : <Image className="text-sky-500 shrink-0" size={28} />
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{fileSize(file.size)}</p>
          </div>
          <button onClick={reset} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Remove file">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Upload button */}
      {file && stage === 'idle' && (
        <button id="upload-submit-btn" onClick={startUpload} className="btn-primary w-full justify-center">
          <Upload size={16} />
          Upload &amp; Process Report
        </button>
      )}

      {/* Progress steps */}
      {isProcessing && (
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step} className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                  done ? 'bg-emerald-500 text-white' :
                  active ? 'bg-brand-600 text-white' :
                  'bg-gray-100 text-gray-400'
                )}>
                  {done ? <CheckCircle2 size={14} /> :
                   active ? <Loader2 size={12} className="animate-spin" /> :
                   <span className="text-xs font-medium">{i + 1}</span>
                  }
                </div>
                <span className={cn(
                  'text-sm',
                  done ? 'text-emerald-700 font-medium' :
                  active ? 'text-gray-900 font-medium' :
                  'text-gray-400'
                )}>
                  {step}
                  {done && ' ✓'}
                </span>
              </div>
            );
          })}

          {/* Upload progress bar */}
          {uploadPct > 0 && uploadPct < 100 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading</span>
                <span>{uploadPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete */}
      {stage === 'complete' && (
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <p className="font-semibold text-gray-800">Report uploaded successfully!</p>
          <p className="text-sm text-gray-500">Results are being extracted in the background.</p>
        </div>
      )}

      {/* Error state */}
      {stage === 'error' && (
        <button onClick={reset} className="btn-secondary w-full justify-center">
          Try again
        </button>
      )}
    </div>
  );
}
