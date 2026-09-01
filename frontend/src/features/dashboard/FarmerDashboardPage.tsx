import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Droplets,
  CheckCircle2,
  Plane,
  Sparkles,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  UploadCloud,
  BrainCircuit,
  MapPin,
  ChevronRight,
  Wind,
  Plus,
  PlusCircle,
  Sprout,
  ArrowUpRight,
  X,
  Trash2,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { farmService } from '@/services/farmService';
import { zoneService } from '@/services/zoneService';
import { ZoneTemporalAnalyticsModal } from '@/features/temporal/ZoneTemporalAnalyticsModal';
import {
  FarmerDashboardSummary,
  Farm,
  Zone,
} from '@/types';

export interface CropMonitoringCardData {
  id: string;
  crop_name: string;
  icon: string;
  field_name: string;
  area_acres: number;
  health_score: number;
  ndvi: number;
  alertness_level: 'HEALTHY' | 'MODERATE_STRESS' | 'HIGH_RISK' | 'PEST_ALERT';
  alertness_label: string;
  stage: string;
  days_to_harvest: number;
  last_scanned: string;
  description: string;
  bg_badge: string;
  border_color: string;
}

export const FarmerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FarmerDashboardSummary | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Multi-Crop Monitoring State (Box-wise display)
  const [crops, setCrops] = useState<CropMonitoringCardData[]>([
    {
      id: 'crop-1',
      crop_name: 'Wheat (PBW-550)',
      icon: '🌾',
      field_name: 'West Parcel A',
      area_acres: 12.5,
      health_score: 94,
      ndvi: 0.84,
      alertness_level: 'HEALTHY',
      alertness_label: '● Healthy (94%)',
      stage: 'Grain Filling Stage',
      days_to_harvest: 22,
      last_scanned: 'Today, 08:30 AM',
      description: 'Nominal vegetative index (NDVI: 0.84). Zero pathogen pustules detected.',
      bg_badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      border_color: 'border-emerald-200 dark:border-emerald-800/80',
    },
    {
      id: 'crop-2',
      crop_name: 'Rice / Paddy (IR-64)',
      icon: '🍚',
      field_name: 'South River Bed',
      area_acres: 18.0,
      health_score: 74,
      ndvi: 0.68,
      alertness_level: 'MODERATE_STRESS',
      alertness_label: '⚠️ Water Stress',
      stage: 'Tillering Stage',
      days_to_harvest: 45,
      last_scanned: 'Yesterday, 04:15 PM',
      description: 'CWSI 0.72 root-zone deficit. Requires 2-hour drip flush within 18 hours.',
      bg_badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      border_color: 'border-amber-200 dark:border-amber-800/80',
    },
    {
      id: 'crop-3',
      crop_name: 'Tomato (Hybrid Cherry)',
      icon: '🍅',
      field_name: 'Greenhouse Plot B',
      area_acres: 4.2,
      health_score: 62,
      ndvi: 0.58,
      alertness_level: 'HIGH_RISK',
      alertness_label: '🔴 High Blight Risk',
      stage: 'Flowering & Fruiting',
      days_to_harvest: 14,
      last_scanned: 'Today, 07:10 AM',
      description: 'Late Blight foliar chlorosis detected in 3 plant clusters. Bio-fungicide alert.',
      bg_badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      border_color: 'border-rose-200 dark:border-rose-800/80',
    },
    {
      id: 'crop-4',
      crop_name: 'Corn / Maize (Sweet Corn)',
      icon: '🌽',
      field_name: 'East Terraces',
      area_acres: 8.5,
      health_score: 79,
      ndvi: 0.73,
      alertness_level: 'PEST_ALERT',
      alertness_label: '🔥 Armyworm Alert',
      stage: 'Vegetative V6 Stage',
      days_to_harvest: 38,
      last_scanned: '2 days ago',
      description: 'Foliar feeding damage spotted by drone AI scan. Pheromone trap deployment advised.',
      bg_badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
      border_color: 'border-orange-200 dark:border-orange-800/80',
    },
    {
      id: 'crop-5',
      crop_name: 'Banana (Grand Naine)',
      icon: '🍌',
      field_name: 'Valley Grove #1',
      area_acres: 6.0,
      health_score: 91,
      ndvi: 0.81,
      alertness_level: 'HEALTHY',
      alertness_label: '● Healthy (91%)',
      stage: 'Shooting Stage',
      days_to_harvest: 60,
      last_scanned: 'Today, 09:00 AM',
      description: 'Optimal canopy density & leaf transpiration. Zero Sigatoka leaf spot observed.',
      bg_badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      border_color: 'border-emerald-200 dark:border-emerald-800/80',
    },
  ]);

  // Add Crop Modal State
  const [isAddCropModalOpen, setIsAddCropModalOpen] = useState<boolean>(false);
  const [addCropName, setAddCropName] = useState<string>('Cotton');
  const [addCropIcon, setAddCropIcon] = useState<string>('🌱');
  const [addFieldName, setAddFieldName] = useState<string>('North Block Parcel 4');
  const [addAreaAcres, setAddAreaAcres] = useState<string>('10.0');
  const [addStage, setAddStage] = useState<string>('Sowing & Emergence');
  const [addDaysToHarvest, setAddDaysToHarvest] = useState<string>('90');

  // Modals
  const [isTemporalModalOpen, setIsTemporalModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [sumRes, farmsRes] = await Promise.all([
        dashboardService.getFarmerSummary(),
        farmService.listFarms(),
      ]);
      setSummary(sumRes);
      setFarms(farmsRes.farms);
      if (farmsRes.farms.length > 0) {
        setSelectedFarmId(farmsRes.farms[0].id);
        loadFarmZones(farmsRes.farms[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load farmer dashboard summary', err);
    }
  };

  const loadFarmZones = async (fId: string) => {
    try {
      const zRes = await zoneService.listZones(fId);
      setZones(zRes.zones);
      if (zRes.zones.length > 0) {
        setSelectedZone(zRes.zones[0]);
      }
    } catch (err: any) {
      console.error('Failed to load farm zones', err);
    }
  };

  const handleAddCropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCropName.trim() || !addFieldName.trim()) return;

    const newCropCard: CropMonitoringCardData = {
      id: `crop-${Date.now()}`,
      crop_name: addCropName.trim(),
      icon: addCropIcon || '🌱',
      field_name: addFieldName.trim(),
      area_acres: parseFloat(addAreaAcres) || 5.0,
      health_score: 88,
      ndvi: 0.78,
      alertness_level: 'HEALTHY',
      alertness_label: '● Healthy (88%)',
      stage: addStage.trim() || 'Active Growth Stage',
      days_to_harvest: parseInt(addDaysToHarvest, 10) || 45,
      last_scanned: 'Just added',
      description: `Newly registered crop holding in ${addFieldName.trim()}. Monitoring active.`,
      bg_badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      border_color: 'border-emerald-200 dark:border-emerald-800/80',
    };

    setCrops((prev) => [newCropCard, ...prev]);
    setIsAddCropModalOpen(false);
    setActionSuccess(`Added new crop "${addCropName}" for multi-crop monitoring!`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleRemoveCrop = (cropId: string, cropName: string) => {
    setCrops((prev) => prev.filter((c) => c.id !== cropId));
    setActionSuccess(`Removed "${cropName}" from active crop monitoring.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleExecuteAction = (actionTitle: string) => {
    setActionSuccess(`Action initiated: "${actionTitle}". Real-time telemetry updating.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto transition-colors duration-200">
      {/* ═══ HERO — Cinematic Drone Spraying Section ═══ */}
      <div className="relative overflow-hidden rounded-3xl min-h-[520px] lg:min-h-[580px] flex items-center shadow-2xl">

        {/* Background: Real Drone Over Crops Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center hero-bg"
          style={{ backgroundImage: `url('/drone-hero.jpg')` }}
        />

        {/* Deep gradient scrim — left-heavy like Farmio */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/20" />

        {/* Animated spray mist particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5 blur-xl"
              style={{
                width: `${120 + i * 40}px`,
                height: `${60 + i * 20}px`,
                bottom: `${20 + i * 8}%`,
                left: `${30 + i * 10}%`,
                animation: `drift ${4 + i * 1.5}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 w-full px-8 sm:px-12 lg:px-16 py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-10">

          {/* ── Left: Text + CTAs ── */}
          <div className="max-w-2xl space-y-6">

            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/20 border border-lime-400/40 text-lime-300 text-xs font-mono font-bold tracking-wider backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              Smart Drone Telemetry · Live Agriculture AI
            </div>

            {/* Main heading */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-white leading-[1.08] tracking-tight drop-shadow-lg">
                Smart Technology
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-white leading-[1.08] tracking-tight drop-shadow-lg">
                Driving the <span className="text-lime-400">Agriculture</span>
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-white leading-[1.08] tracking-tight drop-shadow-lg">
                Revolution
              </h1>
            </div>

            {/* Sub-text */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              Use AI-powered drones, sensors, and automation to increase yields
              and reduce environmental impact across your field holdings.
            </p>

            {/* Live stat pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Wind, label: '18 km/h Wind', color: 'text-sky-300' },
                { icon: Sparkles, label: 'AI Active', color: 'text-lime-300' },
                { icon: Plane, label: 'Drone on Mission', color: 'text-violet-300' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-semibold ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/upload')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 active:scale-95 text-slate-950 font-black text-sm transition-all duration-200 shadow-xl shadow-lime-500/30"
              >
                <UploadCloud className="w-4 h-4" />
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/analysis')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm transition-all duration-200 backdrop-blur-md"
              >
                <BrainCircuit className="w-4 h-4 text-lime-400" />
                AI Diagnosis Studio
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* ── Right: Floating Innovation Card ── */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-3">

            {/* Video card — real drone field video */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-2xl space-y-3">
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-900 group">

                {/* ── Actual drone field video ── */}
                <video
                  src="/drone-field.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                  onMouseOver={(e) => (e.currentTarget.playbackRate = 1)}
                />

                {/* Subtle dark vignette for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                {/* ● LIVE badge — pulsing dot */}
                <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/90 backdrop-blur-sm text-white text-[9px] font-mono font-bold tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>

                {/* Full-screen icon top-right */}
                <button
                  type="button"
                  onClick={() => navigate('/drones')}
                  className="absolute top-2 right-2 p-1 rounded-md bg-slate-950/60 text-white hover:bg-slate-950/80 transition opacity-0 group-hover:opacity-100"
                  title="View drone fleet"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-white leading-snug">Agriculture Innovation 2026</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Innovative eco-friendly solutions for farming communities.
                </p>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: '94.2%', label: 'AI Accuracy' },
                { val: '12', label: 'Active Zones' },
                { val: '3', label: 'Drones Up' },
              ].map(({ val, label }) => (
                <div key={label} className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-sm text-center">
                  <p className="text-base font-extrabold text-lime-400">{val}</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom scroll hint */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
          <span className="text-[10px] text-white font-mono tracking-widest uppercase">Scroll</span>
          <div className="w-0.5 h-5 bg-white/50 rounded-full animate-bounce" />
        </div>
      </div>


      {/* Farm Selector Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-xl transition-colors duration-200">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold px-2">Active Field Holding:</span>
          <select
            value={selectedFarmId}
            onChange={(e) => {
              setSelectedFarmId(e.target.value);
              loadFarmZones(e.target.value);
            }}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 shadow-sm"
          >
            {farms.length > 0 ? (
              farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.active_crop?.crop_name || 'Wheat'})
                </option>
              ))
            ) : (
              <option value="">West Valley Holdings (Wheat)</option>
            )}
          </select>
        </div>

        <button
          type="button"
          onClick={loadInitialData}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh Telemetry"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Sync Telemetry</span>
        </button>
      </div>

      {/* Action Notification Toast */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Glassmorphic Bento-Grid: Key Micro-Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Overall Vitality Circle Gauge */}
        <div className="p-5 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-lg flex items-center justify-between gap-4 backdrop-blur-xl transition-colors duration-200">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Crop Health Score
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {summary?.overall_health_score || 84.5}%
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +2.1%
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {summary?.health_verdict || 'Good Overall Condition'}
            </p>
          </div>

          {/* Circular SVG Gauge */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500"
                strokeDasharray={`${summary?.overall_health_score || 84.5}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute" />
          </div>
        </div>

        {/* 2. Soil Moisture & Water Stress Level — soil cross-section background */}
        <div className="relative rounded-3xl overflow-hidden shadow-lg" style={{ minHeight: '170px' }}>

          {/* ── Soil cross-section background ── */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('/soil-bg.jpg')`, backgroundPosition: 'center 60%' }}
          />

          {/* Dark scrim so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/55 to-slate-950/80" />

          {/* Card content */}
          <div className="relative z-10 p-5 space-y-2.5 h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-200 font-bold uppercase tracking-wider drop-shadow">
                Water Stress / CWSI
              </span>
              <div className="p-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 backdrop-blur-sm">
                <Droplets className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white drop-shadow-lg">0.76</span>
                <span className="text-xs text-orange-300 font-bold drop-shadow">Moderate Stress</span>
              </div>
              {/* Stress progress bar */}
              <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden mt-2 backdrop-blur-sm">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-rose-500 w-[65%]" />
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug drop-shadow">
              Zones Z04 &amp; Z05 need irrigation within 24h
            </p>
          </div>
        </div>


        {/* 3. Microclimate & Weather Card — Forest Green Gradient with Rich Animations */}
        <div
          className="relative p-5 rounded-3xl overflow-hidden space-y-3 shadow-xl hover:shadow-2xl transition-all duration-300 group"
          style={{ background: 'linear-gradient(135deg, #1b3e24 0%, #142e1b 55%, #0c1f11 100%)' }}
        >
          {/* Ambient radial glow with breathing animation */}
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none animate-atmospheric-glow" />

          {/* Row 1: Location + Animated 3D Floating Cloud & Sun */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
              <span className="text-xs font-semibold text-emerald-200 truncate max-w-[140px]">
                {selectedFarm?.name || 'West Valley Sector'}
              </span>
            </div>

            {/* Realistic Floating 3D Cloud + Sun with smooth animation */}
            <div className="relative w-14 h-9 flex-shrink-0 animate-cloud-float cursor-pointer group-hover:scale-110 transition-transform duration-300">
              {/* Pulsing Sun Orb behind cloud */}
              <div className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-amber-400 animate-sun-glow" />
              
              {/* 3D Volumetric Cloud Structure with gradient shading */}
              <div className="absolute bottom-0 left-0 right-1 h-5 rounded-full bg-gradient-to-t from-white/80 via-white/95 to-white shadow-md shadow-white/20 backdrop-blur-sm" />
              <div className="absolute bottom-2.5 left-1 w-4 h-4 rounded-full bg-gradient-to-br from-white via-white/90 to-slate-100/90 shadow-sm" />
              <div className="absolute bottom-3 left-3 w-5 h-5 rounded-full bg-gradient-to-t from-white/90 to-white shadow-sm" />
              <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-gradient-to-bl from-white via-white/95 to-slate-100/80 shadow-sm" />
              
              {/* Ambient silver highlight rim */}
              <div className="absolute bottom-4 left-4 w-3 h-1.5 rounded-full bg-white/60 blur-[0.5px]" />
            </div>
          </div>

          {/* Row 2: Temperature + Condition & Live Timestamp */}
          <div className="flex items-end justify-between relative z-10">
            <span className="text-4xl font-extrabold text-white tracking-tight leading-none animate-metric-pulse drop-shadow-md">
              28.4°C
            </span>
            <div className="text-right space-y-0.5">
              <p className="text-xs font-bold text-emerald-300 tracking-wide flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" style={{ animationDuration: '2.5s' }} />
                <span>Clean/Sunny</span>
              </p>
              <p className="text-[10px] text-emerald-400/80 font-mono">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {' | '}
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Row 3: Metrics strip with micro-interactions */}
          <div className="relative z-10 pt-2.5 border-t border-emerald-500/20 grid grid-cols-3 divide-x divide-emerald-500/20 text-center">
            <div className="space-y-0.5 hover:bg-emerald-500/10 rounded-lg py-0.5 transition-colors">
              <span className="text-[10px] text-emerald-400/80 font-semibold block">Humidity</span>
              <p className="text-xs font-bold text-white">85%</p>
            </div>
            <div className="space-y-0.5 px-1 hover:bg-emerald-500/10 rounded-lg py-0.5 transition-colors">
              <span className="text-[10px] text-emerald-400/80 font-semibold block">Precipitation</span>
              <p className="text-xs font-bold text-white">8 mm</p>
            </div>
            <div className="space-y-0.5 pl-1 hover:bg-emerald-500/10 rounded-lg py-0.5 transition-colors">
              <span className="text-[10px] text-emerald-400/80 font-semibold block">Wind Speed</span>
              <p className="text-xs font-bold text-white flex items-center justify-center gap-0.5">
                <span>18 km/h</span>
              </p>
            </div>
          </div>
        </div>

        {/* 4. Next Drone Surveillance Mission */}
        <div className="p-5 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-lg space-y-2.5 backdrop-blur-xl transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Drone Surveillance
            </span>
            <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Tomorrow 09:00 AM</span>
            </div>
            <p className="text-[11px] text-purple-700 dark:text-purple-400 font-mono font-semibold">MSN-20260831-TGT1</p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Targeting Zones Z03, Z04, Z05 (45m Alt)</p>
        </div>
      </div>

      {/* 3. Multi-Crop Precision Monitoring Grid (Box-wise view & Add Crop) */}
      <div className="p-6 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-6 backdrop-blur-xl transition-colors duration-200">
        
        {/* Header & Add Crop CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-lime-400/20 text-lime-700 dark:text-lime-400 font-mono font-bold text-[10px] uppercase tracking-wider border border-lime-400/30">
                MULTI-CROP HOLDINGS
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {crops.length} Active Crops Monitored
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2 tracking-tight">
              <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Multi-Crop Precision Monitoring & Field Cards</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simultaneous real-time health, disease alertness, and acreage tracking for all active crops.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddCropModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add New Crop</span>
          </button>
        </div>

        {/* Box-Wise Multi-Crop Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {crops.map((crop) => (
            <div
              key={crop.id}
              className={`p-5 rounded-3xl bg-slate-50/90 dark:bg-slate-950/80 border ${crop.border_color} shadow-sm hover:shadow-xl transition-all duration-200 space-y-4 relative group flex flex-col justify-between`}
            >
              {/* Box Top Header: Icon + Crop Name (Left) & Crop Alertness Badge (Top Right) */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xl shadow-sm">
                    {crop.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                      {crop.crop_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {crop.field_name} ({crop.area_acres} Acres)
                    </p>
                  </div>
                </div>

                {/* TOP RIGHT: Crop Alertness Status Badge */}
                <div className={`px-2.5 py-1 rounded-xl font-mono font-extrabold text-[11px] border backdrop-blur-md ${crop.bg_badge}`}>
                  {crop.alertness_label}
                </div>
              </div>

              {/* Crop Health & Stage Metrics */}
              <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Health Score (NDVI):</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {crop.health_score}% <span className="text-[10px] text-slate-400 font-normal">({crop.ndvi} NDVI)</span>
                  </span>
                </div>

                {/* Progress Health Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      crop.alertness_level === 'HEALTHY'
                        ? 'bg-emerald-500'
                        : crop.alertness_level === 'MODERATE_STRESS'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${crop.health_score}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-slate-400 block text-[10px]">Growth Stage</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {crop.stage}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-slate-400 block text-[10px]">Days to Harvest</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                      {crop.days_to_harvest} Days Left
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug pt-1">
                  {crop.description}
                </p>
              </div>

              {/* Box Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-mono">
                  Scan: {crop.last_scanned}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigate('/upload')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold transition border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1"
                  >
                    <span>Scan</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveCrop(crop.id, crop.crop_name)}
                    className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    title="Remove Crop Card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Crop Dash Box Card */}
          <button
            type="button"
            onClick={() => setIsAddCropModalOpen(true)}
            className="p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 dark:bg-slate-950/40 dark:hover:bg-emerald-500/5 transition duration-200 flex flex-col items-center justify-center gap-3 text-center min-h-[260px] group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition shadow-inner">
              <Plus className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                + Add Another Crop Holding
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                Monitor different crops simultaneously (Rice, Wheat, Tomato, Corn, etc.).
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Actionable Field Recommendations Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Actionable Smart Tasks */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-4 backdrop-blur-xl transition-colors duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Actionable Field Recommendations (What Should I Do?)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prescribed agronomic interventions tailored to real-time sensor & vision analytics.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'rec-1',
                title: 'Schedule 2-Hour Drip Irrigation on Zones Z04 & Z05',
                reason: 'Acute transpiration deficit (CWSI 0.76 - 0.82) indicates root-zone depletion.',
                priority: 'HIGH',
                prioColor: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30',
                actionLabel: 'Execute Irrigation',
              },
              {
                id: 'rec-2',
                title: 'Ground-Scout NW Sector of Zone Z03 for Foliar Rust',
                reason: 'Early Yellow Rust chlorosis detected before canopy humidity triggers sporulation.',
                priority: 'HIGH',
                prioColor: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30',
                actionLabel: 'Mark Inspected',
              },
              {
                id: 'rec-3',
                title: 'Monitor South-West Perimeter for Airborne Inoculum',
                reason: 'Downwind spore corridor active from neighboring holding #NB-1 (3.4km SW).',
                priority: 'MEDIUM',
                prioColor: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
                actionLabel: 'Check Perimeter',
              },
            ].map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm backdrop-blur-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono ${rec.prioColor}`}
                    >
                      {rec.priority}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-200 text-xs">{rec.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{rec.reason}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteAction(rec.title)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md flex-shrink-0"
                >
                  <span>{rec.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: 8 Farmer Core Questions Quick Reference */}
        <div className="p-6 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-4 backdrop-blur-xl transition-colors duration-200">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Farmer Executive Summary</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Plain-language status at a glance.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 space-y-1 backdrop-blur-md">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                1. Is my farm healthy?
              </span>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                Yes, {summary?.overall_health_score || 84.5}% overall vitality in good condition.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 space-y-1 backdrop-blur-md">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                2. Where is the problem?
              </span>
              <p className="font-semibold text-rose-700 dark:text-rose-400">
                Zone Z03 (Foliar Rust) & Zone Z04/Z05 (Moisture Deficit).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 space-y-1 backdrop-blur-md">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                3. Could it spread?
              </span>
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Estimated airborne spread risk active from 3.4km SW.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedZone && isTemporalModalOpen && (
        <ZoneTemporalAnalyticsModal
          zone={selectedZone}
          onClose={() => setIsTemporalModalOpen(false)}
        />
      )}
      {/* Add New Crop Holding Modal */}
      {isAddCropModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>+ Add New Crop Holding</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Register another crop parcel to monitor multiple crops simultaneously.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCropModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCropSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Crop Type / Variety *
                  </label>
                  <select
                    value={addCropName}
                    onChange={(e) => {
                      setAddCropName(e.target.value);
                      const iconMap: Record<string, string> = {
                        Wheat: '🌾',
                        Rice: '🍚',
                        Corn: '🌽',
                        Tomato: '🍅',
                        Banana: '🍌',
                        Cotton: '🌱',
                        Sugarcane: '🎍',
                        Potato: '🥔',
                        Mustard: '🌼',
                        Soybean: '🫘',
                      };
                      if (iconMap[e.target.value]) {
                        setAddCropIcon(iconMap[e.target.value]);
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="Cotton">🌱 Cotton</option>
                    <option value="Sugarcane">🎍 Sugarcane</option>
                    <option value="Potato">🥔 Potato</option>
                    <option value="Mustard">🌼 Mustard</option>
                    <option value="Soybean">🫘 Soybean</option>
                    <option value="Wheat">🌾 Wheat</option>
                    <option value="Rice">🍚 Rice / Paddy</option>
                    <option value="Corn">🌽 Corn / Maize</option>
                    <option value="Tomato">🍅 Tomato</option>
                    <option value="Banana">🍌 Banana</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Crop Symbol / Emoji
                  </label>
                  <input
                    type="text"
                    required
                    value={addCropIcon}
                    onChange={(e) => setAddCropIcon(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Field / Parcel Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Block - Parcel 4"
                  value={addFieldName}
                  onChange={(e) => setAddFieldName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Field Area (Acres) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={addAreaAcres}
                    onChange={(e) => setAddAreaAcres(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Days to Harvest
                  </label>
                  <input
                    type="number"
                    required
                    value={addDaysToHarvest}
                    onChange={(e) => setAddDaysToHarvest(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Growth Stage Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sowing & Emergence Stage"
                  value={addStage}
                  onChange={(e) => setAddStage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCropModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Crop Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
