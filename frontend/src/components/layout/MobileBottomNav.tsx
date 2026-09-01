import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  Sprout,
  Activity,
  Menu,
} from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext';

interface MobileBottomNavProps {
  onToggleMenu: () => void;
  isMenuOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onToggleMenu,
  isMenuOpen,
}) => {
  const { user } = useAuth();
  const dashboardPath = getRoleDashboardPath(user?.role);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-colors duration-200"
    >
      <div className="grid grid-cols-5 h-16 items-center px-2">
        {/* 1. Dashboard */}
        <NavLink
          to={dashboardPath}
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all duration-200 ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-emerald-500/15' : ''}`}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="truncate max-w-[56px]">Home</span>
            </>
          )}
        </NavLink>

        {/* 2. Disease Identification */}
        <NavLink
          to="/diagnosis"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all duration-200 ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-emerald-500/15' : ''}`}>
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="truncate max-w-[56px]">Diagnose</span>
            </>
          )}
        </NavLink>

        {/* 3. Advisories */}
        <NavLink
          to="/advisories"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all duration-200 ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-emerald-500/15' : ''}`}>
                <Sprout className="w-5 h-5" />
              </div>
              <span className="truncate max-w-[56px]">Advisory</span>
            </>
          )}
        </NavLink>

        {/* 4. Monitoring Loop */}
        <NavLink
          to="/monitoring"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all duration-200 ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-xl transition ${isActive ? 'bg-emerald-500/15' : ''}`}>
                <Activity className="w-5 h-5" />
              </div>
              <span className="truncate max-w-[56px]">Monitor</span>
            </>
          )}
        </NavLink>

        {/* 5. Menu Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleMenu}
          className={`flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all duration-200 ${
            isMenuOpen
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          aria-label="Toggle Navigation Drawer"
        >
          <div className={`p-1 rounded-xl transition ${isMenuOpen ? 'bg-emerald-500/15' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="truncate max-w-[56px]">Menu</span>
        </button>
      </div>
    </nav>
  );
};
