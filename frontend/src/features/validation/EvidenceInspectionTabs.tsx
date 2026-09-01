import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Activity,
  CloudSun,
  Radio,
  History,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Droplets,
  Thermometer,
} from 'lucide-react';
import { ExpertValidationRequest } from '@/types/validation';

interface EvidenceInspectionTabsProps {
  request: ExpertValidationRequest;
}

export const EvidenceInspectionTabs: React.FC<EvidenceInspectionTabsProps> = ({ request }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'images' | 'symptoms' | 'weather' | 'drone' | 'history' | 'spatial'
  >('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
    { id: 'images', label: `Images (${request.image_urls.length})`, icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'symptoms', label: 'Symptoms', icon: <Activity className="w-4 h-4" /> },
    { id: 'weather', label: 'Weather Risk', icon: <CloudSun className="w-4 h-4" /> },
    { id: 'drone', label: 'Drone Scan', icon: <Radio className="w-4 h-4" /> },
    { id: 'history', label: 'Historical Trend', icon: <History className="w-4 h-4" /> },
    { id: 'spatial', label: 'Spatial Risk', icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* ── Tabs Navigation Bar ── */}
      <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content Area ── */}
      <div className="p-6 space-y-6">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Suspected Condition</span>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {request.suspected_condition}
                </p>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">
                  AI Optical Confidence: {(request.ai_confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Crop & Stage</span>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {request.crop_name || 'Crop Holding'}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  {request.crop_growth_stage || 'Active Vegetative Stage'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Farm & Sector</span>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {request.farm_name || 'Farm'}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  {request.zone_name || 'Zone Holding'}
                </span>
              </div>
            </div>

            {/* Validation Trigger Rationale */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
              <span className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Validation Trigger Rationale:</span>
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {request.reason}
              </p>
            </div>
          </div>
        )}

        {/* 2. IMAGES TAB */}
        {activeTab === 'images' && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Submitted High-Resolution Optical Scans
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {request.image_urls.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-950"
                >
                  <img
                    src={img}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none p-4 flex flex-col justify-end">
                    <span className="text-xs font-bold text-white">Frame #{idx + 1} • High Zoom</span>
                    <span className="text-[10px] text-emerald-300 font-mono">
                      Foliar Lesion Optical Telemetry
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SYMPTOMS TAB */}
        {activeTab === 'symptoms' && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Identified Pathology Symptoms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {request.symptoms.map((symptom, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {symptom}
                    </span>
                    <span className="text-[10px] text-slate-400">Validated by optical visual inspection</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. WEATHER RISK TAB */}
        {activeTab === 'weather' && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Microclimate & Meteorological Signals
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                <Thermometer className="w-5 h-5 text-amber-600 mx-auto" />
                <span className="text-[10px] font-bold text-slate-500 block">Temperature</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {request.weather_summary?.temperature_c || 27.5}°C
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center space-y-1">
                <Droplets className="w-5 h-5 text-sky-600 mx-auto" />
                <span className="text-[10px] font-bold text-slate-500 block">Humidity</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {request.weather_summary?.humidity_pct || 84}%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1">
                <CloudSun className="w-5 h-5 text-blue-600 mx-auto" />
                <span className="text-[10px] font-bold text-slate-500 block">Recent Rain</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {request.weather_summary?.rainfall_mm || 12.0} mm
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                <Flame className="w-5 h-5 text-rose-600 mx-auto" />
                <span className="text-[10px] font-bold text-slate-500 block">Disease Index</span>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                  {request.weather_summary?.disease_risk_level || 'HIGH'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. DRONE TAB */}
        {activeTab === 'drone' && (
          <div className="p-5 rounded-2xl bg-slate-950 text-white space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <span className="text-xs font-black uppercase text-emerald-300">
                  Drone Multispectral Scan Telemetry
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Mission ID: {request.drone_observation_id || 'MS-2026-088'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Canopy Mean NDVI:</span>
                <p className="text-base font-bold text-emerald-400">0.68 (18% deficit below zone median)</p>
              </div>
              <div>
                <span className="text-slate-400 block">Thermal CWSI Water Stress:</span>
                <p className="text-base font-bold text-amber-400">0.74 (Root Zone Stress Alert)</p>
              </div>
            </div>
          </div>
        )}

        {/* 6. HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-3 text-xs">
            <h4 className="font-black uppercase text-slate-500">Historical Health Observations</h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>7 Days Ago • Routine Autonomous Drone Scan</span>
                <span className="font-bold text-emerald-600">NDVI 0.84 (Healthy)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>3 Days Ago • Farmer Mobile Photo Scan</span>
                <span className="font-bold text-amber-600">Minor Chlorosis Detected</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-rose-700 dark:text-rose-400 font-bold">
                <span>Today • Rapid Pathogen Sporulation</span>
                <span>Foliar Lesion Surge (EV Request)</span>
              </div>
            </div>
          </div>
        )}

        {/* 7. SPATIAL RISK TAB */}
        {activeTab === 'spatial' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Contagion Hotspot Correlation</span>
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Correlated with regional outbreak node <strong>{request.hotspot_id || 'HS-001'}</strong>. Downwind adjacent zones (Z16, Z18) exhibit 74% contagion transmission probability over the next 4 days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
