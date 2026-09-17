import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Radio,
  Bell,
  Sun,
  Moon,
  Menu,
  User,
  LogOut,
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { NotificationCenterModal } from '@/components/notifications/NotificationCenterModal';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';
import { useTheme } from '@/context/ThemeContext';
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext';

interface HeaderProps {
  systemStatus?: 'healthy' | 'degraded' | 'unhealthy' | string;
  version?: string;
  onToggleSidebar?: () => void;
  isMinimal?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus = 'healthy',
  version = '0.1.0',
  onToggleSidebar,
  isMinimal = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(3);

  const isAuthRoute = isMinimal || location.pathname === '/login' || location.pathname === '/register';

  const roleColorBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'GOVERNMENT':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
      case 'FARMER':
      default:
        return 'bg-agri-500/15 text-agri-600 dark:text-agri-400 border-agri-500/30';
    }
  };

  return (
    <>
      <header className="min-h-[3.75rem] sm:h-16 pt-[max(env(safe-area-inset-top,0px),0.5rem)] sm:pt-0 pb-1.5 sm:pb-0 border-b border-agri-200/40 dark:border-agri-800/30 bg-white/95 dark:bg-surface-darkCard/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Sidebar Toggle (Only on authenticated pages) */}
          {!isAuthRoute && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle Navigation Menu"
              title="Toggle Sidebar"
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/40 dark:hover:bg-agri-800/60 border border-agri-200/50 dark:border-agri-700/30 text-agri-700 dark:text-agri-300 transition shrink-0"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Logo & Brand Identity */}
          <div
            onClick={() => {
              if (isAuthRoute) {
                navigate('/login');
              } else {
                navigate(getRoleDashboardPath(user?.role));
              }
            }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white dark:bg-agri-900/60 border border-agri-200/60 dark:border-agri-700/30 p-0.5 overflow-hidden flex items-center justify-center shadow-md shadow-agri-500/10 group-hover:scale-105 group-hover:shadow-agri-500/20 transition-all duration-200 shrink-0">
              <img src="/agri-logo.png" alt="AgriShield Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-base font-black tracking-tight text-agri-900 dark:text-white group-hover:text-agri-600 dark:group-hover:text-accent-lime transition font-display whitespace-nowrap">
                  AGRI SHIELD
                </span>
                <span className="hidden md:inline-block text-[10px] bg-agri-50 dark:bg-agri-800/50 text-agri-600 dark:text-agri-400 px-1.5 py-0.5 rounded-md font-mono border border-agri-200/50 dark:border-agri-700/30 font-semibold">
                  v{version}
                </span>
              </div>
              <p className="text-[11px] text-agri-500/70 dark:text-agri-400/60 hidden sm:block truncate">
                Precision Agricultural Security & Diagnostics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* System State Badge (Only on authenticated pages) */}
          {!isAuthRoute && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-agri-50 dark:bg-agri-800/40 border border-agri-200/50 dark:border-agri-700/30">
              <Radio className="w-3.5 h-3.5 text-agri-500/60 dark:text-agri-400/50" />
              <span className="text-xs text-agri-600 dark:text-agri-400 font-medium">State:</span>
              <StatusBadge status={systemStatus} size="sm" />
            </div>
          )}



          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/40 dark:hover:bg-agri-800/60 text-agri-600 hover:text-agri-800 dark:text-agri-300 dark:hover:text-white border border-agri-200/50 dark:border-agri-700/30 transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-agri-700" />
            )}
          </button>

          {/* Notifications Bell (Only on authenticated pages) */}
          {!isAuthRoute && (
            <button
              type="button"
              aria-label="Alerts"
              onClick={() => setIsNotifOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/40 dark:hover:bg-agri-800/60 text-agri-600 hover:text-agri-800 dark:text-agri-300 dark:hover:text-white border border-agri-200/50 dark:border-agri-700/30 transition relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Profile Avatar / Sign In Button & Role Badge */}
          {!isAuthRoute && isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/40 dark:hover:bg-agri-800/60 border border-agri-200/50 dark:border-agri-700/30 transition text-left"
                title="View Profile & Role Info"
              >
                <div className="hidden md:block leading-tight">
                  <p className="text-xs font-bold text-agri-900 dark:text-agri-100 truncate max-w-[120px]">
                    {user.full_name.split(' ')[0]}
                  </p>
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold font-mono uppercase ${roleColorBadge(
                      typeof user.role === 'string' ? user.role : (user.role as any)?.name || 'FARMER'
                    )}`}
                  >
                    {typeof user.role === 'string' ? user.role : (user.role as any)?.name || 'FARMER'}
                  </span>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-sm ${
                    (typeof user.role === 'string' ? user.role : (user.role as any)?.name) === 'ADMIN'
                      ? 'bg-purple-600'
                      : (typeof user.role === 'string' ? user.role : (user.role as any)?.name) === 'GOVERNMENT'
                      ? 'bg-sky-600'
                      : 'bg-gradient-to-br from-agri-500 to-agri-700'
                  }`}
                >
                  {user.full_name.charAt(0)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-xl text-agri-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border border-agri-200/50 dark:border-agri-800/30"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : isAuthRoute ? (
            location.pathname === '/login' ? (
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="px-3.5 py-1.5 rounded-xl bg-agri-500/10 hover:bg-agri-500/20 text-agri-600 dark:text-agri-400 text-xs font-bold transition border border-agri-500/25"
              >
                Register
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 rounded-xl bg-agri-500/10 hover:bg-agri-500/20 text-agri-600 dark:text-agri-400 text-xs font-bold transition border border-agri-500/25"
              >
                Sign In
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-agri-500 to-agri-600 hover:from-agri-600 hover:to-agri-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-agri-500/25"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {!isAuthRoute && (
        <NotificationCenterModal
          isOpen={isNotifOpen}
          onClose={() => setIsNotifOpen(false)}
          onUpdateCount={(c) => setUnreadCount(c)}
        />
      )}

      {isOnboardingModalOpen && (
        <OnboardingWizard onClose={() => setIsOnboardingModalOpen(false)} />
      )}
    </>
  );
};
