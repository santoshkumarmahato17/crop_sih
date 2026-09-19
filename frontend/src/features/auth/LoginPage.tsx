import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext';
import { authService } from '@/services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendPhoneOtp, verifyPhoneOtp, isLoading } = useAuth();

  // Mode: 'CHOICE' | 'EMAIL' | 'PHONE'
  const [activeTab, setActiveTab] = useState<'CHOICE' | 'EMAIL' | 'PHONE'>('CHOICE');

  // Email form state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Google Auth Handler
  const extractErrorMessage = (err: any, fallback: string): string => {
    if (!err.response) {
      return 'Unable to connect to AGRI SHIELD backend server (http://localhost:8001). Please ensure the backend server is running.';
    }
    const data = err.response.data;
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    if (typeof data?.message === 'string' && data.message.trim() && data.message !== 'HTTP Error') {
      return data.message;
    }
    if (Array.isArray(data?.detail)) {
      return data.detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
    }
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    return fallback;
  };

  // 1. Google Auth Handler
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      const res = await authService.getGoogleAuthUrl();
      if (!res.client_id_configured || !res.auth_url) {
        setErrorMsg(
          'Google OAuth Client ID is not configured on the server. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.'
        );
        return;
      }
      window.location.href = res.auth_url;
    } catch (err: any) {
      setErrorMsg(
        extractErrorMessage(
          err,
          'Failed to initiate Google OAuth. Please ensure backend is running and GOOGLE_CLIENT_ID is configured in backend/.env.'
        )
      );
    }
  };


  // 2. Email Password Submit Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
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
      setErrorMsg(extractErrorMessage(err, 'Invalid email or password credentials. Please try again.'));
    }
  };

  // 3. Phone OTP Request Handler
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessInfo(null);

    const cleanInput = phoneNumber.trim();
    if (!cleanInput) {
      setErrorMsg('Please enter a valid 10-digit mobile number (e.g. 9842178901 or +919842178901).');
      return;
    }

    try {
      const res = await sendPhoneOtp(cleanInput);
      setOtpSent(true);
      setSuccessInfo(res.message || 'OTP verification code has been dispatched to your phone.');
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, 'Failed to send SMS OTP. Please check your phone number and try again.'));
    }
  };

  // 4. Phone OTP Verification Handler
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification OTP code.');
      return;
    }

    try {
      const userRole = await verifyPhoneOtp(phoneNumber.trim(), otpCode.trim());
      const destination = location.state?.from?.pathname || getRoleDashboardPath(userRole);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, 'Invalid or expired OTP code. Please check and try again.'));
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
          Sign in
        </h1>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successInfo && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successInfo}</span>
        </div>
      )}

      {/* ── PHONE LOGIN SCREEN ── */}
      {activeTab === 'PHONE' ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setActiveTab('CHOICE');
                setOtpSent(false);
                setErrorMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-agri-600 dark:text-agri-400 hover:text-agri-900 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to sign in options</span>
            </button>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-agri-500/10 text-agri-600 dark:text-accent-lime">
              Phone Sign In
            </span>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendPhoneOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-agri-400 dark:text-agri-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number (+91 9842178901)"
                    className="w-full bg-agri-50/50 dark:bg-agri-900/40 border border-agri-200/60 dark:border-agri-700/30 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/60 dark:placeholder-agri-500/40 focus:outline-none focus:border-agri-500 focus:ring-1 focus:ring-agri-500/30 font-semibold transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-agri-500 to-agri-600 hover:from-agri-600 hover:to-agri-700 active:scale-95 text-white font-black text-xs transition-all duration-200 shadow-lg shadow-agri-500/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
                    Enter 6-Digit OTP *
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] text-agri-600 dark:text-accent-lime font-bold hover:underline"
                  >
                    Change Phone Number
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-agri-400 dark:text-agri-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full bg-agri-50/50 dark:bg-agri-900/40 border border-agri-200/60 dark:border-agri-700/30 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/60 dark:placeholder-agri-500/40 focus:outline-none focus:border-agri-500 focus:ring-1 focus:ring-agri-500/30 font-mono font-bold tracking-widest text-center transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-agri-500 to-agri-600 hover:from-agri-600 hover:to-agri-700 active:scale-95 text-white font-black text-xs transition-all duration-200 shadow-lg shadow-agri-500/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <span>Verify OTP & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      ) : (
        /* ── CHOICE & EMAIL FORM SECTION ── */
        <div className="space-y-5">
          {/* Quick Choice Buttons Section */}
          <div className="space-y-2.5">
            {/* Google Login Option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-agri-900/40 hover:bg-agri-50 dark:hover:bg-agri-800/60 border border-agri-200/80 dark:border-agri-700/40 text-agri-800 dark:text-agri-100 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-3 active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Phone Number Login Option */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('PHONE');
                setErrorMsg(null);
              }}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-agri-900/40 hover:bg-agri-50 dark:hover:bg-agri-800/60 border border-agri-200/80 dark:border-agri-700/40 text-agri-800 dark:text-agri-100 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-3 active:scale-98"
            >
              <Phone className="w-4 h-4 text-agri-600 dark:text-accent-lime" />
              <span>Continue with phone number</span>
            </button>

            {/* Email Form Toggle Option */}
            <button
              type="button"
              onClick={() => {
                setActiveTab(activeTab === 'EMAIL' ? 'CHOICE' : 'EMAIL');
                setErrorMsg(null);
              }}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white dark:bg-agri-900/40 hover:bg-agri-50 dark:hover:bg-agri-800/60 border border-agri-200/80 dark:border-agri-700/40 text-agri-800 dark:text-agri-100 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-3 active:scale-98"
            >
              <Mail className="w-4 h-4 text-agri-600 dark:text-accent-lime" />
              <span>Continue with email</span>
            </button>
          </div>

          {/* OR Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full border-t border-agri-200/60 dark:border-agri-700/30"></div>
            <span className="absolute px-3 bg-white dark:bg-surface-darkCard text-[10px] font-bold tracking-widest uppercase text-agri-400/80 dark:text-agri-500/70">
              OR
            </span>
          </div>

          {/* Standard Email & Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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
        </div>
      )}

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
