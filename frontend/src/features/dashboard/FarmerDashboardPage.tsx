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
  Stethoscope,
  ArrowUpRight,
  X,
  Trash2,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { farmService } from '@/services/farmService';
import { zoneService } from '@/services/zoneService';
import { weatherService, mockFarmWeatherRiskData } from '@/services/weatherService';
import { WeatherRiskForecastCard } from '@/features/weather/WeatherRiskForecastCard';
import { FarmWeatherRiskResponse } from '@/types/weatherRisk';
import { ZoneTemporalAnalyticsModal } from '@/features/temporal/ZoneTemporalAnalyticsModal';
import { LanguageSwitcher } from '@/features/advisories/LanguageSwitcher';
import { AdvisoryCard } from '@/features/advisories/AdvisoryCard';
import { advisoryService } from '@/services/advisoryService';
import { Advisory } from '@/types/advisory';
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
  image_url?: string;
}

export const FarmerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FarmerDashboardSummary | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Multi-Crop Monitoring State (Maharashtra Focus with real crop background visuals)
  const [crops, setCrops] = useState<CropMonitoringCardData[]>([
    {
      id: 'crop-1',
      crop_name: 'कापूस / Bt Cotton (Bollgard II)',
      icon: '🌿',
      field_name: 'विदर्भ ब्लॉक A1 (Yavatmal Sector)',
      area_acres: 14.5,
      health_score: 92,
      ndvi: 0.85,
      alertness_level: 'HEALTHY',
      alertness_label: '● उत्तम आरोग्य (92%)',
      stage: 'Boll Formation Stage (बोंड विकास)',
      days_to_harvest: 35,
      last_scanned: 'Today, 08:30 AM',
      description: 'काळया कसदार जमिनीत उत्तम पोषण. गुलाबी बोंडअळीचा (Pink Bollworm) प्रादुर्भाव शून्य.',
      bg_badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      border_color: 'border-emerald-200 dark:border-emerald-800/80',
      image_url: 'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-2',
      crop_name: 'ऊस / Sugarcane (Co-86032)',
      icon: '🎋',
      field_name: 'कोल्हापूर बागायत प्लॉट #4',
      area_acres: 22.0,
      health_score: 95,
      ndvi: 0.88,
      alertness_level: 'HEALTHY',
      alertness_label: '● निरोगी वाढ (95%)',
      stage: 'Grand Growth Stage (जोमदार वाढ)',
      days_to_harvest: 120,
      last_scanned: 'Today, 09:15 AM',
      description: 'पंचगंगा नदी खोऱ्यातील गाळाच्या जमिनीत उत्तम सूक्ष्म-सिंचन. कांड्यांची लांबी व गोडी समाधानकारक.',
      bg_badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      border_color: 'border-emerald-200 dark:border-emerald-800/80',
      image_url: 'https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-3',
      crop_name: 'सोयाबीन / Soybean (JS-335)',
      icon: '🌱',
      field_name: 'लातूर-मराठवाडा खरीप पट्टा',
      area_acres: 16.0,
      health_score: 78,
      ndvi: 0.72,
      alertness_level: 'MODERATE_STRESS',
      alertness_label: '⚠️ कीड दक्षता (Pest Alert)',
      stage: 'Pod Development Stage (शेंगा भरणे)',
      days_to_harvest: 28,
      last_scanned: 'Yesterday, 04:30 PM',
      description: 'पानांवरील स्पोडोप्टेरा अळीच्या किरकोळ खुणा. निंबोळी अर्क ५% फवारणीची शिफारस.',
      bg_badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      border_color: 'border-amber-200 dark:border-amber-800/80',
      image_url: 'https://images.unsplash.com/photo-1599588675200-a664654e0c3f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-4',
      crop_name: 'कांदा / Red Onion (Fursungi)',
      icon: '🧅',
      field_name: 'नाशिक (लासलगाव कृषी पट्टा)',
      area_acres: 9.5,
      health_score: 84,
      ndvi: 0.76,
      alertness_level: 'HEALTHY',
      alertness_label: '● समाधानकारक (84%)',
      stage: 'Bulb Development (कांदा पोसणे)',
      days_to_harvest: 40,
      last_scanned: 'Today, 07:00 AM',
      description: 'जांभळा करपा (Purple Blotch) नियंत्रणात. ड्रीपद्वारे 0:52:34 खत मात्रा सुरू आहे.',
      bg_badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      border_color: 'border-emerald-200 dark:border-emerald-800/80',
      image_url: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-5',
      crop_name: 'द्राक्षे / Grapes (Thompson Seedless)',
      icon: '🍇',
      field_name: 'सांगली-तासगाव निर्यात प्लॉट',
      area_acres: 6.0,
      health_score: 91,
      ndvi: 0.82,
      alertness_level: 'HEALTHY',
      alertness_label: '● निर्यात दर्जा (91%)',
      stage: 'Berry Softening / Veraison',
      days_to_harvest: 45,
      last_scanned: 'Today, 06:45 AM',
      description: 'भुरी व डाऊनी मिल्ड्यू (Downy Mildew) प्रतिबंधात्मक बोर्डो मिश्रण फवारणी पूर्ण.',
      bg_badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      border_color: 'border-emerald-200 dark:border-emerald-800/80',
      image_url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-6',
      crop_name: 'डाळिंब / Pomegranate (Bhagwa)',
      icon: '🍎',
      field_name: 'सोलापूर (सांगोला ऑर्चर्ड #2)',
      area_acres: 5.5,
      health_score: 88,
      ndvi: 0.79,
      alertness_level: 'HEALTHY',
      alertness_label: '● भगवा फळ विकास (88%)',
      stage: 'Mrig Bahar Fruit Sizing',
      days_to_harvest: 55,
      last_scanned: 'Yesterday, 05:00 PM',
      description: 'तेलकट डाग (Bacterial Blight / Telya) शून्य. पाण्याचा ताण योग्य नियोजनात.',
      bg_badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      border_color: 'border-emerald-200 dark:border-emerald-800/80',
      image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
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

  // Modals & Weather Forecasting State
  const [isTemporalModalOpen, setIsTemporalModalOpen] = useState<boolean>(false);
  const [weatherRiskData, setWeatherRiskData] = useState<FarmWeatherRiskResponse>(mockFarmWeatherRiskData);
  const [weatherHorizon, setWeatherHorizon] = useState<number>(7);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadWeatherRisk = async (farmId?: string, horizon: number = 7) => {
    try {
      setIsWeatherLoading(true);
      const res = await weatherService.getFarmRiskDossier(farmId || selectedFarmId || 'farm-cbe-01', horizon);
      if (res && res.forecast_timeline && res.forecast_timeline.length > 0) {
        setWeatherRiskData(res);
      } else {
        setWeatherRiskData(mockFarmWeatherRiskData);
      }
    } catch {
      setWeatherRiskData(mockFarmWeatherRiskData);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [sumRes, farmsRes, advRes] = await Promise.all([
        dashboardService.getFarmerSummary(),
        farmService.listFarms(),
        advisoryService.getAdvisories(),
      ]);
      setSummary(sumRes);
      setFarms(farmsRes.farms);
      setAdvisories(advRes);
      if (farmsRes.farms.length > 0) {
        const firstFarmId = farmsRes.farms[0].id;
        setSelectedFarmId(firstFarmId);
        loadFarmZones(firstFarmId);
        loadWeatherRisk(firstFarmId, weatherHorizon);
      } else {
        loadWeatherRisk('farm-cbe-01', weatherHorizon);
      }
    } catch (err: any) {
      console.error('Failed to load farmer dashboard summary', err);
      loadWeatherRisk('farm-cbe-01', weatherHorizon);
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

    const bgMap: Record<string, string> = {
      Wheat: '/wheat-bg.jpg',
      Rice: '/rice-bg.jpg',
      Tomato: '/tomato-bg.jpg',
      Corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
      Banana: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80',
      Cotton: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=800&q=80',
      Potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
      Sugarcane: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80',
    };

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
      image_url: bgMap[addCropName] || '/wheat-bg.jpg',
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
                onClick={() => navigate('/diagnosis')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm transition-all duration-200 shadow-xl shadow-emerald-500/25"
              >
                <Stethoscope className="w-4 h-4 text-slate-950" />
                Identify Disease
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

      {/* ═══ Weather & Multi-Vector Predictive Risk Forecasting ═══ */}
      <WeatherRiskForecastCard
        riskData={weatherRiskData}
        selectedHorizon={weatherHorizon}
        isLoading={isWeatherLoading}
        onHorizonChange={(days) => {
          setWeatherHorizon(days);
          loadWeatherRisk(selectedFarmId, days);
        }}
        onRefresh={() => loadWeatherRisk(selectedFarmId, weatherHorizon)}
      />

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

        {/* Box-Wise Multi-Crop Cards Grid with High-Contrast Text Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {crops.map((crop) => (
            <div
              key={crop.id}
              className={`rounded-3xl overflow-hidden border ${crop.border_color} bg-white dark:bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between`}
            >
              {/* ── Top Visual Crop Banner with Dark Scrim for 100% Text Readability ── */}
              <div className="relative h-28 w-full overflow-hidden flex-shrink-0 bg-slate-900">
                {crop.image_url && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                    style={{ backgroundImage: `url('${crop.image_url}')` }}
                  />
                )}

                {/* Dark gradient scrim ensures top title and badge are always crystal-clear */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/40" />

                {/* Top Banner Content */}
                <div className="relative z-10 p-4 h-full flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-white/40 dark:border-slate-700 flex items-center justify-center text-xl shadow-lg backdrop-blur-md flex-shrink-0">
                      {crop.icon}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-sm tracking-tight drop-shadow-md">
                        {crop.crop_name}
                      </h3>
                      <p className="text-[11px] text-slate-200 font-medium flex items-center gap-1 drop-shadow-sm mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {crop.field_name} ({crop.area_acres} Acres)
                      </p>
                    </div>
                  </div>

                  {/* TOP RIGHT: Alertness Status Badge — Solid Pill with High Contrast */}
                  <div
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-extrabold shadow-lg backdrop-blur-md flex-shrink-0 ${
                      crop.alertness_level === 'HEALTHY'
                        ? 'bg-emerald-600 text-white border border-emerald-400/40 shadow-emerald-950/40'
                        : crop.alertness_level === 'MODERATE_STRESS'
                        ? 'bg-amber-500 text-slate-950 border border-amber-300 font-black shadow-amber-950/40'
                        : 'bg-rose-600 text-white border border-rose-400/40 shadow-rose-950/40'
                    }`}
                  >
                    {crop.alertness_label}
                  </div>
                </div>
              </div>

              {/* ── Solid High-Contrast Card Body: 100% Text Priority ── */}
              <div className="p-5 space-y-3.5 flex flex-col justify-between flex-1 bg-white dark:bg-slate-900">
                {/* Health Score Metric */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                      Health Score (NDVI):
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {crop.health_score}%{' '}
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                        ({crop.ndvi} NDVI)
                      </span>
                    </span>
                  </div>

                  {/* Progress Health Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
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
                </div>

                {/* Growth Stage & Days to Harvest Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">
                      Growth Stage
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white truncate block text-xs mt-0.5">
                      {crop.stage}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">
                      Days to Harvest
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block text-xs mt-0.5">
                      {crop.days_to_harvest} Days Left
                    </span>
                  </div>
                </div>

                {/* Description Text — Ultra High Contrast */}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {crop.description}
                </p>

                {/* Box Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-semibold">
                    Scan: {crop.last_scanned}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/upload')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95"
                    >
                      <span>Scan</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(crop.id, crop.crop_name)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      title="Remove Crop Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* ═══ MULTILINGUAL AGRICULTURAL ADVISORIES (IPM Precision Pipeline) ═══ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-extrabold uppercase border border-emerald-500/30">
                Precision Agricultural Guidance
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sprout className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>Active Agricultural Advisories (पीक संरक्षण सल्ला)</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="minimal" />
            <button
              type="button"
              onClick={() => navigate('/advisories')}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-900/20 active:scale-95"
            >
              <span>View All ({advisories.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Active Advisory Card */}
        {advisories.length > 0 && (
          <AdvisoryCard
            advisory={advisories[0]}
            onRequestValidation={() => navigate('/validation')}
          />
        )}
      </div>

      {/* ═══ FOLLOW-UP MONITORING & CROP HEALTH TRACKING ═══ */}
      <div className="p-6 rounded-3xl bg-white/85 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-extrabold uppercase border border-blue-500/30">
                Closed-Loop Tracking
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Follow-up Monitoring & Health Tracking</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={() => navigate('/monitoring')}
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-900/20 active:scale-95"
          >
            <span>Open Monitoring Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Scheduled Re-Check</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-700 border border-rose-500/30">HIGH PRIORITY</span>
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Zone Z17 (Greenhouse Block)</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Targeted Early Blight multispectral follow-up re-scan.</p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Method: <strong>Drone Scan</strong></span>
              <span className="text-rose-600 font-bold">Due Tomorrow</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Irrigation Recovery</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 border border-amber-500/30">MEDIUM</span>
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Zone Z04 (Pomegranate South)</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Transpiration check after 2-hour drip flush.</p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Method: <strong>Field Scout</strong></span>
              <span className="text-emerald-600 font-bold">In 3 Days</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 dark:text-emerald-300">Latest Before vs After</span>
              <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-200 mt-1">Zone Z02 (Cotton Block)</h4>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1">Canopy vigor improved (+18 pts). Hotspot contracted.</p>
            </div>
            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span>Trend: IMPROVING</span>
              <button type="button" onClick={() => navigate('/monitoring')} className="underline">View Comparison</button>
            </div>
          </div>
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
