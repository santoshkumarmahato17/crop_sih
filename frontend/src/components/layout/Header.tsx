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
      <header className="min-h-[3.75rem] sm:h-16 pt-[max(env(safe-area-inset-top,0px),0.5rem)] sm:pt-0 pb-1.5 sm:pb-0 border-b border-[#261f22] bg-[#161314] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Logo & Brand Identity (Single straight line) */}
          <div
            onClick={() => {
              if (isAuthRoute) {
                navigate('/login');
              } else {
                navigate(getRoleDashboardPath(user?.role));
              }
            }}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="w-8 h-8 rounded-xl bg-[#241b1f] border border-[#382a30] p-1 flex items-center justify-center shadow-md shrink-0">
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#3b82f6] to-[#f97316] flex items-center justify-center text-white text-[10px] font-black">
                🛡️
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black tracking-tight text-white font-display whitespace-nowrap">
                KISAN SATHI
              </span>
              <span className="text-[10px] bg-[#241c20] text-[#8d7e84] px-1.5 py-0.5 rounded-md font-mono border border-[#382d33] font-semibold">
                v{version}
              </span>
            </div>
          </div>

          {/* MENU Button Toggle (Click to slide open Farmer Menu) */}
          {!isAuthRoute && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle Farmer Menu"
              title="Open Farmer Menu"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#241c20] hover:bg-[#2e2328] active:scale-95 border border-[#382d33] hover:border-[#d65b38]/50 text-white transition shrink-0 shadow-sm group"
            >
              <Menu className="w-4 h-4 text-[#d65b38] group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#d8cbcf] group-hover:text-white">
                MENU
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {/* System State Badge (Only on authenticated pages) */}
          {!isAuthRoute && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18261b] border border-[#2b442f] text-[#4ade80] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#4ade80] inline-block animate-pulse" />
              <span>State:</span>
              <span className="font-bold">Healthy</span>
            </div>
          )}

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-[#241c20] hover:bg-[#2e2328] border border-[#382d33] text-[#f59e0b] transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#f59e0b]" />
            ) : (
              <Moon className="w-4 h-4 text-[#d8cbcf]" />
            )}
          </button>

          {/* Notifications Bell (Only on authenticated pages) */}
          {!isAuthRoute && (
            <button
              type="button"
              aria-label="Alerts"
              onClick={() => setIsNotifOpen(true)}
              className="p-2 rounded-xl bg-[#241c20] hover:bg-[#2e2328] border border-[#382d33] text-[#d8cbcf] transition relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ef4444] text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-sm">
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
                className="flex items-center gap-2.5 p-1.5 px-3 rounded-xl bg-[#241c20] hover:bg-[#2e2328] border border-[#382d33] transition text-left"
                title="View Profile & Role Info"
              >
                <div className="hidden md:block leading-tight text-right">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">
                    {user.full_name ? user.full_name.split(' ')[0] : 'Suriya'}
                  </p>
                  <span className="text-[9px] font-mono font-bold uppercase text-[#8d7e84]">
                    {typeof user.role === 'string' ? user.role : (user.role as any)?.name || 'FARMER'}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#d97706] text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {user.full_name ? user.full_name.charAt(0) : 'S'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-xl text-[#8d7e84] hover:text-[#ef4444] hover:bg-[#2b1715] transition border border-[#382d33]"
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
                className="px-3.5 py-1.5 rounded-xl bg-[#241c20] hover:bg-[#2e2328] text-white text-xs font-bold transition border border-[#382d33]"
              >
                Register
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 rounded-xl bg-[#241c20] hover:bg-[#2e2328] text-white text-xs font-bold transition border border-[#382d33]"
              >
                Sign In
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
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
