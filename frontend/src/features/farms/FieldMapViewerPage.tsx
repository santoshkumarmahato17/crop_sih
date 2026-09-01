import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Sun,
  Droplets,
  Wind,
  CloudRain,
  Calendar,
  Filter,
  MoreVertical,
  Maximize2,
  Plus,
  Minus,
  Navigation,
  Download,
  X,
  ExternalLink,
  Leaf,
  CheckSquare,
  Square,
  Sparkles,
  Map as MapIcon,
  Flame,
} from 'lucide-react';
import { IndiaPesticideHeatmapViewer } from '@/features/spatial-map/IndiaPesticideHeatmapViewer';

interface FieldZoneRecord {
  id: string;
  name: string;
  crop: string;
  status: 'Healthy' | 'Stable' | 'Warning';
  soilMoisture: string;
  temperature: string;
  growthStage: string;
  healthScore: number;
  humidity: string;
  phLevel: string;
  areaHectares: string;
  waterConsumption: string;
  fertilizerEfficiency: string;
  equipmentStatus: string;
  centerCoord: string;
  currentRiskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  currentRiskScore?: number;
  forecastRiskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  forecastRiskScore?: number;
  riskExplanation?: string;
}

export const FieldMapViewerPage: React.FC = () => {
  const navigate = useNavigate();

  // Mode: 'india_heatmap' | 'local_gis'
  const [viewMode, setViewMode] = useState<'india_heatmap' | 'local_gis'>('india_heatmap');
  const [riskLayerMode, setRiskLayerMode] = useState<'none' | 'current_risk' | 'forecast_risk'>('current_risk');

  // Search & Resource Tab state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resourcePeriod, setResourcePeriod] = useState<'week' | 'month' | 'year'>('week');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('zone-a1');
  const [isHudOpen, setIsHudOpen] = useState<boolean>(true);
  const [mapZoom, setMapZoom] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Field Zone Dataset matching screenshot
  const fieldZones: FieldZoneRecord[] = [
    {
      id: 'zone-a1',
      name: 'North Field A1 (Z01)',
      crop: 'Corn',
      status: 'Healthy',
      soilMoisture: '68%',
      temperature: '26°C',
      growthStage: 'Vegetative',
      healthScore: 70,
      humidity: '32%',
      phLevel: '2.8',
      areaHectares: '2.3',
      waterConsumption: '1,250L',
      fertilizerEfficiency: '87%',
      equipmentStatus: 'Active',
      centerCoord: '11.0168° N, 76.9558° E',
      currentRiskTier: 'LOW',
      currentRiskScore: 24,
      forecastRiskTier: 'LOW',
      forecastRiskScore: 32,
      riskExplanation: 'Optimal microclimate balance. Zero pathogen pressure.',
    },
    {
      id: 'zone-b2',
      name: 'East Field B2 (Z03)',
      crop: 'Wheat (PBW-550)',
      status: 'Warning',
      soilMoisture: '72%',
      temperature: '24°C',
      growthStage: 'Flowering & Heading',
      healthScore: 84,
      humidity: '84%',
      phLevel: '6.4',
      areaHectares: '4.1',
      waterConsumption: '2,100L',
      fertilizerEfficiency: '92%',
      equipmentStatus: 'Active',
      centerCoord: '11.0182° N, 76.9620° E',
      currentRiskTier: 'HIGH',
      currentRiskScore: 78,
      forecastRiskTier: 'CRITICAL',
      forecastRiskScore: 89,
      riskExplanation: 'High humidity & persistent rain escalate Yellow Rust fungal risk.',
    },
    {
      id: 'zone-c3',
      name: 'South Field C3 (Z04)',
      crop: 'Soybean',
      status: 'Warning',
      soilMoisture: '34%',
      temperature: '34°C',
      growthStage: 'Germination',
      healthScore: 54,
      humidity: '28%',
      phLevel: '5.9',
      areaHectares: '1.8',
      waterConsumption: '980L',
      fertilizerEfficiency: '71%',
      equipmentStatus: 'Maintenance',
      centerCoord: '11.0140° N, 76.9510° E',
      currentRiskTier: 'HIGH',
      currentRiskScore: 74,
      forecastRiskTier: 'CRITICAL',
      forecastRiskScore: 86,
      riskExplanation: 'CWSI deficit (0.78) and thermal stress indicate high water depletion.',
    },
  ];

  const currentField = fieldZones.find((f) => f.id === selectedFieldId) || fieldZones[0];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setToastMsg(`Exported high-res spatial GIS map report for ${currentField.name}!`);
      setTimeout(() => setToastMsg(null), 3500);
    }, 900);
  };

  // Weekly Heatmap Activity Data Matrix (Hours x Days)
  const hours = ['1pm', '2pm', '3pm', '4pm', '5pm', '6pm'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Intensity matrix (0: lowest, 4: highest)
  const heatmapData = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 4, 4, 4, 1, 1],
    [1, 3, 4, 4, 4, 2, 1],
    [1, 2, 3, 4, 4, 3, 1],
    [1, 2, 2, 4, 4, 1, 1],
    [1, 1, 2, 1, 1, 1, 1],
  ];

  const getHeatmapColor = (val: number) => {
    switch (val) {
      case 4:
        return 'bg-emerald-900 dark:bg-emerald-800'; // Deepest
      case 3:
        return 'bg-emerald-700 dark:bg-emerald-600';
      case 2:
        return 'bg-lime-500 dark:bg-lime-400';
      case 1:
      default:
        return 'bg-lime-100 dark:bg-lime-950/50'; // Lightest
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 pb-20 transition-colors duration-200">
      {/* Top Map Viewport Mode Switcher Bar */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Spatial Map Intelligence Hub</h2>
            <p className="text-xs text-slate-400">Switch between nationwide pesticide diagnosis heatmap and local farm satellite GIS.</p>
          </div>
        </div>

        {/* Navigation Mode Switcher Tabs */}
        <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('india_heatmap')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              viewMode === 'india_heatmap'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>🇮🇳 Full India Map & Pesticide Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('local_gis')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              viewMode === 'local_gis'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>🛰️ Local Farm GIS Monitoring</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xl sticky top-20 z-40">
          <Sparkles className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Conditionally Render India Pesticide Heatmap Viewer OR Local GIS View */}
      {viewMode === 'india_heatmap' ? (
        <IndiaPesticideHeatmapViewer />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Search, Weather, Resource Donut, Weekly Heatmap Grid         */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Rounded Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Type to search field zones, crops, coordinates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* 2. Weather & Microclimate Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Purwokerto, Central Java, Indonesia</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                26°C
              </div>
              <div className="text-right space-y-0.5">
                <div className="flex items-center justify-end gap-1 text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Sunny Day</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">8.45 AM | Jan 26</p>
              </div>
            </div>

            {/* Divided 3-Column Weather Metrics Strip */}
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  <span>Humidity</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">35%</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <CloudRain className="w-3 h-3 text-cyan-500" />
                  <span>Rain Forecast</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">26°C</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <Wind className="w-3 h-3 text-emerald-500" />
                  <span>Wind</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">8m/s</p>
              </div>
            </div>
          </div>

          {/* 3. Resource Monitoring Donut Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Resource Monitoring
              </h3>
            </div>

            {/* Week / Month / Year Filter Tabs */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setResourcePeriod('week')}
                className={`py-1.5 rounded-xl transition ${
                  resourcePeriod === 'week' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : ''
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setResourcePeriod('month')}
                className={`py-1.5 rounded-xl transition ${
                  resourcePeriod === 'month' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : ''
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setResourcePeriod('year')}
                className={`py-1.5 rounded-xl transition ${
                  resourcePeriod === 'year' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : ''
                }`}
              >
                Year
              </button>
            </div>

            {/* Donut Chart & Legend Breakdown */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-800 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Irrigation Systems (30%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Crop Nutrition (23%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-400 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Equipment Maintenance (17%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Pest Control (17%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Logistics & Distribution (13%)</span>
                </div>
              </div>

              {/* High-Tech Vector Donut Chart */}
              <div className="w-28 h-28 relative flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Segment 1: 30% (Emerald 800) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#064e3b"
                    strokeWidth="20"
                    strokeDasharray="71.6 167"
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: 23% (Emerald 500) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="20"
                    strokeDasharray="54.9 183.7"
                    strokeDashoffset="-71.6"
                  />
                  {/* Segment 3: 17% (Lime 400) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#a3e635"
                    strokeWidth="20"
                    strokeDasharray="40.6 198"
                    strokeDashoffset="-126.5"
                  />
                  {/* Segment 4: 17% (Amber 500) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="20"
                    strokeDasharray="40.6 198"
                    strokeDashoffset="-167.1"
                  />
                  {/* Segment 5: 13% (Rose 500) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="20"
                    strokeDasharray="31 207.6"
                    strokeDashoffset="-207.7"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-slate-500">100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Weekly Performance Heatmap Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Weekly Performance
              </h3>
              <button
                type="button"
                onClick={() => navigate('/analysis')}
                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Heatmap Matrix */}
            <div className="space-y-2">
              {/* Day Headers */}
              <div className="grid grid-cols-8 gap-1.5 text-[10px] text-slate-400 font-mono text-center">
                <span />
                {days.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Rows (Hours vs Days) */}
              {hours.map((hr, rIdx) => (
                <div key={hr} className="grid grid-cols-8 gap-1.5 items-center">
                  <span className="text-[9px] text-slate-400 font-mono text-right pr-1">{hr}</span>
                  {heatmapData[rIdx].map((val, cIdx) => (
                    <div
                      key={cIdx}
                      className={`h-5 rounded-md ${getHeatmapColor(val)} transition-all hover:scale-110 cursor-pointer shadow-xs`}
                      title={`${days[cIdx]} ${hr} — Intensity Level ${val}/4`}
                    />
                  ))}
                </div>
              ))}

              {/* Heatmap Legend */}
              <div className="flex items-center justify-end gap-1.5 pt-2 text-[10px] text-slate-400 font-mono">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-lime-100 dark:bg-lime-950/50" />
                <span className="w-2.5 h-2.5 rounded-xs bg-lime-500" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-700" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-900" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Field Monitoring Table + Satellite Aerial Map Viewport       */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Field Monitoring Overview Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Field Monitoring Overview
              </h3>

              <div className="flex items-center gap-2 text-xs font-bold">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>June 2026</span>
                </div>

                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>

                <button
                  type="button"
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 font-semibold text-[11px]">
                    <th className="pb-2 pl-1 w-8">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    </th>
                    <th className="pb-2">Field Zone</th>
                    <th className="pb-2">Crop Type</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Soil Moisture</th>
                    <th className="pb-2">Temp.</th>
                    <th className="pb-2">Growth Stage</th>
                    <th className="pb-2 pr-1 w-6" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {fieldZones.map((zone) => {
                    const isSelected = selectedFieldId === zone.id;
                    return (
                      <tr
                        key={zone.id}
                        onClick={() => setSelectedFieldId(zone.id)}
                        className={`cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-950 dark:text-emerald-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <td className="py-3 pl-1">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                          )}
                        </td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{zone.name}</td>
                        <td className="py-3">{zone.crop}</td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                              zone.status === 'Healthy'
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                                : zone.status === 'Stable'
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {zone.status}
                          </span>
                        </td>
                        <td className="py-3 font-mono">{zone.soilMoisture}</td>
                        <td className="py-3 font-mono">{zone.temperature}</td>
                        <td className="py-3">{zone.growthStage}</td>
                        <td className="py-3 pr-1 text-slate-400">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Precision Drone / Satellite Aerial Crop Field Map */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-950 h-[520px] sm:h-[580px] group">
            {/* Aerial Background Canopy Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=85')`,
                transform: `scale(${mapZoom / 100})`,
              }}
            />

            {/* High-Tech Grid & Thermal Disease Gradient Overlay on Crop Canopy */}
            <div className="absolute inset-0 bg-emerald-950/20 backdrop-brightness-95 pointer-events-none" />

            {/* Dotted Polygonal Perimeter Boundary matching screenshot */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600">
              {/* Active Zone Polygon */}
              <polygon
                points="360,180 620,160 670,280 500,490 410,480 340,320"
                fill="url(#thermalGradient)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className="transition-all duration-300"
              />

              <defs>
                <radialGradient id="thermalGradient" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#ea580c" stopOpacity="0.5" />
                  <stop offset="85%" stopColor="#047857" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#065f46" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>

            {/* Top Left Risk Forecast Layer Switcher */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl shadow-2xl z-20">
              <button
                type="button"
                onClick={() => setRiskLayerMode('current_risk')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  riskLayerMode === 'current_risk'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Current Risk
              </button>
              <button
                type="button"
                onClick={() => setRiskLayerMode('forecast_risk')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  riskLayerMode === 'forecast_risk'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                7-Day Forecast Risk
              </button>
            </div>

            {/* Field Center Label Pin with Dynamic Risk Assessment */}
            <div className="absolute top-[52%] left-[48%] -translate-x-1/2 -translate-y-1/2 text-center text-white pointer-events-none drop-shadow-md space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-lime-300">
                <Leaf className="w-4 h-4 fill-current" />
              </div>
              <h4 className="font-extrabold text-sm sm:text-base tracking-tight drop-shadow-lg">
                {currentField.name}
              </h4>
              <p className="text-xs text-emerald-200 font-medium drop-shadow-md">{currentField.crop}</p>
              
              {/* Dynamic Risk Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-white/20 text-xs font-black font-mono shadow-lg backdrop-blur-md">
                <span className={`w-2 h-2 rounded-full ${
                  (riskLayerMode === 'current_risk' ? currentField.currentRiskTier : currentField.forecastRiskTier) === 'CRITICAL'
                    ? 'bg-rose-500 animate-ping'
                    : (riskLayerMode === 'current_risk' ? currentField.currentRiskTier : currentField.forecastRiskTier) === 'HIGH'
                    ? 'bg-orange-500'
                    : 'bg-emerald-400'
                }`} />
                <span>
                  {riskLayerMode === 'current_risk' ? 'Current' : '7D Forecast'}:{' '}
                  <strong className={
                    (riskLayerMode === 'current_risk' ? currentField.currentRiskTier : currentField.forecastRiskTier) === 'CRITICAL'
                      ? 'text-rose-400'
                      : (riskLayerMode === 'current_risk' ? currentField.currentRiskTier : currentField.forecastRiskTier) === 'HIGH'
                      ? 'text-orange-400'
                      : 'text-emerald-400'
                  }>
                    {riskLayerMode === 'current_risk' ? currentField.currentRiskTier : currentField.forecastRiskTier} (
                    {riskLayerMode === 'current_risk' ? currentField.currentRiskScore : currentField.forecastRiskScore}/100)
                  </strong>
                </span>
              </div>
            </div>

            {/* Top Right Actions Bar: [ Export ] + [ ⋮ ] */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs transition flex items-center gap-1.5 shadow-xl active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHudOpen(!isHudOpen)}
                className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 shadow-xl transition"
                title="Toggle HUD details"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom-Left Mini-Map Thumbnail Preview */}
            <div className="absolute bottom-4 left-4 w-24 h-20 sm:w-28 sm:h-24 rounded-2xl overflow-hidden border-2 border-white/90 shadow-2xl bg-slate-950 z-20">
              <img
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=300&q=80"
                alt="Mini Map"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border border-emerald-400/80 bg-emerald-500/10 pointer-events-none" />
            </div>

            {/* Bottom-Right Navigation & Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
              <button
                type="button"
                onClick={() => navigate('/farms')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md shadow-xl transition"
                title="Full Screen GIS Viewer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <div className="flex flex-col rounded-xl bg-slate-900/80 border border-white/20 backdrop-blur-md overflow-hidden shadow-xl">
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.min(z + 15, 160))}
                  className="p-2 text-white hover:bg-white/20 transition"
                  title="Zoom In"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="h-px bg-white/20" />
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.max(z - 15, 70))}
                  className="p-2 text-white hover:bg-white/20 transition"
                  title="Zoom Out"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMapZoom(100)}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md shadow-xl transition"
                title="Reset Center Compass"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>

            {/* ===================================================================== */}
            {/* FLOATING INTERACTIVE FIELD DIAGNOSTIC HUD CARD (Matching Screenshot)   */}
            {/* ===================================================================== */}
            {isHudOpen && (
              <div className="absolute top-16 right-4 sm:top-18 sm:right-6 w-80 sm:w-88 rounded-3xl bg-slate-950/90 border border-white/15 text-white shadow-2xl p-5 space-y-4 backdrop-blur-xl z-20 animate-in fade-in slide-in-from-right-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{currentField.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{currentField.crop} Plantation</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsHudOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Circular Dotted Segment Radial Health Gauge */}
                <div className="flex flex-col items-center justify-center py-2 relative">
                  <div className="w-40 h-28 relative flex items-center justify-center">
                    <svg viewBox="0 0 100 60" className="w-full h-full">
                      {/* Background Dotted Arc */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="transparent"
                        stroke="#334155"
                        strokeWidth="8"
                        strokeDasharray="2 3"
                        strokeLinecap="round"
                      />
                      {/* Foreground Green Dotted Arc (70%) */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="transparent"
                        stroke="#22c55e"
                        strokeWidth="8"
                        strokeDasharray="2 3"
                        strokeDashoffset="38"
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {currentField.healthScore}%
                      </span>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                        Health Score
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3-Column Key Agronomic Metrics */}
                <div className="grid grid-cols-3 divide-x divide-white/10 text-center py-2 border-y border-white/10 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-black text-white">{currentField.humidity}</span>
                    <p className="text-[10px] text-slate-400">Humidity</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-black text-white">{currentField.phLevel}</span>
                    <p className="text-[10px] text-slate-400">pH Level</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-black text-white">{currentField.areaHectares}</span>
                    <p className="text-[10px] text-slate-400">Hectare</p>
                  </div>
                </div>

                {/* Operations & Efficiency List */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Water Consumption</span>
                    <span className="font-bold text-white font-mono">{currentField.waterConsumption}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Fertilizer Efficiency</span>
                    <span className="font-bold text-white font-mono">{currentField.fertilizerEfficiency}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Equipment Status</span>
                    <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{currentField.equipmentStatus}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
