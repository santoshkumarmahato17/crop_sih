import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  MapPin,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  Settings,
  Map,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, updatePassword, isLoading } = useAuth();

  // Profile Form States
  const [fullName, setFullName] = useState<string>(user?.full_name || 'Farmer Ramanathan K.');
  const [email, setEmail] = useState<string>(user?.email || 'ramanathan@agrishield.farm');
  const [phone, setPhone] = useState<string>(user?.phone_number || '+91 98421 78901');
  const [address, setAddress] = useState<string>(
    user?.address || 'Plot 14, West Valley Agro Sector, Coimbatore District, Tamil Nadu 641001'
  );

  // Password States
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      await updateProfile({
        full_name: fullName,
        email,
        phone_number: phone,
        address,
      });
      setFeedbackMsg({
        type: 'success',
        text: 'Profile and farm address details updated successfully!',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch {
      setFeedbackMsg({
        type: 'error',
        text: 'Failed to update profile. Please try again.',
      });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (newPassword !== confirmPassword) {
      setFeedbackMsg({
        type: 'error',
        text: 'New passwords do not match. Please re-enter.',
      });
      return;
    }

    if (newPassword.length < 8) {
      setFeedbackMsg({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    try {
      await updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedbackMsg({
        type: 'success',
        text: 'Security password changed successfully!',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch {
      setFeedbackMsg({
        type: 'error',
        text: 'Failed to update password. Verify your current password.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 transition-colors duration-200">
      {/* 1. Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-surface-darkCard/85 border border-agri-200/50/80 dark:border-agri-700/25 shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            {fullName.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-agri-900 dark:text-white">
                {fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-agri-500/15 text-agri-700 dark:text-agri-400 border border-agri-200 dark:border-agri-500/25 text-xs font-mono font-bold">
                {typeof user?.role === 'string' ? user.role : (user?.role as any)?.name || 'FARMER'}
              </span>
            </div>
            <p className="text-xs text-agri-500/70 dark:text-agri-400/70 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{email}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="px-4 py-2 rounded-2xl bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/50 dark:hover:bg-agri-700/40 text-agri-800 dark:text-agri-200 border border-agri-200/50 dark:border-agri-700/30 font-bold text-xs transition flex items-center justify-center gap-2 self-start sm:self-center shadow-sm"
        >
          <Settings className="w-4 h-4 text-agri-600 dark:text-agri-400" />
          <span>System Settings & Preferences</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-md ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-agri-500/15 border-agri-200 dark:border-agri-500/30 text-agri-800 dark:text-agri-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-agri-600 dark:text-agri-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 2. Main Profile & Address Details Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-surface-darkCard/85 border border-agri-200/50/80 dark:border-agri-700/25 shadow-md backdrop-blur-xl space-y-5">
        <div className="space-y-1 border-b border-agri-200/50 dark:border-agri-700/25 pb-3">
          <h2 className="text-base font-bold text-agri-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-agri-600 dark:text-agri-400" />
            <span>Personal & Farm Address Information</span>
          </h2>
          <p className="text-xs text-agri-500/70 dark:text-agri-400/70">
            Set your email ID, contact number, and physical farm address for spatial agronomic missions.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                Email ID *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-medium"
              />
            </div>
          </div>

          {/* Farm Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
              Farm Holding & Physical Address *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot 14, West Valley Agro Sector, Coimbatore District, Tamil Nadu 641001"
                className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-medium"
              />
            </div>
            <p className="text-[10px] text-agri-500/70 dark:text-agri-400/70">
              Used by Extension Officers for field inspection routing and drone survey flight boundaries.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-2xl bg-agri-500 hover:bg-agri-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile & Address Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Security & Password Update Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-surface-darkCard/85 border border-agri-200/50/80 dark:border-agri-700/25 shadow-md backdrop-blur-xl space-y-5">
        <div className="space-y-1 border-b border-agri-200/50 dark:border-agri-700/25 pb-3">
          <h2 className="text-base font-bold text-agri-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>Security & Password Management</span>
          </h2>
          <p className="text-xs text-agri-500/70 dark:text-agri-400/70">
            Update your account password to safeguard your farm telemetry and drone mission records.
          </p>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
              Current Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-2xl bg-agri-900 hover:bg-agri-800 dark:bg-white dark:hover:bg-agri-50 text-white dark:text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-md active:scale-98 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Active Farm Holdings & Account Metadata */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-surface-darkCard/85 border border-agri-200/50/80 dark:border-agri-700/25 shadow-md backdrop-blur-xl space-y-4">
        <h3 className="text-sm font-bold text-agri-900 dark:text-white flex items-center gap-2">
          <Map className="w-4 h-4 text-agri-600 dark:text-agri-400" />
          <span>Connected Agro Holding & Surveillance Fleet</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-surface-light dark:bg-agri-950/60 border border-agri-200/50 dark:border-agri-700/25 space-y-1">
            <span className="text-[10px] text-agri-500/70 uppercase font-bold">Primary Farm Holding</span>
            <p className="font-bold text-agri-900 dark:text-agri-100">West Valley Holdings</p>
            <p className="text-[11px] text-agri-600 dark:text-agri-400 font-semibold">24.5 Hectares • Wheat & Rice</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-light dark:bg-agri-950/60 border border-agri-200/50 dark:border-agri-700/25 space-y-1">
            <span className="text-[10px] text-agri-500/70 uppercase font-bold">Assigned Drone</span>
            <p className="font-bold text-agri-900 dark:text-agri-100">DJI Agras T40 #01</p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Multispectral + Thermal</p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-light dark:bg-agri-950/60 border border-agri-200/50 dark:border-agri-700/25 space-y-1">
            <span className="text-[10px] text-agri-500/70 uppercase font-bold">Extension Officer</span>
            <p className="font-bold text-agri-900 dark:text-agri-100">Dr. Meenakshi Sundaram</p>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Regional Agro Division</p>
          </div>
        </div>
      </div>
    </div>
  );
};
