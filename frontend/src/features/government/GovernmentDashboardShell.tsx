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
          <p className="text-xs text-slate-300">
            {user?.organization_name || 'Department of Agriculture'} — {user?.assigned_region || 'Regional Agro-Zone Sector'}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-sky-950/80 border border-sky-500/30 text-right">
          <span className="text-[10px] text-sky-400 font-mono block">Authorized Official</span>
          <span className="text-xs font-bold text-white">{user?.full_name}</span>
          <span className="text-[10px] text-slate-400 block font-mono">ID: {user?.id}</span>
        </div>
      </div>

      {/* Overview Metric Cards (Placeholders clearly marked) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Monitored Holdings</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">24 Farms</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Across 180 hectares in assigned district
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>High Risk Zones</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">3 Sectors</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Foliar chlorosis & potential rust spread
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Disease Hotspots</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">2 Active</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Tomato Early Blight clusters flagged
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Monitoring Coverage</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">91.4%</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Multispectral drone telemetry synced
          </p>
        </div>
      </div>

      {/* Regional Surveillance Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <span>Regional Pathogen Spread Risk Map</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Government View
            </span>
          </div>

          <div className="h-48 rounded-2xl bg-slate-950/60 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center p-4 space-y-2">
            <MapPin className="w-8 h-8 text-sky-400 animate-bounce" />
            <p className="text-xs font-bold text-white">Regional Geospatial Risk Layer</p>
            <p className="text-[11px] text-slate-400 max-w-sm">
              Visualizes cross-farm airborne spore trajectory models and wind corridors across the assigned district.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Official Advisories & Intervention Reports</span>
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{adv.title}</p>
                  <p className="text-[10px] text-slate-500">{adv.date}</p>
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
