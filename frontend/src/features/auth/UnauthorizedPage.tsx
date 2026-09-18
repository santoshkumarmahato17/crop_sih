import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext';

interface UnauthorizedPageProps {
  requiredRole?: string;
  message?: string;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  requiredRole,
  message = 'You do not have permission to access this section.',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardPath = getRoleDashboardPath(user?.role);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/90 dark:bg-surface-darkCard/90 border border-rose-500/30 shadow-2xl backdrop-blur-2xl text-center space-y-6 animate-in fade-in-50 duration-200">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-mono font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>HTTP 403 • ACCESS FORBIDDEN</span>
          </div>

          <h1 className="text-2xl font-black text-agri-900 dark:text-white tracking-tight">
            Access Restricted
          </h1>

          <p className="text-xs text-agri-600 dark:text-agri-300 leading-relaxed">
            {message}
          </p>

          {user && (
            <div className="pt-2">
              <div className="inline-block px-3 py-1.5 rounded-xl bg-agri-50 dark:bg-agri-800/50 border border-agri-200/50 dark:border-agri-700/30 text-xs">
                <span className="text-agri-500/70 dark:text-agri-400/70 font-semibold">Your current role: </span>
                <span className="font-extrabold text-agri-600 dark:text-agri-400 font-mono">
                  {typeof user.role === 'string' ? user.role : (user.role as any)?.name || 'FARMER'}
                </span>
                {requiredRole && (
                  <span className="text-agri-500/70 dark:text-agri-400/70 block text-[11px] mt-0.5">
                    Required: <span className="font-bold text-rose-500">{requiredRole}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-agri-50 dark:bg-agri-800/50 hover:bg-agri-100 dark:hover:bg-agri-700/40 text-agri-800 dark:text-agri-200 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(dashboardPath)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-agri-500 hover:bg-agri-500 text-white text-xs font-extrabold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
