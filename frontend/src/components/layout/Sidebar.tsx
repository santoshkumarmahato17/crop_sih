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
  const role: RoleType =
    typeof rawRole === 'string'
      ? (rawRole as RoleType)
      : ((rawRole as any)?.name as RoleType) || 'FARMER';

  // 1. Farmer Specific Navigation matching uploaded design exactly
  const farmerNavItems: NavItem[] = [
    { to: '/farmer/dashboard', label: 'Home', icon: Home, iconColor: 'text-[#f97316]' },
    { to: '/analysis', label: 'Crop Health Check', icon: Heart, iconColor: 'text-[#ec4899]' },
    { to: '/onboarding/create-field', label: 'Add Farm', icon: Plus, iconColor: 'text-[#a855f7]' },
    { to: '/field-map', label: 'My Farm', icon: ClipboardList, iconColor: 'text-[#eab308]' },
    { to: '/monitoring', label: 'Crop Progress', icon: TrendingUp, iconColor: 'text-[#38bdf8]' },
    { to: '/advisories', label: 'Crop Advice', icon: Sprout, iconColor: 'text-[#84cc16]' },
    { to: '/validation', label: 'Ask an Expert', icon: Mic, iconColor: 'text-[#60a5fa]' },
    { to: '/diagnosis', label: 'Disease Check', icon: Bug, iconColor: 'text-[#22c55e]' },
    { to: '/community', label: 'Farmer Community', icon: Users, iconColor: 'text-[#c084fc]' },
    { to: '/drones', label: 'Drone Services', icon: Plane, iconColor: 'text-[#f43f5e]' },
    { to: '/profile', label: 'My Profile', icon: User, iconColor: 'text-[#a855f7]' },
    { to: '/settings', label: 'Settings', icon: Settings, iconColor: 'text-[#9ca3af]' },
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
    { to: '/community', label: 'Farmer Advisory Hub', icon: Users, iconColor: 'text-[#c084fc]' },
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
    { to: '/community', label: 'Global Moderation', icon: Users, iconColor: 'text-[#c084fc]' },
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
      className="w-72 max-w-full border-r border-[#382b30] bg-[#1e191b] text-[#d8cbcf] flex flex-col justify-between p-4 overflow-y-auto shrink-0 shadow-2xl transition-colors duration-200 h-full"
    >
      <div className="space-y-3">
        {/* Brand Header: Logo + KISAN SATHI (Single straight line) + v0.1.0 + Close Button */}
        <div className="flex items-center justify-between px-1 pt-0.5 pb-2.5 border-b border-[#35282d]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#291f24] border border-[#3e2e34] p-1 flex items-center justify-center shadow-md shrink-0">
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#3b82f6] to-[#f97316] flex items-center justify-center text-white text-[10px] font-black">
                🛡️
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white font-display whitespace-nowrap">
                KISAN SATHI
              </span>
              <span className="text-[10px] bg-[#291f24] text-[#8d7e84] font-mono px-1.5 py-0.5 rounded-md border border-[#3e2e34] font-semibold">
                v0.1.0
              </span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#291f24] hover:bg-[#382a30] text-[#d8cbcf] hover:text-white border border-[#3e2e34] transition"
              aria-label="Close menu"
              title="Close Farmer Menu"
            >
              ✕
            </button>
          )}
        </div>

        {/* Menu Header Section */}
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8d7e84]">
            {roleLabel}
          </span>
          <span
            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              role === 'ADMIN'
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                : role === 'GOVERNMENT'
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                : 'bg-[#38201b] text-[#df6845] border-[#5e2f23]'
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
                      ? 'bg-[#2b1715] border border-[#d65b38]/50 text-[#f56f48] font-semibold shadow-sm'
                      : 'text-[#d8cbcf] hover:bg-[#221a1d] hover:text-white border border-transparent'
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
