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
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Farmer Dashboard', icon: LayoutDashboard },
  { to: '/diagnosis', label: 'Symptom Disease ID', icon: Stethoscope },
  { to: '/upload', label: 'Upload Studio', icon: UploadCloud },
  { to: '/analysis', label: 'AI Disease Analysis', icon: BrainCircuit },
  { to: '/community', label: 'Community Hub', icon: MessageSquare },
  { to: '/field-map', label: 'Precision Field Map', icon: Map },
  { to: '/officer', label: 'Extension Officer', icon: Shield },
  { to: '/drones', label: 'Drone Fleet & Missions', icon: Plane },
  { to: '/profile', label: 'Account Profile', icon: User },
  { to: '/settings', label: 'System Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl transition-colors duration-200 flex flex-col justify-between p-3.5 min-h-[calc(100vh-4rem)]">
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
            Platform Navigation
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>AI Telemetry Engine</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">LIVE</span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
          Deep learning disease classification & multispectral processing active.
        </p>
      </div>
    </aside>
  );
};

