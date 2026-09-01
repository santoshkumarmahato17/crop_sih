import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Briefcase,
  KeyRound,
} from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState<string>('ramanathan@agrishield.farm');
  const [password, setPassword] = useState<string>('FarmerSecure2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const userRole = await login(email, password);
      const destination = location.state?.from?.pathname || getRoleDashboardPath(userRole);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          'Invalid email or password credentials. Please try again.'
      );
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    try {
      const userRole = await login(demoEmail, demoPass);
      const destination = getRoleDashboardPath(userRole);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setErrorMsg('Demo authentication error. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md p-8 sm:p-9 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-white/60 dark:border-slate-700/60 shadow-2xl shadow-emerald-950/20 backdrop-blur-2xl space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-2 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md">
          <img src="/agri-logo.png" alt="AgriShield Logo" className="w-16 h-12 object-contain" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Sign In to AGRI SHIELD
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          Precision Agricultural Security & Diagnostic System
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farmer@agrishield.farm"
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Password *
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-semibold"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Role-Switcher Cards — 1-Tap Universal Multi-Role Login */}
      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 tracking-wider">
            1-Tap Demo Access (Select Role)
          </span>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            All Roles Ready
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* FARMER Role */}
          <button
            type="button"
            onClick={() => handleQuickDemo('ramanathan@agrishield.farm', 'FarmerSecure2026!')}
            className="p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-left transition group active:scale-95 shadow-sm hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-400">
                <User className="w-3.5 h-3.5" />
                <span>FARMER</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-700 dark:text-slate-300 block truncate mt-1 font-semibold">
              Dashboard & GIS
            </span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono block truncate mt-0.5">
              ramanathan@...
            </span>
          </button>

          {/* GOVERNMENT Role */}
          <button
            type="button"
            onClick={() => handleQuickDemo('sundaram@gov.agrishield.in', 'GovSecure2026!')}
            className="p-3 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-left transition group active:scale-95 shadow-sm hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-black text-sky-700 dark:text-sky-400">
                <Briefcase className="w-3.5 h-3.5" />
                <span>GOVT</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-700 dark:text-slate-300 block truncate mt-1 font-semibold">
              Regional Radar
            </span>
            <span className="text-[9px] text-sky-600 dark:text-sky-400 font-mono block truncate mt-0.5">
              sundaram@...
            </span>
          </button>

          {/* ADMIN Role */}
          <button
            type="button"
            onClick={() => handleQuickDemo('admin@agrishield.com', 'AdminRoot2026!')}
            className="p-3 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-left transition group active:scale-95 shadow-sm hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-black text-purple-700 dark:text-purple-400">
                <KeyRound className="w-3.5 h-3.5" />
                <span>ADMIN</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-700 dark:text-slate-300 block truncate mt-1 font-semibold">
              Master Console
            </span>
            <span className="text-[9px] text-purple-600 dark:text-purple-400 font-mono block truncate mt-0.5">
              admin@...
            </span>
          </button>
        </div>
      </div>

      {/* Footer Link to Register */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
