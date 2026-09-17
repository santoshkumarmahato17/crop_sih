import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Sprout,
} from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [role, setRole] = useState<'FARMER' | 'GOVERNMENT'>('FARMER');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [assignedRegion, setAssignedRegion] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (role === 'GOVERNMENT' && !organizationName.trim()) {
      setErrorMsg('Please specify your Government Organization or Ministry.');
      return;
    }

    try {
      const assignedRole = await register({
        full_name: fullName,
        email,
        phone_number: phone || undefined,
        password,
        confirm_password: confirmPassword,
        role,
        organization_name: role === 'GOVERNMENT' ? organizationName : undefined,
        department: role === 'GOVERNMENT' ? department : undefined,
        assigned_region: role === 'GOVERNMENT' ? assignedRegion : undefined,
        address: address || undefined,
      });

      if (assignedRole === 'FARMER') {
        navigate('/onboarding', { replace: true });
      } else {
        const destination = getRoleDashboardPath(assignedRole);
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          'Registration failed. Please check your details and try again.'
      );
    }
  };

  return (
    <div className="w-full max-w-lg p-8 sm:p-9 rounded-3xl bg-white/95 dark:bg-surface-darkCard/90 border border-white/60 dark:border-slate-700/60 shadow-2xl shadow-agri-900/15 backdrop-blur-2xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-2 rounded-2xl bg-white dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 shadow-md">
          <img src="/agri-logo.png" alt="AgriShield Logo" className="w-16 h-12 object-contain" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-agri-900 dark:text-white">
          Create AGRI SHIELD Account
        </h1>
        <p className="text-xs text-agri-600 dark:text-agri-300 font-medium">
          Register your verified account for precision agricultural monitoring
        </p>
      </div>

      {/* Account Type / Role Selection Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider text-agri-700 dark:text-agri-300">
            Select Account Role *
          </label>
          <span className="text-[11px] font-semibold text-agri-500/70 dark:text-agri-400/70">
            {role === 'FARMER' ? 'Agricultural Producer' : 'Regional Administration'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* FARMER Role Card */}
          <button
            type="button"
            onClick={() => setRole('FARMER')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              role === 'FARMER'
                ? 'bg-agri-500/10 dark:bg-agri-500/15 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-agri-500/20'
                : 'bg-surface-light dark:bg-agri-950/60 border-agri-200/50 dark:border-agri-700/25 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl transition ${
                    role === 'FARMER'
                      ? 'bg-agri-500 text-white'
                      : 'bg-slate-200 dark:bg-agri-800/50 text-agri-600 dark:text-agri-400/70 group-hover:text-agri-900 dark:group-hover:text-white'
                  }`}
                >
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black tracking-wide text-agri-900 dark:text-white block">
                    FARMER
                  </span>
                  <span className="text-[10px] text-agri-600 dark:text-agri-400 font-bold block">
                    Dashboard & GIS
                  </span>
                </div>
              </div>
              {role === 'FARMER' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-agri-500 text-white">
                  Selected
                </span>
              )}
            </div>
            <p className="text-[11px] text-agri-600 dark:text-agri-400/70 mt-2 line-clamp-2 leading-relaxed font-medium">
              Field boundaries, vegetation indices (NDVI), drone missions, and AI leaf diagnostics.
            </p>
          </button>

          {/* GOVERNMENT Role Card */}
          <button
            type="button"
            onClick={() => setRole('GOVERNMENT')}
            className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              role === 'GOVERNMENT'
                ? 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-500 shadow-md shadow-sky-500/10 ring-2 ring-sky-500/20'
                : 'bg-surface-light dark:bg-agri-950/60 border-agri-200/50 dark:border-agri-700/25 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl transition ${
                    role === 'GOVERNMENT'
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-200 dark:bg-agri-800/50 text-agri-600 dark:text-agri-400/70 group-hover:text-agri-900 dark:group-hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black tracking-wide text-agri-900 dark:text-white block">
                    GOVERNMENT
                  </span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block">
                    Regional Radar
                  </span>
                </div>
              </div>
              {role === 'GOVERNMENT' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-sky-600 text-white">
                  Selected
                </span>
              )}
            </div>
            <p className="text-[11px] text-agri-600 dark:text-agri-400/70 mt-2 line-clamp-2 leading-relaxed font-medium">
              Regional outbreak surveillance, crop disease hotspots, and quarantine advisories.
            </p>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === 'FARMER' ? 'e.g. Ramesh Patel' : 'e.g. Dr. K. Sharma'}
                className="w-full bg-surface-light dark:bg-surface-darkBg/80 border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'FARMER' ? 'grower@agrishield.farm' : 'officer@gov.agrishield.in'}
                className="w-full bg-surface-light dark:bg-surface-darkBg/80 border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-semibold"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98421 78901"
                className="w-full bg-surface-light dark:bg-surface-darkBg/80 border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
              Location / District
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Coimbatore, Tamil Nadu"
                className="w-full bg-surface-light dark:bg-surface-darkBg/80 border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Government Specific Fields */}
        {role === 'GOVERNMENT' && (
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
              <Building2 className="w-4 h-4" />
              <span>Government Official Verification Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-agri-800 dark:text-agri-200">
                  Organization / Ministry *
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. Dept of Agriculture, TN"
                  className="w-full bg-white dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-agri-800 dark:text-agri-200">
                  Department / Division
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Plant Pathology Div"
                  className="w-full bg-white dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-agri-800 dark:text-agri-200">
                  Assigned Region / District
                </label>
                <input
                  type="text"
                  value={assignedRegion}
                  onChange={(e) => setAssignedRegion(e.target.value)}
                  placeholder="e.g. Coimbatore Agri-Sector"
                  className="w-full bg-white dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars"
                className="w-full bg-surface-light dark:bg-surface-darkBg/80 border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-10 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-2.5 text-agri-400/70 hover:text-agri-600 dark:hover:text-agri-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-agri-800 dark:text-agri-200">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-surface-light dark:bg-surface-darkBg/80 border border-agri-200/50 dark:border-agri-700/25 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-agri-900 dark:text-agri-100 placeholder-agri-400/50 focus:outline-none focus:border-agri-500 font-semibold"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-2xl text-white font-black text-xs transition shadow-lg flex items-center justify-center gap-2 mt-2 ${
            role === 'FARMER'
              ? 'bg-agri-500 hover:bg-agri-500 shadow-agri-500/25'
              : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
          }`}
        >
          {isLoading ? (
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <span>Create {role === 'FARMER' ? 'Farmer' : 'Government'} Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-agri-600 dark:text-agri-300 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-agri-600 dark:text-agri-400 font-extrabold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
