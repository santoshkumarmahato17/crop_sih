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
  Sprout,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RoleType } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface SidebarProps {
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, isMobileDrawer = false }) => {
  const { user } = useAuth();
  const rawRole = user?.role;
  const role: RoleType =
    typeof rawRole === 'string'
      ? (rawRole as RoleType)
      : ((rawRole as any)?.name as RoleType) || 'FARMER';

  // 1. Farmer Specific Navigation
  const farmerNavItems: NavItem[] = [
    { to: '/farmer/dashboard', label: 'Farmer Dashboard', icon: LayoutDashboard },
    { to: '/monitoring', label: 'Follow-Up Tracking', icon: Activity, badge: 'Loop' },
    { to: '/advisories', label: 'Crop Advisories', icon: Sprout, badge: 'IPM' },
    { to: '/validation', label: 'Expert Validation', icon: ShieldCheck },
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
    { to: '/monitoring', label: 'Follow-Up Monitoring', icon: Activity, badge: 'Active' },
    { to: '/validation', label: 'Expert Validation', icon: ShieldCheck, badge: 'Cases' },
    { to: '/advisories', label: 'Regional Advisories', icon: Sprout },
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
    { to: '/monitoring', label: 'Monitoring Engine', icon: Activity },
    { to: '/validation', label: 'Validation System', icon: ShieldCheck },
    { to: '/advisories', label: 'Advisory Engine', icon: Sprout },
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
    <aside
      className={`w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl transition-colors duration-200 flex flex-col justify-between p-4 overflow-y-auto ${
        isMobileDrawer ? 'h-full' : 'min-h-[calc(100vh-4rem)] hidden lg:flex'
      }`}
    >
      <div className="space-y-4">
        <div>
          {/* Mobile Drawer Top Header with close button */}
          {isMobileDrawer && (
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 p-0.5 border border-emerald-500/20">
                  <img src="/agri-logo.png" alt="AgriShield" className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">AGRI SHIELD</span>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              )}
            </div>
          )}

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
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
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
                    <Icon className="w-4 h-4 flex-shrink-0" />
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
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-[11px] space-y-1 mt-4">
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
