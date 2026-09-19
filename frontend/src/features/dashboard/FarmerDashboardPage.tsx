import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Droplets,
  CheckCircle2,
  Plane,
  TrendingUp,
  MapPin,
  Wind,
  Plus,
  PlusCircle,
  Sprout,
  Stethoscope,
  ArrowUpRight,
  X,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { farmService } from '@/services/farmService';
import { zoneService } from '@/services/zoneService';
import { weatherService, mockFarmWeatherRiskData, WeatherRiskDataWithMeta, RealWeatherCurrentResponse, RealForecastResponse, SprayWindowResponse } from '@/services/weatherService';
import { WeatherRiskForecastCard } from '@/features/weather/WeatherRiskForecastCard';
import { ZoneTemporalAnalyticsModal } from '@/features/temporal/ZoneTemporalAnalyticsModal';

import { WaterRequirementMapViewer } from '@/features/water/WaterRequirementMapViewer';
import { advisoryService } from '@/services/advisoryService';
import { Advisory } from '@/types/advisory';
import {
  Farm,
  Zone,
  FarmerDashboardSummary,
} from '@/types';
import { useAuth } from '@/context/AuthContext';

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
  const { isAuthenticated, isLoading } = useAuth();
  const authStatus = isLoading ? 'AUTH_INITIALIZING' : (isAuthenticated ? 'AUTHENTICATED' : 'UNAUTHENTICATED');
  const [summary, setSummary] = useState<FarmerDashboardSummary | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  
  // Real-Time Location State
  const [userLocationName, setUserLocationName] = useState<string>('Detecting location...');

  // Multi-Crop Monitoring State (Clean English)
  const [crops, setCrops] = useState<CropMonitoringCardData[]>([
    {
      id: 'crop-1',
      crop_name: 'Bt Cotton (Bollgard II)',
      icon: '🌿',
      field_name: 'Vidarbha Block A1 (Yavatmal Sector)',
      area_acres: 14.5,
      health_score: 92,
      ndvi: 0.85,
      alertness_level: 'HEALTHY',
      alertness_label: '● Optimal Health (92%)',
      stage: 'Boll Formation Stage',
      days_to_harvest: 35,
      last_scanned: 'Today, 08:30 AM',
      description: 'Optimal nutrient profile in deep black soil. Zero Pink Bollworm infestation detected.',
      bg_badge: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
      border_color: 'border-agri-200 dark:border-agri-700/30',
      image_url: 'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-2',
      crop_name: 'Sugarcane (Co-86032)',
      icon: '🎋',
      field_name: 'Kolhapur Irrigated Plot #4',
      area_acres: 22.0,
      health_score: 95,
      ndvi: 0.88,
      alertness_level: 'HEALTHY',
      alertness_label: '● Vigorous Growth (95%)',
      stage: 'Grand Growth Stage',
      days_to_harvest: 120,
      last_scanned: 'Today, 09:15 AM',
      description: 'Panchganga basin alluvial loam with precision micro-irrigation. Internode development is healthy.',
      bg_badge: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
      border_color: 'border-agri-200 dark:border-agri-700/30',
      image_url: 'https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-3',
      crop_name: 'Soybean (JS-335)',
      icon: '🌱',
      field_name: 'Latur-Marathwada Kharif Belt',
      area_acres: 16.0,
      health_score: 78,
      ndvi: 0.72,
      alertness_level: 'MODERATE_STRESS',
      alertness_label: '⚠️ Pest Caution (78%)',
      stage: 'Pod Development Stage',
      days_to_harvest: 28,
      last_scanned: 'Yesterday, 04:30 PM',
      description: 'Minor Spodoptera leaf grazing detected. Bio-pesticide neem extract 5% recommended.',
      bg_badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      border_color: 'border-amber-200 dark:border-amber-800/80',
      image_url: 'https://images.unsplash.com/photo-1599588675200-a664654e0c3f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-4',
      crop_name: 'Red Onion (Fursungi)',
      icon: '🧅',
      field_name: 'Nashik Agro Belt #2',
      area_acres: 9.5,
      health_score: 84,
      ndvi: 0.76,
      alertness_level: 'HEALTHY',
      alertness_label: '● Good Condition (84%)',
      stage: 'Bulb Development Stage',
      days_to_harvest: 40,
      last_scanned: 'Today, 07:00 AM',
      description: 'Purple blotch fungal risk controlled. Soluble fertilizer fertigation active.',
      bg_badge: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
      border_color: 'border-agri-200 dark:border-agri-700/30',
      image_url: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-5',
      crop_name: 'Grapes (Thompson Seedless)',
      icon: '🍇',
      field_name: 'Sangli Export Vineyard',
      area_acres: 6.0,
      health_score: 91,
      ndvi: 0.82,
      alertness_level: 'HEALTHY',
      alertness_label: '● Export Quality (91%)',
      stage: 'Berry Softening / Veraison',
      days_to_harvest: 45,
      last_scanned: 'Today, 06:45 AM',
      description: 'Preventative Bordeaux mixture application completed against Downy Mildew.',
      bg_badge: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
      border_color: 'border-agri-200 dark:border-agri-700/30',
      image_url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'crop-6',
      crop_name: 'Pomegranate (Bhagwa)',
      icon: '🍎',
      field_name: 'Solapur Orchard Sector #2',
      area_acres: 5.5,
      health_score: 88,
      ndvi: 0.79,
      alertness_level: 'HEALTHY',
      alertness_label: '● Fruit Sizing (88%)',
      stage: 'Mrig Bahar Fruit Sizing',
      days_to_harvest: 55,
      last_scanned: 'Yesterday, 05:00 PM',
      description: 'Zero bacterial blight (Telya) observed. Root soil moisture within ideal range.',
      bg_badge: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
      border_color: 'border-agri-200 dark:border-agri-700/30',
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
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState<boolean>(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState<boolean>(false);
  const [weatherRiskData, setWeatherRiskData] = useState<WeatherRiskDataWithMeta>(mockFarmWeatherRiskData);
  const [weatherHorizon, setWeatherHorizon] = useState<number>(7);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [, setAdvisories] = useState<Advisory[]>([]);
  // Real weather from IMD/Open-Meteo
  const [realWeather, setRealWeather] = useState<RealWeatherCurrentResponse | null>(null);
  const [realForecast, setRealForecast] = useState<RealForecastResponse | null>(null);
  const [sprayWindow, setSprayWindow] = useState<SprayWindowResponse | null>(null);

  useEffect(() => {
    loadInitialData();
    
    // Auto-refresh weather every 15 minutes (900000 ms)
    const intervalId = setInterval(() => {
      loadWeatherRisk(selectedFarmId, weatherHorizon);
    }, 900000);
    
    return () => clearInterval(intervalId);
  }, [selectedFarmId, weatherHorizon]);

  const loadWeatherRisk = async (farmId?: string, horizon: number = 7) => {
    try {
      setIsWeatherLoading(true);
      const targetFarm = farmId || selectedFarmId || 'farm-cbe-01';
      
      let lat: number | undefined;
      let lon: number | undefined;
      
      // Attempt geolocation if supported
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
                timeout: 10000,
                enableHighAccuracy: true 
            });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          // Show formatted coords now; will be replaced by resolved city name below
          setUserLocationName(
            `${lat >= 0 ? lat.toFixed(4) + '°N' : Math.abs(lat).toFixed(4) + '°S'}, ` +
            `${lon >= 0 ? lon.toFixed(4) + '°E' : Math.abs(lon).toFixed(4) + '°W'}`
          );
        } catch (e: any) {
          console.warn('Geolocation error:', e);
          // Default to farm region when GPS is denied/unavailable
          setUserLocationName('Coimbatore, Tamil Nadu');
        }
      } else {
        setUserLocationName('Coimbatore, Tamil Nadu');
      }

      const res = await weatherService.getFarmRiskDossier(targetFarm, horizon, lat, lon);
      if (res && res.forecast_timeline && res.forecast_timeline.length > 0) {
        setWeatherRiskData(res);
        // If AccuWeather resolved a city name, use it — it's more readable than raw coords
        if (res.current_weather?.location_name) {
          setUserLocationName(res.current_weather.location_name);
        }
        // If API succeeded but no location_name (OpenMeteo fallback) keep the formatted coords already set
      } else {
        setWeatherRiskData({ ...mockFarmWeatherRiskData, _is_mock_fallback: true });
        if (!lat) setUserLocationName('Location unavailable');
      }
    } catch {
      setWeatherRiskData({ ...mockFarmWeatherRiskData, _is_mock_fallback: true });
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const loadRealWeather = async (farmId: string, lat?: number, lon?: number) => {
    try {
      const [cur, fc, sw] = await Promise.all([
        weatherService.getRealCurrentWeather(farmId, lat, lon),
        weatherService.getRealForecast(farmId, 7, lat, lon),
        weatherService.getSprayWindow(farmId, lat, lon),
      ]);
      if (cur) setRealWeather(cur);
      if (fc) setRealForecast(fc);
      if (sw) setSprayWindow(sw);
    } catch (e) {
      console.warn('[Dashboard] Real weather load failed:', e);
    }
  };

  const loadInitialData = async () => {
    // Block API calls until auth is initialized
    if (authStatus === 'AUTH_INITIALIZING') return;
    
    try {
      // Only fetch protected data if we are authenticated
      let advRes: Advisory[] = [];
      if (authStatus === 'AUTHENTICATED') {
        advRes = await advisoryService.getAdvisories();
      }

      const [sumRes, farmsRes] = await Promise.all([
        dashboardService.getFarmerSummary(),
        farmService.listFarms(),
      ]);
      
      setSummary(sumRes);
      setFarms(farmsRes.farms);
      setAdvisories(advRes);
      
      if (farmsRes.farms.length > 0) {
        const firstFarmId = farmsRes.farms[0].id;
        setSelectedFarmId(firstFarmId);
        loadFarmZones(firstFarmId);
        loadWeatherRisk(firstFarmId, weatherHorizon);
        loadRealWeather(firstFarmId);
      } else {
        loadWeatherRisk('farm-cbe-01', weatherHorizon);
      }
    } catch (err: any) {
      console.error('Failed to load farmer dashboard summary', err);
      loadWeatherRisk('farm-cbe-01', weatherHorizon);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [authStatus]);

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
      bg_badge: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
      border_color: 'border-agri-200 dark:border-agri-700/30',
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


  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto transition-colors duration-200">
      {/* Top Action Bar (Farm Selector & Language) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#8d7e84] font-semibold">Active Field Holding:</span>
            <span className="text-white font-bold border-b border-dotted border-white/60 pb-0.5 cursor-pointer">
              West Valley Holdings (Wheat)
            </span>
            <span className="text-[#8d7e84] ml-1">·</span>
          </div>
        </div>
        <button
          type="button"
          onClick={loadInitialData}
          className="px-3.5 py-1.5 rounded-xl bg-[#221c1f] hover:bg-[#2c2428] border border-[#382d33] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition self-start sm:self-auto"
          title="Refresh Telemetry"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Sync Telemetry</span>
        </button>
      </div>

      {/* Action Notification Toast */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Glassmorphic Bento-Grid: Key Micro-Metric Cards (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Overall Vitality Circle Gauge */}
        <div className="p-5 rounded-2xl bg-[#1c1719] border border-[#2b2226] shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8d7e84]">
              CROP HEALTH SCORE
            </span>
            {/* Circular SVG Gauge */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#2b2226]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#4ade80"
                  strokeDasharray={`${summary?.overall_health_score || 84.5}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">
                {summary?.overall_health_score || 84.5}%
              </span>
              <span className="text-xs text-[#4ade80] font-bold">
                ↗ +2.1%
              </span>
            </div>
            <p className="text-xs text-[#65a30d] font-semibold mt-3 leading-snug">
              Good Condition (Selective Zonal Attention Required)
            </p>
          </div>
        </div>

        {/* 2. Soil Moisture & Water Stress Level */}
        <div
          onClick={() => setIsWaterModalOpen(true)}
          className="p-5 rounded-2xl bg-[#1c1719] border border-[#2b2226] shadow-lg flex flex-col justify-between cursor-pointer hover:border-[#382d33] transition"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8d7e84]">
              WATER STRESS / CWSI
            </span>
            <div className="p-1.5 rounded-xl bg-[#182633] text-[#38bdf8] border border-[#203a4f]">
              <Droplets className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-black text-white font-mono">0.76</span>
              <span className="text-xs text-[#f59e0b] bg-[#422e17] border border-[#785123] px-2.5 py-0.5 rounded-full font-bold">
                Moderate Stress
              </span>
            </div>
            {/* Stress progress bar */}
            <div className="w-full h-2 rounded-full bg-[#33282d] overflow-hidden mt-3">
              <div className="h-full rounded-full bg-gradient-to-r from-[#d97706] to-[#f59e0b] w-[65%]" />
            </div>
            <p className="text-xs text-[#8d7e84] mt-3 leading-snug">
              Zones Z04 &amp; Z05 need irrigation within 24h
            </p>
          </div>
        </div>

        {/* 3. Microclimate & Weather Card (Dindigul) */}
        <div
          onClick={() => setIsWeatherModalOpen(true)}
          className="p-5 rounded-2xl bg-[#1c1719] border border-[#2b2226] shadow-lg flex flex-col justify-between cursor-pointer hover:border-[#382d33] transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[#f43f5e] text-xs">📍</span>
              <span className="text-xs font-bold text-white">Dindigul</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-lg">⛅</span>
              <div className="text-[10px] text-[#8d7e84] font-medium leading-tight">
                <div>September 19, 2026</div>
                <div>02:58 PM</div>
              </div>
            </div>
          </div>

          <div className="my-1.5">
            <div className="text-3xl font-black text-white leading-none">
              34.0°C
            </div>
            <p className="text-xs text-[#8d7e84] font-medium mt-1">Cloudy</p>

            <div className="grid grid-cols-3 gap-1 pt-3 border-t border-[#2b2226] text-left mt-2.5 text-xs">
              <div>
                <span className="text-[10px] text-[#8d7e84] block font-semibold">Humidity</span>
                <span className="font-bold text-white">48%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d7e84] block font-semibold">Precipitation</span>
                <span className="font-bold text-white">0.0 mm</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8d7e84] block font-semibold">Wind Speed</span>
                <span className="font-bold text-white">8 km/h</span>
              </div>
            </div>

            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#38bdf8] bg-[#241c20] border border-[#382d33] px-2.5 py-1 rounded-lg">
                📊 OpenWeatherMap Live
              </span>
            </div>
          </div>
        </div>

        {/* 4. Next Drone Surveillance Mission */}
        <div className="p-5 rounded-2xl bg-[#1c1719] border border-[#2b2226] shadow-lg flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8d7e84]">
              DRONE SURVEILLANCE
            </span>
            <div className="p-2 rounded-full bg-[#2d1c22] border border-[#4a2833] text-[#fb7185] flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-base font-bold text-white mt-1">
              Tomorrow 09:00 AM
            </div>
            <div className="mt-1.5">
              <span className="text-xs font-mono font-bold text-[#4ade80] bg-[#16291e] border border-[#254b35] px-2 py-0.5 rounded-md">
                MSN-20260831-TGT1
              </span>
            </div>
            <p className="text-xs text-[#8d7e84] mt-2.5 leading-snug">
              Targeting Zones Z03, Z04, Z05 (45m Alt)
            </p>
          </div>
        </div>
      </div>

      {/* 3. Multi-Crop Management Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#2b2226]">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🌾 Field Crops & Multi-Crop Status</span>
          </h2>
          <p className="text-xs text-[#8d7e84] font-medium mt-0.5">
            Real-time biometric indices, NDVI metrics, and harvest milestones per crop zone
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddCropModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] active:scale-95 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
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
              className={`rounded-3xl overflow-hidden border ${crop.border_color} bg-white dark:bg-surface-darkCard shadow-md hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between`}
            >
              {/* ── Top Visual Crop Banner with Dark Scrim for 100% Text Readability ── */}
              <div className="relative h-28 w-full overflow-hidden flex-shrink-0 bg-agri-900">
                {/* Removed image background to keep it clean and humanized */}

                {/* Dark gradient scrim ensures top title and badge are always crystal-clear */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-agri-950/60 to-slate-950/40" />

                {/* Top Banner Content */}
                <div className="relative z-10 p-4 h-full flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-white/40 dark:border-agri-700/30 flex items-center justify-center text-xl shadow-lg backdrop-blur-md flex-shrink-0">
                      {crop.icon}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-sm tracking-tight drop-shadow-md">
                        {crop.crop_name}
                      </h3>
                      <p className="text-[11px] text-agri-200 font-medium flex items-center gap-1 drop-shadow-sm mt-0.5">
                        <MapPin className="w-3 h-3 text-agri-400" />
                        {crop.field_name} ({crop.area_acres} Acres)
                      </p>
                    </div>
                  </div>

                  {/* TOP RIGHT: Alertness Status Badge — Solid Pill with High Contrast */}
                  <div
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-extrabold shadow-lg backdrop-blur-md flex-shrink-0 ${
                      crop.alertness_level === 'HEALTHY'
                        ? 'bg-agri-500 text-white border border-emerald-400/40 shadow-emerald-950/40'
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
              <div className="p-5 space-y-3.5 flex flex-col justify-between flex-1 bg-white dark:bg-surface-darkCard">
                {/* Health Score Metric */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-agri-700 dark:text-agri-300 font-bold">
                      Health Score (NDVI):
                    </span>
                    <span className="font-black text-agri-900 dark:text-white text-sm">
                      {crop.health_score}%{' '}
                      <span className="text-xs text-agri-500/70 dark:text-agri-400/70 font-normal">
                        ({crop.ndvi} NDVI)
                      </span>
                    </span>
                  </div>

                  {/* Progress Health Bar */}
                  <div className="w-full h-2.5 rounded-full bg-agri-50 dark:bg-agri-800/50 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        crop.alertness_level === 'HEALTHY'
                          ? 'bg-agri-500'
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
                  <div className="p-2.5 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50/80 dark:border-agri-700/25 shadow-sm">
                    <span className="text-agri-500/70 dark:text-agri-400/70 block text-[10px] font-semibold">
                      Growth Stage
                    </span>
                    <span className="font-extrabold text-agri-900 dark:text-white truncate block text-xs mt-0.5">
                      {crop.stage}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50/80 dark:border-agri-700/25 shadow-sm">
                    <span className="text-agri-500/70 dark:text-agri-400/70 block text-[10px] font-semibold">
                      Days to Harvest
                    </span>
                    <span className="font-extrabold text-agri-600 dark:text-agri-400 block text-xs mt-0.5">
                      {crop.days_to_harvest} Days Left
                    </span>
                  </div>
                </div>

                {/* Description Text — Ultra High Contrast */}
                <p className="text-xs text-agri-700 dark:text-agri-300 leading-relaxed font-medium">
                  {crop.description}
                </p>

                {/* Box Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-agri-100 dark:border-agri-700/25">
                  <span className="text-[11px] text-agri-500/70 dark:text-agri-400/70 font-mono font-semibold">
                    Scan: {crop.last_scanned}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/analysis')}
                      className="px-3.5 py-1.5 rounded-xl bg-agri-500 hover:bg-agri-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95"
                    >
                      <span>Scan</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(crop.id, crop.crop_name)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/20 text-agri-400/70 hover:text-rose-600 dark:hover:text-rose-400 transition"
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
            className="p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-agri-700/25 hover:border-emerald-500 dark:hover:border-emerald-500 bg-surface-light/50 hover:bg-emerald-50/30 dark:bg-slate-950/40 dark:hover:bg-agri-600/5 transition duration-200 flex flex-col items-center justify-center gap-3 text-center min-h-[260px] group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-agri-500/10 text-agri-600 dark:text-agri-400 flex items-center justify-center group-hover:scale-110 transition shadow-inner">
              <Plus className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-agri-900 dark:text-agri-100 text-sm group-hover:text-agri-600 dark:group-hover:text-agri-400 transition">
                + Add Another Crop Holding
              </h3>
              <p className="text-xs text-agri-500/70 dark:text-agri-400/70 mt-1 max-w-[200px]">
                Monitor different crops simultaneously (Rice, Wheat, Tomato, Corn, etc.).
              </p>
            </div>
          </button>
        </div>

      {/* Row 2: FIELD EVIDENCE (Sensors & Pest Traps) */}
      <div className="p-5 rounded-2xl bg-[#1c1719] border border-[#2b2226] shadow-lg max-w-xl w-full">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8d7e84]">
            FIELD EVIDENCE
          </span>
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-[#281f23] border border-[#3d2e35] text-[#fb7185]">
              <Wind className="w-3.5 h-3.5" />
            </div>
            <div className="p-1.5 rounded-lg bg-[#281f23] border border-[#3d2e35] text-[#38bdf8]">
              <Droplets className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="p-3.5 rounded-xl bg-[#221c1f] border border-[#33282d]">
            <span className="text-[10px] text-[#8d7e84] uppercase font-bold tracking-wider block">
              PEST TRAPS
            </span>
            <span className="text-2xl font-black text-[#f59e0b] block mt-1">24</span>
            <span className="text-[9px] text-[#ef4444] font-extrabold uppercase tracking-wider block mt-1">
              HIGH ACTIVITY
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#221c1f] border border-[#33282d]">
            <span className="text-[10px] text-[#8d7e84] uppercase font-bold tracking-wider block">
              SOIL MOISTURE
            </span>
            <span className="text-2xl font-black text-[#38bdf8] block mt-1">18%</span>
            <span className="text-[9px] text-[#ef4444] font-extrabold uppercase tracking-wider block mt-1">
              CRITICALLY LOW
            </span>
          </div>
        </div>

        <p className="text-xs text-[#8d7e84] mt-3">
          Zone Z04 • Real-time (Updated 10m ago)
        </p>
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
        <div className="fixed inset-0 bg-agri-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-agri-200/50 dark:border-agri-700/25 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-agri-900 dark:text-white flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-agri-600 dark:text-agri-400" />
                  <span>+ Add New Crop Holding</span>
                </h3>
                <p className="text-xs text-agri-500/70 dark:text-agri-400/70">
                  Register another crop parcel to monitor multiple crops simultaneously.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCropModalOpen(false)}
                className="p-2 rounded-xl hover:bg-agri-50 dark:hover:bg-agri-800/60 text-agri-400/70 hover:text-agri-600 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCropSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
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
                    className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-agri-500 font-semibold"
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
                  <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                    Crop Symbol / Emoji
                  </label>
                  <input
                    type="text"
                    required
                    value={addCropIcon}
                    onChange={(e) => setAddCropIcon(e.target.value)}
                    className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-agri-500 font-semibold text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                  Field / Parcel Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Block - Parcel 4"
                  value={addFieldName}
                  onChange={(e) => setAddFieldName(e.target.value)}
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-agri-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                    Field Area (Acres) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={addAreaAcres}
                    onChange={(e) => setAddAreaAcres(e.target.value)}
                    className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-agri-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                    Days to Harvest
                  </label>
                  <input
                    type="number"
                    required
                    value={addDaysToHarvest}
                    onChange={(e) => setAddDaysToHarvest(e.target.value)}
                    className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-agri-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-agri-700 dark:text-agri-300">
                  Growth Stage Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sowing & Emergence Stage"
                  value={addStage}
                  onChange={(e) => setAddStage(e.target.value)}
                  className="w-full bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 rounded-xl px-3.5 py-2 text-xs text-agri-900 dark:text-agri-100 focus:outline-none focus:border-agri-500 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-agri-200/50 dark:border-agri-700/25">
                <button
                  type="button"
                  onClick={() => setIsAddCropModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/50 dark:hover:bg-agri-700/40 text-agri-700 dark:text-agri-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-agri-500 hover:bg-agri-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Crop Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 5. Weather Forecast Modal */}
      {isWeatherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsWeatherModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl">
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setIsWeatherModalOpen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <WeatherRiskForecastCard 
              riskData={weatherRiskData} 
              onRefresh={() => loadWeatherRisk(selectedFarmId, weatherHorizon)}
              onHorizonChange={(days) => setWeatherHorizon(days)}
              selectedHorizon={weatherHorizon}
              isLoading={isWeatherLoading}
            />
          </div>
        </div>
      )}

      {/* 6. Water Stress Modal */}
      {isWaterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsWaterModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-slate-900">
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setIsWaterModalOpen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <WaterRequirementMapViewer 
              farmId={selectedFarmId || 'farm-cbe-01'}
              farmName={summary?.farm_name || 'AgriShield Demo Farm'}
            />
          </div>
        </div>
      )}

    </div>
  );
};
