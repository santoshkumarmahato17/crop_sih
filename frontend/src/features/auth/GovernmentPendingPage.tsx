import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const GovernmentPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-darkBg p-4">
      <div className="max-w-md w-full bg-white dark:bg-surface-darkCard p-8 rounded-2xl shadow-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Verification Pending
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Hello {user?.full_name}, your government account is currently awaiting administrative review and approval. 
            You will receive full access to the regional dashboard once an administrator verifies your credentials.
          </p>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
