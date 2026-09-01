import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Sun,
  Moon,
  Globe,
  Bell,
  Sliders,
  Shield,
  LogOut,
  CheckCircle2,
  Plane,
  Eye,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  // Settings State
  const [language, setLanguage] = useState<string>('en');
  const [syncInterval, setSyncInterval] = useState<string>('15s');
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState<number>(85);
  const [unitSystem, setUnitSystem] = useState<string>('metric');
  const [autoDroneDispatch, setAutoDroneDispatch] = useState<boolean>(true);
  const [criticalSmsAlerts, setCriticalSmsAlerts] = useState<boolean>(true);
  const [inSystemNotifs, setInSystemNotifs] = useState<boolean>(true);
  const [weeklyReport, setWeeklyReport] = useState<boolean>(true);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg('Settings and system preferences saved successfully!');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 transition-colors duration-200">
      {/* 1. Page Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Settings & Preferences
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure display themes, language, telemetry frequency, alert rules, and account session controls.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span>Active User:</span>
          <span className="font-bold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
            {user?.full_name || 'Farmer Ramanathan'}
          </span>
        </div>
      </div>

      {/* Save Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xl sticky top-20 z-30">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 2. Appearance & Language */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl space-y-5">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Appearance & Language</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize visual contrast and preferred vernacular language.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Theme Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Display Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    theme === 'light'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                    theme === 'dark'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-emerald-400" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                System Language
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="en">English (US / Global)</option>
                  <option value="ta">Tamil (தமிழ் • தமிழ்நாடு)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Telemetry & AI Vision Configuration */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl space-y-5">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Telemetry & AI Diagnostics Engine</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Control IoT sync rates, unit standards, and neural network detection sensitivity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Telemetry Sync Rate
              </label>
              <select
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="5s">Every 5 Seconds (Ultra Real-Time)</option>
                <option value="15s">Every 15 Seconds (Recommended)</option>
                <option value="60s">Every 1 Minute (Power Saving)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Measurement Units
              </label>
              <select
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="metric">Metric (°C, Hectares, mm)</option>
                <option value="imperial">Imperial (°F, Acres, inches)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  AI Confidence Threshold
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {aiConfidenceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="98"
                value={aiConfidenceThreshold}
                onChange={(e) => setAiConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Auto-Recommend Drone Missions on Critical Risk</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Automatically generate targeted waypoint flight routes when consecutive observations deteriorate.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoDroneDispatch}
              onChange={(e) => setAutoDroneDispatch(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
            />
          </div>
        </div>

        {/* 4. Alert & Notification Rules */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl space-y-4">
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Notification & Alert Channels</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage how urgent disease outbreaks and irrigation alerts reach you.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  In-System Real-Time Notifications
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instant bell popup banners for disease detection and zone status updates.
                </p>
              </div>
              <input
                type="checkbox"
                checked={inSystemNotifs}
                onChange={(e) => setInSystemNotifs(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Critical Outbreak SMS Alerts
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sends urgent SMS alerts to your phone if neighbor contagion risk exceeds 80%.
                </p>
              </div>
              <input
                type="checkbox"
                checked={criticalSmsAlerts}
                onChange={(e) => setCriticalSmsAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Weekly Agronomic Crop Health Digest
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Summary email report of vegetative NDVI trajectories and water stress levels.
                </p>
              </div>
              <input
                type="checkbox"
                checked={weeklyReport}
                onChange={(e) => setWeeklyReport(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 active:scale-98"
            >
              Save System Preferences
            </button>
          </div>
        </div>
      </form>



      {/* 5. Centralized Account Security & Sign Out Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 shadow-md backdrop-blur-xl space-y-4">
        <div className="space-y-1 border-b border-rose-200 dark:border-rose-500/30 pb-3">
          <h2 className="text-sm font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Account Session & Sign Out</span>
          </h2>
          <p className="text-xs text-rose-700 dark:text-rose-400">
            Terminate your active AGRI SHIELD session across this browser.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Signed in as: <span className="text-emerald-700 dark:text-emerald-400">{user?.email || 'farmer@agrishield.farm'}</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Role: <span className="font-mono font-semibold">{typeof user?.role === 'string' ? user.role : (user?.role as any)?.name || 'FARMER'}</span> • Device: Current Browser Session
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 active:scale-95 flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
