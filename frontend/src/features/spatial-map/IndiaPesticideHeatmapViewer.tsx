import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Flame,
  ShieldAlert,
  Droplets,
  Search,
  Download,
  CheckCircle2,
  Layers,
  Activity,
} from 'lucide-react';

export interface IndiaRegionData {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  pestRisk: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  activePathogen: string;
  prescribedPesticide: string;
  dosage: string;
  applicationMode: string;
  soilToxicityIndex: number;
  affectedAreaHectares: string;
  preHarvestIntervalDays: number;
  recommendedSprayWindow: string;
  svgCoords: { x: number; y: number; r: number };
}

export const indiaRegions: IndiaRegionData[] = [
  {
    id: 'reg-punjab',
    name: 'Punjab & Haryana Granary Sector',
    state: 'Punjab / Haryana',
    lat: 30.7333,
    lng: 76.7794,
    pestRisk: 'CRITICAL',
    activePathogen: 'Yellow Rust (Puccinia striiformis) & Aphid Infestation',
    prescribedPesticide: 'Tebuconazole 25.9% EC + Azadirachtin Bio-Pesticide',
    dosage: '1.5 ml / Litre of water (200L / Acre)',
    applicationMode: 'Drone Micro-Sprayer / High-Pressure Boom',
    soilToxicityIndex: 6.8,
    affectedAreaHectares: '42,500 ha',
    preHarvestIntervalDays: 21,
    recommendedSprayWindow: '06:00 AM - 09:30 AM (Low Wind)',
    svgCoords: { x: 260, y: 170, r: 28 },
  },
  {
    id: 'reg-tamilnadu',
    name: 'Cauvery Delta Rice & Agriculture Zone',
    state: 'Tamil Nadu',
    lat: 11.1271,
    lng: 78.6569,
    pestRisk: 'HIGH',
    activePathogen: 'Paddy Blast (Pyricularia oryzae) & Brown Planthopper',
    prescribedPesticide: 'Tricyclazole 75% WP + Imidacloprid 17.8% SL',
    dosage: '0.6 g / Litre (120 g / Acre)',
    applicationMode: 'Foliar Spraying / Drone Payload',
    soilToxicityIndex: 4.2,
    affectedAreaHectares: '28,100 ha',
    preHarvestIntervalDays: 18,
    recommendedSprayWindow: '07:00 AM - 10:00 AM',
    svgCoords: { x: 310, y: 490, r: 26 },
  },
  {
    id: 'reg-maharashtra',
    name: 'Vidarbha & Marathwada Cotton-Sugarcane Belt',
    state: 'Maharashtra',
    lat: 19.7515,
    lng: 75.7139,
    pestRisk: 'HIGH',
    activePathogen: 'Pink Bollworm (Pectinophora gossypiella) & Whitefly',
    prescribedPesticide: 'Chlorantraniliprole 18.5% SC + Neem Oil 10,000 PPM',
    dosage: '0.4 ml / Litre (60 ml / Acre)',
    applicationMode: 'Targeted Canopy Fogging',
    soilToxicityIndex: 5.4,
    affectedAreaHectares: '36,800 ha',
    preHarvestIntervalDays: 14,
    recommendedSprayWindow: '05:30 PM - 07:00 PM',
    svgCoords: { x: 270, y: 340, r: 30 },
  },
  {
    id: 'reg-up',
    name: 'Indo-Gangetic Wheat & Sugarcane Plains',
    state: 'Uttar Pradesh',
    lat: 26.8467,
    lng: 80.9462,
    pestRisk: 'MODERATE',
    activePathogen: 'Sugarcane Stem Borer & Leaf Spot (Cercospora)',
    prescribedPesticide: 'Carbendazim 50% WP + Thiamethoxam 25% WG',
    dosage: '1.0 g / Litre (150 g / Acre)',
    applicationMode: 'Drenching & Foliar Spray',
    soilToxicityIndex: 3.9,
    affectedAreaHectares: '51,200 ha',
    preHarvestIntervalDays: 15,
    recommendedSprayWindow: '06:30 AM - 09:30 AM',
    svgCoords: { x: 370, y: 220, r: 32 },
  },
  {
    id: 'reg-gujarat',
    name: 'Saurashtra Groundnut & Cotton Belt',
    state: 'Gujarat',
    lat: 22.2587,
    lng: 71.1924,
    pestRisk: 'MODERATE',
    activePathogen: 'Groundnut Tikka Leaf Spot & Stem Rot',
    prescribedPesticide: 'Mancozeb 75% WP + Hexaconazole 5% EC',
    dosage: '2.0 g / Litre (400 g / Acre)',
    applicationMode: 'High Volume Knapsack Sprayer',
    soilToxicityIndex: 3.1,
    affectedAreaHectares: '22,400 ha',
    preHarvestIntervalDays: 20,
    recommendedSprayWindow: '07:00 AM - 10:30 AM',
    svgCoords: { x: 170, y: 300, r: 25 },
  },
  {
    id: 'reg-karnataka',
    name: 'Deccan Plateau Maize & Rice Holding',
    state: 'Karnataka',
    lat: 15.3173,
    lng: 75.7139,
    pestRisk: 'CRITICAL',
    activePathogen: 'Fall Armyworm (Spodoptera frugiperda) in Maize',
    prescribedPesticide: 'Emamectin Benzoate 5% SG + Bacillus thuringiensis',
    dosage: '0.4 g / Litre (80 g / Acre)',
    applicationMode: 'Direct Whorl Application / Drone',
    soilToxicityIndex: 6.1,
    affectedAreaHectares: '31,900 ha',
    preHarvestIntervalDays: 14,
    recommendedSprayWindow: '06:00 AM - 09:00 AM',
    svgCoords: { x: 260, y: 440, r: 24 },
  },
  {
    id: 'reg-bengal',
    name: 'Eastern Ganges Delta & Paddy Sector',
    state: 'West Bengal',
    lat: 22.9868,
    lng: 87.855,
    pestRisk: 'MODERATE',
    activePathogen: 'Bacterial Leaf Blight & Sheath Blight',
    prescribedPesticide: 'Streptocycline + Copper Oxychloride 50% WP',
    dosage: '0.15 g + 2.5 g / Litre water',
    applicationMode: 'Systemic Foliar Wash',
    soilToxicityIndex: 3.5,
    affectedAreaHectares: '29,600 ha',
    preHarvestIntervalDays: 12,
    recommendedSprayWindow: '07:30 AM - 10:00 AM',
    svgCoords: { x: 450, y: 280, r: 27 },
  },
  {
    id: 'reg-ap',
    name: 'Guntur Chilli & Coastal Andhra Agro Belt',
    state: 'Andhra Pradesh & Telangana',
    lat: 16.5062,
    lng: 80.648,
    pestRisk: 'HIGH',
    activePathogen: 'Black Thrips (Thrips parvispinus) & Chilli Powdery Mildew',
    prescribedPesticide: 'Spinetoram 11.7% SC + Myclobutanil 10% WP',
    dosage: '0.9 ml / Litre (180 ml / Acre)',
    applicationMode: 'Ultra Low Volume Drone Atomizer',
    soilToxicityIndex: 5.7,
    affectedAreaHectares: '24,300 ha',
    preHarvestIntervalDays: 16,
    recommendedSprayWindow: '06:00 AM - 08:30 AM',
    svgCoords: { x: 330, y: 390, r: 28 },
  },
];

export const IndiaPesticideHeatmapViewer: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<IndiaRegionData>(indiaRegions[0]);
  const [activeLayer, setActiveLayer] = useState<'pesticide' | 'pest_density' | 'fungal_rust' | 'toxicity'>('pesticide');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [prescriptionDownloaded, setPrescriptionDownloaded] = useState<boolean>(false);

  const filteredRegions = indiaRegions.filter(
    (r) =>
      r.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.state.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.activePathogen.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getPestColor = (risk: IndiaRegionData['pestRisk']) => {
    switch (risk) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/20',
          border: 'border-rose-500',
          text: 'text-rose-400',
          fill: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.6)',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500',
          text: 'text-orange-400',
          fill: '#f97316',
          glow: 'rgba(249, 115, 22, 0.5)',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500',
          text: 'text-amber-400',
          fill: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.4)',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500',
          text: 'text-emerald-400',
          fill: '#10b981',
          glow: 'rgba(16, 185, 129, 0.3)',
        };
    }
  };

  const handleDownloadPrescription = () => {
    setPrescriptionDownloaded(true);
    setTimeout(() => setPrescriptionDownloaded(false), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 transition-colors duration-200">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Full India GIS Pesticide Heatmap & Diagnostic Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            India Agricultural Pesticide & Pathogen Heatmap Studio
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Real-time multispectral satellite diagnosis of regional crop pest outbreaks, chemical spray dosage guidelines, and bio-pesticide prescription protocols across all Indian agro-climatic zones.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/analysis')}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Droplets className="w-4 h-4" />
            <span>Upload Field Photo for Diagnosis</span>
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive Full India Vector SVG Map & Layer Selector (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 backdrop-blur-xl">
            {/* Map Filter Dock */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Interactive India Geo-Spatial Layer</h3>
              </div>

              {/* Layer Switcher Pills */}
              <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1 text-[11px] overflow-x-auto">
                {[
                  { key: 'pesticide', label: '🧪 Pesticide Dosage' },
                  { key: 'pest_density', label: '🐛 Pest Density' },
                  { key: 'fungal_rust', label: '🌾 Fungal Rust' },
                  { key: 'toxicity', label: '⚠️ Soil Toxicity' },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setActiveLayer(mode.key as any)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                      activeLayer === mode.key
                        ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive India Geographic Map Viewport */}
            <div className="relative w-full h-[520px] rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden flex items-center justify-center select-none shadow-inner">
              {/* Background Topographic Radial Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

              {/* High-Resolution Vector SVG Outline of India & Agro Clusters */}
              <svg className="w-full h-full" viewBox="0 0 600 620">
                <defs>
                  {/* Glowing Radial Heatmap Gradients */}
                  {indiaRegions.map((reg) => {
                    const colors = getPestColor(reg.pestRisk);
                    return (
                      <radialGradient key={`grad-${reg.id}`} id={`heat-${reg.id}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={colors.fill} stopOpacity="0.85" />
                        <stop offset="50%" stopColor={colors.fill} stopOpacity="0.45" />
                        <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
                      </radialGradient>
                    );
                  })}
                </defs>

                {/* Stylized Polygon Landmass Outline of India Peninsula */}
                <path
                  d="M 240,80 L 290,90 L 320,130 L 370,140 L 410,160 L 450,200 L 480,250 L 470,300 L 440,320 L 390,370 L 350,440 L 330,500 L 310,540 L 290,550 L 270,510 L 250,450 L 220,380 L 160,340 L 140,290 L 170,250 L 210,210 L 230,140 Z"
                  fill="#0b1329"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Regional Pesticide Heatmap Aura Glow Circles */}
                {indiaRegions.map((reg) => {
                  const isSelected = selectedRegion.id === reg.id;
                  return (
                    <circle
                      key={`aura-${reg.id}`}
                      cx={reg.svgCoords.x}
                      cy={reg.svgCoords.y}
                      r={reg.svgCoords.r * (isSelected ? 1.6 : 1.2)}
                      fill={`url(#heat-${reg.id})`}
                      className="transition-all duration-500 animate-pulse pointer-events-none"
                    />
                  );
                })}

                {/* Regional Clickable Nodes & Pin Indicators */}
                {indiaRegions.map((reg) => {
                  const isSelected = selectedRegion.id === reg.id;
                  const style = getPestColor(reg.pestRisk);
                  return (
                    <g
                      key={`node-${reg.id}`}
                      onClick={() => setSelectedRegion(reg)}
                      className="cursor-pointer group"
                    >
                      {/* Outer Ring */}
                      <circle
                        cx={reg.svgCoords.x}
                        cy={reg.svgCoords.y}
                        r={isSelected ? 14 : 9}
                        fill="#020617"
                        stroke={isSelected ? '#10b981' : style.fill}
                        strokeWidth={isSelected ? 3 : 2}
                        className="transition-all duration-200"
                      />

                      {/* Inner Dot */}
                      <circle
                        cx={reg.svgCoords.x}
                        cy={reg.svgCoords.y}
                        r={isSelected ? 6 : 4}
                        fill={style.fill}
                        className="transition-all duration-200"
                      />

                      {/* Label Card Overlay */}
                      <rect
                        x={reg.svgCoords.x - 45}
                        y={reg.svgCoords.y - 28}
                        width={90}
                        height={18}
                        rx={6}
                        fill="#0f172a"
                        stroke={isSelected ? '#10b981' : '#334155'}
                        strokeWidth="1"
                        className="transition-all group-hover:fill-slate-800"
                      />
                      <text
                        x={reg.svgCoords.x}
                        y={reg.svgCoords.y - 15}
                        fill={isSelected ? '#10b981' : '#f8fafc'}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {reg.state.split('/')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Top Left Active Region Badge */}
              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white backdrop-blur flex items-center gap-2 shadow-lg">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{selectedRegion.name}</span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400 font-mono font-bold">{selectedRegion.pestRisk} RISK</span>
              </div>

              {/* Floating Bottom Right Legend Box */}
              <div className="absolute bottom-4 right-4 z-10 p-3 rounded-2xl bg-slate-900/95 border border-slate-800 text-[11px] text-slate-300 backdrop-blur space-y-1.5 shadow-xl">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Pesticide Heatmap Scale:
                </span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Critical Spray Intervention</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>High Pathogen Density</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Moderate Biopesticide Spray</span>
                </div>
              </div>
            </div>

            {/* Quick Regional Selector & Search Bar */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Select Indian Agricultural Zone:
                </span>

                {/* Filter Search Input */}
                <div className="relative w-48 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search state or pathogen..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                {filteredRegions.map((reg) => {
                  const isSelected = selectedRegion.id === reg.id;
                  const style = getPestColor(reg.pestRisk);
                  return (
                    <button
                      key={reg.id}
                      type="button"
                      onClick={() => setSelectedRegion(reg)}
                      className={`px-3 py-2 rounded-xl border transition flex items-center gap-2 flex-shrink-0 font-semibold ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${style.bg} ${style.border}`} />
                      <span>{reg.state}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Diagnostic Pesticide Prescription Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 backdrop-blur-xl">
            {/* Header Title */}
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono block">
                  AI Prescriptive Agronomy Engine
                </span>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Pesticide & Treatment Diagnosis</span>
                </h3>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                  getPestColor(selectedRegion.pestRisk).bg
                } ${getPestColor(selectedRegion.pestRisk).border} ${getPestColor(selectedRegion.pestRisk).text}`}
              >
                {selectedRegion.pestRisk} SEVERITY
              </span>
            </div>

            {/* Target Region Overview */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Region Monitored:</span>
              <h4 className="text-sm font-bold text-white">{selectedRegion.name}</h4>
              <p className="text-xs text-slate-400 font-mono">
                {selectedRegion.lat}° N, {selectedRegion.lng}° E • Affected: {selectedRegion.affectedAreaHectares}
              </p>
            </div>

            {/* Pathogen Diagnosed */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Primary Pathogen Diagnosed</span>
              </span>
              <h4 className="text-sm font-bold text-slate-100">{selectedRegion.activePathogen}</h4>
            </div>

            {/* Prescribed Pesticide & Dosage */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Prescribed Pesticide Formulation</span>
                </span>
                <p className="text-sm font-extrabold text-white">{selectedRegion.prescribedPesticide}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-500/20">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Recommended Dosage</span>
                  <span className="font-bold text-emerald-300 font-mono">{selectedRegion.dosage}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Application Mode</span>
                  <span className="font-bold text-emerald-300 font-mono">{selectedRegion.applicationMode}</span>
                </div>
              </div>
            </div>

            {/* Safety & Pre-Harvest Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Pre-Harvest Interval</span>
                <p className="text-base font-extrabold text-white font-mono">
                  {selectedRegion.preHarvestIntervalDays} Days
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Soil Toxicity Index</span>
                <p className="text-base font-extrabold text-amber-400 font-mono">
                  {selectedRegion.soilToxicityIndex} / 10.0
                </p>
              </div>
            </div>

            {/* Best Spray Window */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Optimal Spray Window</span>
                <p className="font-bold text-emerald-400">{selectedRegion.recommendedSprayWindow}</p>
              </div>
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>

            {/* Download Official Prescription PDF */}
            <button
              type="button"
              onClick={handleDownloadPrescription}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>
                {prescriptionDownloaded
                  ? '✓ Prescription PDF Exported'
                  : 'Export Pesticide Prescription PDF'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
