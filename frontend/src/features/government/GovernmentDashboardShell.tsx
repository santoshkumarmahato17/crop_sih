import React from 'react';
import {
  Building2,
  MapPin,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const GovernmentDashboardShell: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-3 sm:px-6">
      {/* Government Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-900/90 via-slate-900/90 to-slate-950/90 border border-sky-500/30 shadow-xl backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-mono font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>GOVERNMENT JURISDICTION • REGIONAL MONITORING</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Regional Agriculture Command Center
          </h1>
          <p className="text-xs text-agri-300">
            {user?.organization_name || 'Department of Agriculture'} — {user?.assigned_region || 'Regional Agro-Zone Sector'}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-sky-950/80 border border-sky-500/30 text-right">
          <span className="text-[10px] text-sky-400 font-mono block">Authorized Official</span>
          <span className="text-xs font-bold text-white">{user?.full_name}</span>
          <span className="text-[10px] text-agri-400/70 block font-mono">ID: {user?.id}</span>
        </div>
      </div>

      {/* Overview Metric Cards (Placeholders clearly marked) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white/85 dark:bg-surface-darkCard/80 border border-agri-200/50 dark:border-agri-700/25 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-agri-500/70 text-xs font-semibold">
            <span>Monitored Holdings</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-agri-900 dark:text-white">24 Farms</p>
          <p className="text-[11px] text-agri-500/70 dark:text-agri-400/70">
            Across 180 hectares in assigned district
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/85 dark:bg-surface-darkCard/80 border border-agri-200/50 dark:border-agri-700/25 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-agri-500/70 text-xs font-semibold">
            <span>High Risk Zones</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">3 Sectors</p>
          <p className="text-[11px] text-agri-500/70 dark:text-agri-400/70">
            Foliar chlorosis & potential rust spread
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/85 dark:bg-surface-darkCard/80 border border-agri-200/50 dark:border-agri-700/25 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-agri-500/70 text-xs font-semibold">
            <span>Disease Hotspots</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">2 Active</p>
          <p className="text-[11px] text-agri-500/70 dark:text-agri-400/70">
            Tomato Early Blight clusters flagged
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/85 dark:bg-surface-darkCard/80 border border-agri-200/50 dark:border-agri-700/25 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-agri-500/70 text-xs font-semibold">
            <span>Monitoring Coverage</span>
            <Activity className="w-4 h-4 text-agri-500" />
          </div>
          <p className="text-2xl font-black text-agri-600 dark:text-agri-400">91.4%</p>
          <p className="text-[11px] text-agri-500/70 dark:text-agri-400/70">
            Multispectral drone telemetry synced
          </p>
        </div>
      </div>

      {/* Regional Surveillance Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-6 rounded-3xl bg-white/85 dark:bg-surface-darkCard/80 border border-agri-200/50 dark:border-agri-700/25 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-agri-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <span>Regional Pathogen Spread Risk Map</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Government View
            </span>
          </div>

          <div className="h-48 rounded-2xl bg-agri-950/60 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center p-4 space-y-2">
            <MapPin className="w-8 h-8 text-sky-400 animate-bounce" />
            <p className="text-xs font-bold text-white">Regional Geospatial Risk Layer</p>
            <p className="text-[11px] text-agri-400/70 max-w-sm">
              Visualizes cross-farm airborne spore trajectory models and wind corridors across the assigned district.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/85 dark:bg-surface-darkCard/80 border border-agri-200/50 dark:border-agri-700/25 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-agri-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-agri-500" />
              <span>Official Advisories & Intervention Reports</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-agri-500/10 text-agri-400 border border-agri-500/20">
              Authorized Scope
            </span>
          </div>

          <div className="space-y-2">
            {[
              { title: 'District Rust Prevention Advisory #04', date: 'Today, 09:00 AM', status: 'DISPATCHED' },
              { title: 'Water Deficit Alert (CWSI > 0.75 in Sector B)', date: 'Yesterday', status: 'ACTIVE' },
              { title: 'Multispectral Inspection Summary Q3', date: '2 days ago', status: 'FILED' },
            ].map((adv, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-agri-900 dark:text-white">{adv.title}</p>
                  <p className="text-[10px] text-agri-500/70">{adv.date}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-500/15 text-sky-400">
                  {adv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
