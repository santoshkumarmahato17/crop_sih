import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
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
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Toggle (Only on authenticated pages) */}
          {!isAuthRoute && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle Navigation Menu"
              title="Toggle Sidebar"
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              <Menu className="w-5 h-5" />
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
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  AGRI SHIELD
                </span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-700 font-semibold">
                  v{version}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Precision Agricultural Security & Diagnostics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* System State Badge (Only on authenticated pages) */}
          {!isAuthRoute && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <Radio className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">State:</span>
              <StatusBadge status={systemStatus} size="sm" />
            </div>
          )}

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Notifications Bell (Only on authenticated pages) */}
          {!isAuthRoute && (
            <button
              type="button"
              aria-label="Alerts"
              onClick={() => setIsNotifOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
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
                className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition text-left"
                title="View Profile & Role Info"
              >
                <div className="hidden md:block leading-tight">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                    {user.full_name.split(' ')[0]}
                  </p>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded border text-[9px] font-extrabold font-mono uppercase ${roleColorBadge(
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
                      : 'bg-emerald-600'
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
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border border-slate-200 dark:border-slate-800"
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
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition border border-emerald-500/30"
              >
                Register
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition border border-emerald-500/30"
              >
                Sign In
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
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
    </>
  );
};
