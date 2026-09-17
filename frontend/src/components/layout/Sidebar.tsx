import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
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
  Pentagon,
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
    { to: '/analysis', label: 'AI Disease Analysis', icon: BrainCircuit },
    { to: '/onboarding/create-field', label: 'Draw Satellite Field', icon: Pentagon, badge: 'EOS' },
    { to: '/field-map', label: 'Precision Field Map', icon: Map },
    { to: '/monitoring', label: 'Follow-Up Tracking', icon: Activity, badge: 'Loop' },
    { to: '/advisories', label: 'Crop Advisories', icon: Sprout, badge: 'IPM' },
    { to: '/validation', label: 'Expert Validation', icon: ShieldCheck },
    { to: '/diagnosis', label: 'Symptom Disease ID', icon: Stethoscope, badge: 'AI' },
    { to: '/community', label: 'Community Hub', icon: MessageSquare },
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

  // 3. Extension Worker Navigation
  const extensionNavItems: NavItem[] = [
    { to: '/extension/dashboard', label: 'Field Operations', icon: LayoutDashboard, badge: 'Queue' },
    { to: '/field-map', label: 'Jurisdiction Map', icon: Map },
    { to: '/validation', label: 'Expert Validation', icon: ShieldCheck },
    { to: '/advisories', label: 'Regional Advisories', icon: Sprout },
    { to: '/monitoring', label: 'Follow-Up Monitoring', icon: Activity },
    { to: '/profile', label: 'Worker Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  // 4. System Administrator Navigation
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
      : role === 'EXTENSION_WORKER'
      ? extensionNavItems
      : farmerNavItems;

  const roleLabel =
    role === 'ADMIN'
      ? 'Administrator Controls'
      : role === 'GOVERNMENT'
      ? 'Government Operations'
      : role === 'EXTENSION_WORKER'
      ? 'Field Officer Operations'
      : 'Farmer Operations';

  return (
    <aside
      className={`w-64 border-r border-agri-200/60 dark:border-agri-800/40 bg-white/95 dark:bg-surface-darkCard/95 backdrop-blur-2xl transition-colors duration-300 flex flex-col justify-between p-3.5 overflow-y-auto shrink-0 shadow-sidebar dark:shadow-none ${
        isMobileDrawer ? 'h-full' : 'h-full hidden lg:flex'
      }`}
    >
      <div className="space-y-3">
        <div>
          {/* Mobile Drawer Top Header with close button */}
          {isMobileDrawer && (
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-agri-200/60 dark:border-agri-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-agri-500/10 p-0.5 border border-agri-500/20">
                  <img src="/agri-logo.png" alt="AgriShield" className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-extrabold text-agri-900 dark:text-white font-display">AGRI SHIELD</span>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-agri-100 hover:bg-agri-200 dark:bg-agri-800/60 dark:hover:bg-agri-800 text-agri-600 dark:text-agri-300 transition"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-agri-500/70 dark:text-agri-400/60">
              {roleLabel}
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                role === 'ADMIN'
                  ? 'bg-purple-500/10 text-purple-500 border-purple-500/30'
                  : role === 'GOVERNMENT'
                  ? 'bg-sky-500/10 text-sky-500 border-sky-500/30'
                  : 'bg-agri-500/10 text-agri-500 border-agri-500/30'
              }`}
            >
              {role}
            </span>
          </div>

          <nav className="mt-1.5 space-y-0.5">
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
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 group ${
                      isActive
                        ? role === 'ADMIN'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                          : role === 'GOVERNMENT'
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                          : 'bg-gradient-to-r from-agri-500 to-agri-600 text-white shadow-md shadow-agri-500/25'
                        : 'text-agri-700 dark:text-agri-300/80 hover:bg-agri-50 dark:hover:bg-agri-800/40 hover:text-agri-900 dark:hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/15 text-white/90">
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
      <div className="p-3 rounded-2xl bg-agri-50 dark:bg-agri-900/40 border border-agri-200/60 dark:border-agri-700/30 text-[11px] space-y-1 mt-4">
        <div className="flex items-center gap-1.5 font-bold text-agri-800 dark:text-agri-200">
          <ShieldAlert className="w-3.5 h-3.5 text-agri-500" />
          <span>RBAC Protected</span>
        </div>
        <p className="text-[10px] text-agri-600/70 dark:text-agri-400/60 leading-tight">
          Session verified under role <span className="font-mono font-bold text-agri-700 dark:text-agri-300">{role}</span>.
        </p>
      </div>
    </aside>
  );
};
