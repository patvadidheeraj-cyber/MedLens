import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppLayout } from './layouts/AppLayout';
import { LoadingSpinner } from './components/LoadingSpinner';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientProfilePage from './pages/PatientProfilePage';
import ReportsPage from './pages/ReportsPage';
import ConflictsPage from './pages/ConflictsPage';
import SettingsPage from './pages/SettingsPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner className="min-h-screen" size="lg" label="Loading MedLens…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner className="min-h-screen" size="lg" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />

      {/* Protected */}
      <Route path="/dashboard"      element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/patients"       element={<RequireAuth><PatientsPage /></RequireAuth>} />
      <Route path="/patients/:id"   element={<RequireAuth><PatientProfilePage /></RequireAuth>} />
      <Route path="/reports"        element={<RequireAuth><ReportsPage /></RequireAuth>} />
      <Route path="/conflicts"      element={<RequireAuth><ConflictsPage /></RequireAuth>} />
      <Route path="/settings"       element={<RequireAuth><SettingsPage /></RequireAuth>} />

      {/* Default */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
