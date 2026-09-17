import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    try {
      const userRole = await login(email.trim(), password);
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

  return (
    <div className="w-full max-w-md p-8 sm:p-9 rounded-3xl bg-white/95 dark:bg-surface-darkCard/90 border border-agri-200/40 dark:border-agri-700/30 shadow-2xl shadow-agri-900/15 dark:shadow-black/30 backdrop-blur-2xl space-y-6 animate-scale-in">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-2 rounded-2xl bg-white dark:bg-agri-900/60 border border-agri-200/50 dark:border-agri-700/30 shadow-md shadow-agri-500/10">
          <img src="/agri-logo.png" alt="AgriShield Logo" className="w-16 h-12 object-contain" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-agri-900 dark:text-white font-display">
          Sign In to AGRI SHIELD
        </h1>
        <p className="text-xs text-agri-600/70 dark:text-agri-400/60 font-medium">
          Precision Agricultural Security & Diagnostic System
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-agri-400 dark:text-agri-500 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full bg-agri-50/50 dark:bg-agri-900/40 border border-agri-200/60 dark:border-agri-700/30 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/60 dark:placeholder-agri-500/40 focus:outline-none focus:border-agri-500 focus:ring-1 focus:ring-agri-500/30 font-semibold transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
              Password *
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] text-agri-600 dark:text-accent-lime font-extrabold hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-agri-400 dark:text-agri-500 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-agri-50/50 dark:bg-agri-900/40 border border-agri-200/60 dark:border-agri-700/30 rounded-xl pl-10 pr-10 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/60 dark:placeholder-agri-500/40 focus:outline-none focus:border-agri-500 focus:ring-1 focus:ring-agri-500/30 font-semibold transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-3 text-agri-400 hover:text-agri-600 dark:hover:text-agri-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-agri-500 to-agri-600 hover:from-agri-600 hover:to-agri-700 active:scale-95 text-white font-black text-xs transition-all duration-200 shadow-lg shadow-agri-500/25 hover:shadow-agri-500/35 flex items-center justify-center gap-2 mt-2"
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

      {/* Footer Link to Register */}
      <div className="text-center pt-2 border-t border-agri-200/40 dark:border-agri-700/20">
        <p className="text-xs text-agri-600/70 dark:text-agri-400/60 font-medium">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-agri-600 dark:text-accent-lime font-extrabold hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
