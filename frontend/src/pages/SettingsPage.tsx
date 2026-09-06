import React from 'react';
import { Settings, Info, ShieldCheck, Brain, Database } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1>Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your workspace preferences</p>
      </div>

      {/* Account */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-brand-600" />
          <h2>Account</h2>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Name</p>
            <p className="text-sm text-gray-800 mt-0.5">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Email</p>
            <p className="text-sm text-gray-800 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* AI Provider info */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-brand-600" />
          <h2>AI Provider</h2>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <Info size={15} className="text-brand-600 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            The AI provider is configured via the <code className="bg-gray-200 px-1 rounded text-xs">AI_PROVIDER</code> environment variable on the server.
            Set <code className="bg-gray-200 px-1 rounded text-xs">AI_PROVIDER=mock</code> for demo mode (no API key required),
            or <code className="bg-gray-200 px-1 rounded text-xs">AI_PROVIDER=openai</code> with an <code className="bg-gray-200 px-1 rounded text-xs">OPENAI_API_KEY</code> for real extraction.
          </p>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-600" />
          <h2>Privacy &amp; Safety</h2>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <p>• All data is stored locally in your database instance.</p>
          <p>• MedLens is NOT a medical diagnostic system.</p>
          <p>• AI summaries are informational only and NOT medical advice.</p>
          <p>• Always consult a qualified healthcare professional for medical decisions.</p>
        </div>
      </div>

      {/* About */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-brand-600" />
          <h2>About MedLens</h2>
        </div>
        <p className="text-sm text-gray-500">Version 1.0.0 · AI-Powered Clinical Information Intelligence</p>
        <p className="text-xs text-gray-400">
          MedLens organizes medical information to help humans review it more effectively.
          It does not diagnose conditions, recommend treatments, or replace professional medical judgment.
        </p>
      </div>
    </div>
  );
}
