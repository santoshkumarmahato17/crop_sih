import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState<string>('ramanathan@agrishield.farm');
  const [password, setPassword] = useState<string>('FarmerSecure2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setErrorMsg('Invalid email or password credentials. Please try again.');
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      await login(demoEmail, demoPass);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sign In to AGRI SHIELD
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI-Powered Crop Health Monitoring & Diagnostic System
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Email ID *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@agrishield.farm"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Password *
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('For demo accounts, use password: FarmerSecure2026!');
                }}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Profiles */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block text-center">
            Quick 1-Click Demo Accounts:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin('ramanathan@agrishield.farm', 'FarmerSecure2026!')}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-left transition space-y-0.5"
            >
              <div className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <User className="w-3.5 h-3.5" />
                <span>Farmer Account</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">ramanathan@agrishield.farm</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('meenakshi.officer@agrishield.gov.in', 'OfficerSecure2026!')}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-left transition space-y-0.5"
            >
              <div className="font-bold flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Extension Officer</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">meenakshi.officer@...</p>
            </button>
          </div>
        </div>

        {/* Register Prompt */}
        <div className="text-center text-xs text-slate-600 dark:text-slate-400">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Register New Farmer Account
          </Link>
        </div>
      </div>
    </div>
  );
};
