import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Heart,
  Plus,
  ClipboardList,
  TrendingUp,
  Sprout,
  Mic,
  Bug,
  Users,
  Plane,
  User,
  Settings,
  LayoutDashboard,
  BrainCircuit,
  Shield,
  Activity,
  KeyRound,
  FileText,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RoleType } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  iconColor?: string;
  badge?: string;
}

interface SidebarProps {
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, isMobileDrawer = false }) => {
  const { user } = useAuth();
  const rawRole = user?.role;
  let role: RoleType =
    typeof rawRole === 'string'
      ? (rawRole as RoleType)
      : ((rawRole as any)?.name as RoleType) || 'FARMER';

  if (role === 'GOVERNMENT' && user?.department === 'EXTENSION_WORKER') {
    role = 'EXTENSION_WORKER';
  }

  // 1. Farmer Specific Navigation
  const farmerNavItems: NavItem[] = [
    { to: '/farmer/dashboard', label: 'Farmer Dashboard', icon: LayoutDashboard, iconColor: 'text-[#f97316]' },
    { to: '/analysis', label: 'AI Disease Analysis', icon: BrainCircuit, iconColor: 'text-[#ec4899]' },
    { to: '/onboarding/create-field', label: 'Add Farm', icon: Plus, iconColor: 'text-[#a855f7]' },
    { to: '/field-map', label: 'My Farm', icon: ClipboardList, iconColor: 'text-[#eab308]' },
    { to: '/monitoring', label: 'Follow-Up Tracking', icon: Activity, badge: 'Loop', iconColor: 'text-[#38bdf8]' },
    { to: '/advisories', label: 'Crop Advisories', icon: Sprout, badge: 'IPM', iconColor: 'text-[#84cc16]' },
    { to: '/validation', label: 'Expert Validation', icon: ShieldCheck, iconColor: 'text-[#60a5fa]' },
    { to: '/diagnosis', label: 'Symptom Disease ID', icon: Stethoscope, badge: 'AI', iconColor: 'text-[#22c55e]' },
    { to: '/community', label: 'Community Hub', icon: MessageSquare, iconColor: 'text-[#c084fc]' },
    { to: '/drones', label: 'Drone Fleet & Missions', icon: Plane, iconColor: 'text-[#f43f5e]' },
    { to: '/profile', label: 'Account Profile', icon: User, iconColor: 'text-[#a855f7]' },
    { to: '/settings', label: 'System Settings', icon: Settings, iconColor: 'text-[#9ca3af]' },
  ];

  // 2. Government Officer Navigation
  const governmentNavItems: NavItem[] = [
    { to: '/government/dashboard', label: 'Regional Command', icon: LayoutDashboard, iconColor: 'text-[#38bdf8]' },
    { to: '/monitoring', label: 'Follow-Up Monitoring', icon: Activity, badge: 'Active', iconColor: 'text-[#4ade80]' },
    { to: '/validation', label: 'Expert Validation', icon: ShieldCheck, badge: 'Cases', iconColor: 'text-[#f59e0b]' },
    { to: '/advisories', label: 'Regional Advisories', icon: Sprout, iconColor: 'text-[#84cc16]' },
    { to: '/officer', label: 'Extension Console', icon: Shield, badge: 'Official', iconColor: 'text-[#a855f7]' },
    { to: '/field-map', label: 'Jurisdiction Map', icon: ClipboardList, iconColor: 'text-[#eab308]' },
    { to: '/spread', label: 'Spread Risk Analysis', icon: Activity, iconColor: 'text-[#ec4899]' },
    { to: '/community', label: 'Farmer Advisory Hub', icon: MessageSquare, iconColor: 'text-[#c084fc]' },
    { to: '/analysis', label: 'Diagnostic Verification', icon: BrainCircuit, iconColor: 'text-[#f43f5e]' },
    { to: '/profile', label: 'Official Profile', icon: User, iconColor: 'text-[#a855f7]' },
    { to: '/settings', label: 'Regional Settings', icon: Settings, iconColor: 'text-[#9ca3af]' },
  ];

  // 3. Extension Worker Navigation
  const extensionNavItems: NavItem[] = [
    { to: '/extension/dashboard', label: 'Field Operations', icon: LayoutDashboard, badge: 'Queue', iconColor: 'text-[#38bdf8]' },
    { to: '/field-map', label: 'Jurisdiction Map', icon: ClipboardList, iconColor: 'text-[#eab308]' },
    { to: '/validation', label: 'Expert Validation', icon: ShieldCheck, iconColor: 'text-[#f59e0b]' },
    { to: '/advisories', label: 'Regional Advisories', icon: Sprout, iconColor: 'text-[#84cc16]' },
    { to: '/monitoring', label: 'Follow-Up Monitoring', icon: Activity, iconColor: 'text-[#4ade80]' },
    { to: '/profile', label: 'Worker Profile', icon: User, iconColor: 'text-[#a855f7]' },
    { to: '/settings', label: 'Settings', icon: Settings, iconColor: 'text-[#9ca3af]' },
  ];

  // 4. System Administrator Navigation
  const adminNavItems: NavItem[] = [
    { to: '/admin/dashboard', label: 'Admin Console', icon: KeyRound, badge: 'Root', iconColor: 'text-[#a855f7]' },
    { to: '/monitoring', label: 'Monitoring Engine', icon: Activity, iconColor: 'text-[#4ade80]' },
    { to: '/validation', label: 'Validation System', icon: ShieldCheck, iconColor: 'text-[#f59e0b]' },
    { to: '/advisories', label: 'Advisory Engine', icon: Sprout, iconColor: 'text-[#84cc16]' },
    { to: '/admin/users', label: 'User & RBAC Security', icon: Users, iconColor: 'text-[#38bdf8]' },
    { to: '/admin/audit-logs', label: 'Security & Audit Logs', icon: FileText, iconColor: 'text-[#eab308]' },
    { to: '/field-map', label: 'Global Field Grid', icon: ClipboardList, iconColor: 'text-[#eab308]' },
    { to: '/drones', label: 'Drone Infrastructure', icon: Plane, iconColor: 'text-[#f43f5e]' },
    { to: '/community', label: 'Global Moderation', icon: MessageSquare, iconColor: 'text-[#c084fc]' },
    { to: '/profile', label: 'Admin Profile', icon: User, iconColor: 'text-[#a855f7]' },
    { to: '/settings', label: 'System Config', icon: Settings, iconColor: 'text-[#9ca3af]' },
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
      ? 'ADMIN MENU'
      : role === 'GOVERNMENT'
      ? 'OFFICER MENU'
      : role === 'EXTENSION_WORKER'
      ? 'EXTENSION MENU'
      : 'FARMER MENU';

  return (
    <aside
      className="w-72 max-w-full border-r border-slate-200 dark:border-[#382b30] bg-white dark:bg-[#1e191b] text-slate-700 dark:text-[#d8cbcf] flex flex-col justify-between p-4 overflow-y-auto shrink-0 shadow-2xl transition-colors duration-200 h-full"
    >
      <div className="space-y-3">
        {/* Mobile Close Button (Only visible in drawer mode) */}
        {onClose && (
          <div className="flex justify-end px-1 pt-0.5 pb-2.5 border-b border-slate-200 dark:border-[#35282d]/80">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#291f24] hover:bg-slate-200 dark:hover:bg-[#382a30] text-slate-600 dark:text-[#d8cbcf] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#3e2e34] transition"
              aria-label="Close menu"
              title="Close Farmer Menu"
            >
              ✕
            </button>
          </div>
        )}

        {/* Menu Header Section */}
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#8d7e84]">
            {roleLabel}
          </span>
          <span
            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              role === 'ADMIN'
                ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30'
                : role === 'GOVERNMENT'
                ? 'bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30'
                : 'bg-orange-100 dark:bg-[#38201b] text-orange-600 dark:text-[#df6845] border-orange-200 dark:border-[#5e2f23]'
            }`}
          >
            {role.replace('_', ' ')}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
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
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-[12.5px] font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-orange-50 dark:bg-[#2b1715] border border-orange-200 dark:border-[#d65b38]/50 text-orange-600 dark:text-[#f56f48] font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-[#d8cbcf] hover:bg-slate-50 dark:hover:bg-[#221a1d] hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-[17px] h-[17px] flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                      item.iconColor || 'text-[#8d7e84]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/40 text-white/90">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
