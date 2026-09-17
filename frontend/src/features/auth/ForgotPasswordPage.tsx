import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { authService } from '@/services/authService';

type Step = 'EMAIL' | 'OTP' | 'RESET' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard State
  const [step, setStep] = useState<Step>('EMAIL');

  // Form Fields
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');

  // UI / Feedback States
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // OTP Expiry Countdown (5 minutes = 300 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft]);

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const extractErrorMessage = (err: any, fallback: string): string => {
    if (!err.response) {
      return 'Unable to connect to AGRI SHIELD backend server (http://localhost:8001). Please ensure the backend server is running.';
    }
    const data = err.response.data;
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    if (Array.isArray(data?.detail)) {
      return data.detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
    }
    return fallback;
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address format (e.g. name@domain.com).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(cleanEmail);
      setInfoMsg(res.message || 'An OTP has been dispatched to your registered email address.');
      setStep('OTP');
      setTimeLeft(300);
      setTimerActive(true);
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, 'Failed to process password reset request. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setInfoMsg(res.message || 'A new OTP has been dispatched to your registered email address.');
      setTimeLeft(300);
      setTimerActive(true);
      setOtp('');
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, 'Failed to resend OTP. Please try again later.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit numeric OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyOtp(email.trim(), cleanOtp);
      setResetToken(res.reset_token);
      setStep('RESET');
      setInfoMsg('OTP verified successfully. Please enter your new password.');
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, 'Incorrect or expired OTP code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!newPassword) {
      setErrorMsg('New password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: email.trim(),
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(extractErrorMessage(err, 'Failed to reset password. Please try again.'));
    } finally {
      setIsLoading(false);
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
          {step === 'EMAIL' && 'Forgot Password?'}
          {step === 'OTP' && 'Verify OTP'}
          {step === 'RESET' && 'Create New Password'}
          {step === 'SUCCESS' && 'Password Reset Complete!'}
        </h1>
        <p className="text-xs text-agri-600/70 dark:text-agri-400/60 font-medium">
          {step === 'EMAIL' && 'Enter your registered email address to receive an OTP.'}
          {step === 'OTP' && 'Enter the OTP sent to your registered email address.'}
          {step === 'RESET' && 'Set a new secure password for your AGRI SHIELD account.'}
          {step === 'SUCCESS' && 'Password changed successfully. You can now sign in with your new password.'}
        </p>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && step !== 'SUCCESS' && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{infoMsg}</span>
        </div>
      )}

      {/* STEP 1: Enter Registered Email */}
      {step === 'EMAIL' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-agri-500 to-agri-600 hover:from-agri-600 hover:to-agri-700 active:scale-95 text-white font-black text-xs transition-all duration-200 shadow-lg shadow-agri-500/25 hover:shadow-agri-500/35 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <span>Send OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: OTP Verification */}
      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
                Enter OTP *
              </label>
              <span className="text-[11px] font-bold text-agri-600 dark:text-agri-400">
                Expires in: <span className="font-mono text-emerald-600 dark:text-accent-lime font-black">{formatTimer(timeLeft)}</span>
              </span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-agri-400 dark:text-agri-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit OTP code"
                className="w-full bg-agri-50/50 dark:bg-agri-900/40 border border-agri-200/60 dark:border-agri-700/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-agri-900 dark:text-agri-100 placeholder-agri-400/60 focus:outline-none focus:border-agri-500 font-bold transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading || (timerActive && timeLeft > 240)}
              className="py-2.5 rounded-xl border border-agri-200/60 dark:border-agri-700/30 text-agri-700 dark:text-agri-200 hover:bg-agri-50 dark:hover:bg-agri-900/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resend OTP</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 rounded-xl bg-agri-500 hover:bg-agri-600 active:scale-95 text-white font-black text-xs transition-all shadow-md shadow-agri-500/20 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <span>Verify OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Reset Password */}
      {step === 'RESET' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
              New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-agri-400 dark:text-agri-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-agri-50/50 dark:bg-agri-900/40 border border-agri-200/60 dark:border-agri-700/30 rounded-xl pl-10 pr-10 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/60 focus:outline-none focus:border-agri-500 font-semibold transition-colors"
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-agri-400 dark:text-agri-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-agri-50/50 dark:bg-agri-900/40 border border-agri-200/60 dark:border-agri-700/30 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/60 focus:outline-none focus:border-agri-500 font-semibold transition-colors"
              />
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
                <span>Change Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 4: Success Notification */}
      {step === 'SUCCESS' && (
        <div className="space-y-5 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <p className="text-xs font-semibold text-agri-700 dark:text-agri-200 leading-relaxed">
            Password changed successfully. You can now sign in with your new password.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-agri-500 to-agri-600 hover:from-agri-600 hover:to-agri-700 text-white font-black text-xs transition-all shadow-lg shadow-agri-500/25 flex items-center justify-center gap-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Back Link */}
      {step !== 'SUCCESS' && (
        <div className="text-center pt-2 border-t border-agri-200/40 dark:border-agri-700/20">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-agri-600 dark:text-agri-400 font-extrabold hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      )}
    </div>
  );
};
