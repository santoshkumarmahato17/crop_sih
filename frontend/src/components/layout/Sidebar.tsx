import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  BrainCircuit,
  Stethoscope,
  MessageSquare,
  Map,
  Shield,
  Plane,
  Settings,
  Activity,
  User,
  Users,
  KeyRound,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RoleType } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role: RoleType = user?.role || 'FARMER';

  // 1. Farmer Specific Navigation
  const farmerNavItems: NavItem[] = [
    { to: '/farmer/dashboard', label: 'Farmer Dashboard', icon: LayoutDashboard },
    { to: '/diagnosis', label: 'Symptom Disease ID', icon: Stethoscope, badge: 'AI' },
    { to: '/upload', label: 'Upload Studio', icon: UploadCloud },
    { to: '/analysis', label: 'AI Disease Analysis', icon: BrainCircuit },
    { to: '/community', label: 'Community Hub', icon: MessageSquare },
    { to: '/field-map', label: 'Precision Field Map', icon: Map },
    { to: '/drones', label: 'Drone Fleet & Missions', icon: Plane },
    { to: '/profile', label: 'Account Profile', icon: User },
    { to: '/settings', label: 'System Settings', icon: Settings },
  ];

  // 2. Government Officer Navigation
  const governmentNavItems: NavItem[] = [
    { to: '/government/dashboard', label: 'Regional Command', icon: LayoutDashboard },
    { to: '/officer', label: 'Extension Console', icon: Shield, badge: 'Official' },
    { to: '/field-map', label: 'Jurisdiction Map', icon: Map },
    { to: '/spread', label: 'Spread Risk Analysis', icon: Activity },
    { to: '/community', label: 'Farmer Advisory Hub', icon: MessageSquare },
    { to: '/analysis', label: 'Diagnostic Verification', icon: BrainCircuit },
    { to: '/profile', label: 'Official Profile', icon: User },
    { to: '/settings', label: 'Regional Settings', icon: Settings },
  ];

  // 3. System Administrator Navigation
  const adminNavItems: NavItem[] = [
    { to: '/admin/dashboard', label: 'Admin Console', icon: KeyRound, badge: 'Root' },
    { to: '/admin/users', label: 'User & RBAC Security', icon: Users },
    { to: '/admin/audit-logs', label: 'Security & Audit Logs', icon: FileText },
    { to: '/field-map', label: 'Global Field Grid', icon: Map },
    { to: '/drones', label: 'Drone Infrastructure', icon: Plane },
    { to: '/community', label: 'Global Moderation', icon: MessageSquare },
    { to: '/profile', label: 'Admin Profile', icon: User },
    { to: '/settings', label: 'System Config', icon: Settings },
  ];

  const currentNavItems =
    role === 'ADMIN'
      ? adminNavItems
      : role === 'GOVERNMENT'
      ? governmentNavItems
      : farmerNavItems;

  const roleLabel =
    role === 'ADMIN'
      ? 'Administrator Controls'
      : role === 'GOVERNMENT'
      ? 'Government Authority'
      : 'Farmer Operations';

  return (
    <aside className="w-60 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl transition-colors duration-200 flex flex-col justify-between p-3.5 min-h-[calc(100vh-4rem)]">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {roleLabel}
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                role === 'ADMIN'
                  ? 'bg-purple-500/10 text-purple-500 border-purple-500/30'
                  : role === 'GOVERNMENT'
                  ? 'bg-sky-500/10 text-sky-500 border-sky-500/30'
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
              }`}
            >
              {role}
            </span>
          </div>

          <nav className="mt-2 space-y-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? role === 'ADMIN'
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : role === 'GOVERNMENT'
                          ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                          : 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-slate-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/20 text-white/90">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Role Footer Card */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
          <span>RBAC Protected</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          Session verified under role <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{role}</span>.
        </p>
      </div>
    </aside>
  );
};
