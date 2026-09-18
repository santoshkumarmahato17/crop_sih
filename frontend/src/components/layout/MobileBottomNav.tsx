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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-surface-darkCard/95 backdrop-blur-xl border-t border-agri-200/40 dark:border-agri-800/30 pb-safe shadow-[0_-4px_20px_rgba(18,61,42,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] transition-colors duration-300"
    >
      <div className="grid grid-cols-5 h-16 items-center px-2">
        {/* 1. Dashboard */}
        <NavLink
          to={dashboardPath}
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 h-full py-1 text-[10px] font-bold transition-all duration-200 ${
              isActive
                ? 'text-agri-600 dark:text-accent-lime scale-105'
                : 'text-agri-500/60 dark:text-agri-400/50 hover:text-agri-800 dark:hover:text-agri-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-agri-500/15 dark:bg-accent-lime/10' : ''}`}>
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
                ? 'text-agri-600 dark:text-accent-lime scale-105'
                : 'text-agri-500/60 dark:text-agri-400/50 hover:text-agri-800 dark:hover:text-agri-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-agri-500/15 dark:bg-accent-lime/10' : ''}`}>
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
                ? 'text-agri-600 dark:text-accent-lime scale-105'
                : 'text-agri-500/60 dark:text-agri-400/50 hover:text-agri-800 dark:hover:text-agri-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-agri-500/15 dark:bg-accent-lime/10' : ''}`}>
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
                ? 'text-agri-600 dark:text-accent-lime scale-105'
                : 'text-agri-500/60 dark:text-agri-400/50 hover:text-agri-800 dark:hover:text-agri-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-agri-500/15 dark:bg-accent-lime/10' : ''}`}>
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
              ? 'text-agri-600 dark:text-accent-lime'
              : 'text-agri-500/60 dark:text-agri-400/50 hover:text-agri-800 dark:hover:text-agri-200'
          }`}
          aria-label="Toggle Navigation Drawer"
        >
          <div className={`p-1.5 rounded-xl transition ${isMenuOpen ? 'bg-agri-500/15 dark:bg-accent-lime/10' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="truncate max-w-[56px]">Menu</span>
        </button>
      </div>
    </nav>
  );
};
