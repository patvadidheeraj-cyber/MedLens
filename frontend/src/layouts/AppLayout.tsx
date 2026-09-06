import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, AlertTriangle,
  Settings, LogOut, Menu, X, Activity, ChevronRight
} from 'lucide-react';
import { cn, getInitials } from '../utils';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NAV: NavItem[] = [
  { to: '/dashboard',   icon: <LayoutDashboard size={18} />, label: 'Dashboard'   },
  { to: '/patients',    icon: <Users size={18} />,           label: 'Patients'    },
  { to: '/reports',     icon: <FileText size={18} />,        label: 'Reports'     },
  { to: '/conflicts',   icon: <AlertTriangle size={18} />,   label: 'Conflicts'   },
  { to: '/settings',    icon: <Settings size={18} />,        label: 'Settings'    },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={cn(
      'flex flex-col h-full bg-white border-r border-gray-200',
      mobile ? 'w-full' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
          <Activity className="text-white" size={18} />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-base tracking-tight">MedLens</span>
          <p className="text-[10px] text-gray-400 leading-none mt-0.5 font-medium">Clinical Intelligence</p>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={active ? 'nav-link-active' : 'nav-link'}
            >
              {icon}
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="text-brand-500" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-gray-900/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col shadow-2xl">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — minimal */}
        <header className="flex items-center gap-4 px-6 py-3.5 bg-white border-b border-gray-200 shrink-0">
          <button
            id="mobile-menu-btn"
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* User avatar in header for quick reference */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-[11px] font-bold">
              {user ? getInitials(user.name) : '?'}
            </div>
            <span className="font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
