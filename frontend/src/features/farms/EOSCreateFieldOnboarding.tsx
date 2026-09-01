import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  Search,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Undo2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Navigation,
  Sprout,
  ArrowRight,
  Flame,
  MousePointerClick,
  Square,
  Pentagon,
  Globe,
} from 'lucide-react';

export interface DrawnVertex {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

export const EOSCreateFieldOnboarding: React.FC = () => {
  const navigate = useNavigate();

  // Field Drawing Mode: 'polygon' | 'rectangle' | 'upload'
  const [drawingTool, setDrawingTool] = useState<'polygon' | 'rectangle' | 'upload'>('polygon');
  const [satelliteLayer, setSatelliteLayer] = useState<'true_color' | 'ndvi' | 'ndre' | 'ndwi' | 'thermal'>('true_color');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Drawn Boundary Vertices
  const [vertices, setVertices] = useState<DrawnVertex[]>([
    { x: 32, y: 28 },
    { x: 64, y: 24 },
    { x: 70, y: 68 },
    { x: 38, y: 72 },
  ]);

  // Search location
  const [searchQuery, setSearchQuery] = useState<string>('Nashik, Maharashtra, India');

  // Form Metadata
  const [fieldName, setFieldName] = useState<string>('Sector Alpha — Green Oasis');
  const [farmGroup, setFarmGroup] = useState<string>('Nashik BioFarm Cluster');
  const [cropType, setCropType] = useState<string>('Bt Cotton (Bollgard II)');
  const [cropVariety, setCropVariety] = useState<string>('RCH-659 BG II');
  const [sowingDate, setSowingDate] = useState<string>('2026-06-15');
  const [harvestDate, setHarvestDate] = useState<string>('2026-11-20');
  const [soilType, setSoilType] = useState<string>('Black Cotton Regur Clay');
  const [irrigationType, setIrrigationType] = useState<string>('Drip Irrigation with Fertigation');
  const [previousCrop, setPreviousCrop] = useState<string>('Soybean (JS-335)');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute field area (Hectares and Acres) & perimeter from vertices
  const { areaHa, areaAcres, perimeterMeters } = useMemo(() => {
    if (vertices.length < 3) {
      return { areaHa: 0, areaAcres: 0, perimeterMeters: 0 };
    }

    // Shoelace formula on normalized coordinates scaled to representative ~1km field box
    let shoelace = 0;
    let perimeter = 0;
    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      shoelace += vertices[i].x * vertices[next].y - vertices[next].x * vertices[i].y;

      const dx = (vertices[next].x - vertices[i].x) * 12.5; // ~12.5m per percentage
      const dy = (vertices[next].y - vertices[i].y) * 12.5;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    const rawAreaSqMeters = Math.abs(shoelace / 2) * 12.5 * 12.5;
    const ha = +(rawAreaSqMeters / 10000).toFixed(2);
    const acres = +(ha * 2.47105).toFixed(2);
    const periM = Math.round(perimeter);

    return { areaHa: Math.max(ha, 1.2), areaAcres: Math.max(acres, 2.96), perimeterMeters: Math.max(periM, 420) };
  }, [vertices]);

  // Click on satellite canvas to add vertices
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drawingTool === 'upload') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    if (drawingTool === 'rectangle') {
      const w = 24;
      const h = 20;
      setVertices([
        { x: clickX - w / 2, y: clickY - h / 2 },
        { x: clickX + w / 2, y: clickY - h / 2 },
        { x: clickX + w / 2, y: clickY + h / 2 },
        { x: clickX - w / 2, y: clickY + h / 2 },
      ]);
    } else {
      setVertices((prev) => [...prev, { x: +clickX.toFixed(1), y: +clickY.toFixed(1) }]);
    }
  };

  const handleUndoVertex = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVertices((prev) => (prev.length > 0 ? prev.slice(0, -1) : []));
  };

  const handleClearBoundary = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVertices([]);
  };

  const handleSaveField = () => {
    if (vertices.length < 3) {
      alert('Please place at least 3 corner points on the satellite map to define your field boundary.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSuccessToast(`Field "${fieldName}" successfully created and linked to Sentinel-2 satellite pipeline!`);
      setTimeout(() => {
        navigate('/field-map');
      }, 1500);
    }, 1200);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Convert vertices to SVG polygon points string
  const svgPoints = vertices.map((v) => `${v.x * 10},${v.y * 6}`).join(' ');

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 pb-20 animate-in fade-in duration-200">
      {/* ── Top EOS Header Ribbon ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-950 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-extrabold uppercase tracking-wider">
              🛰️ EOSDA Sentinel-2 Satellite Engine
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">
              Sub-Meter GIS Drawing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Pentagon className="w-7 h-7 text-emerald-400" />
            <span>Create & Draw Field Boundary (शेताची सीमा आखा)</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-3xl">
            Pinpoint and draw your agricultural field boundaries directly onto Sentinel-2 satellite imagery to unlock continuous NDVI vegetation index monitoring, soil moisture tracking, and AI disease early warnings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/field-map')}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2 text-xs font-bold active:scale-95 whitespace-nowrap self-start md:self-auto"
        >
          <Navigation className="w-4 h-4" />
          <span>Exit to Map View</span>
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-black flex items-center gap-2 shadow-2xl sticky top-20 z-50 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── Main Split Workspace (Left Satellite GIS Canvas + Right Agronomic Metadata Drawer) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT 8 COLS: Full Interactive Satellite Drawing Canvas                    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Search & Drawing Tools Toolbar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Location on Satellite */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search district, village or GPS coordinates..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Geometry Drawing Mode Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setDrawingTool('polygon')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  drawingTool === 'polygon'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Click point-by-point to draw custom polygon boundary"
              >
                <Pentagon className="w-3.5 h-3.5" />
                <span>Draw Polygon</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawingTool('rectangle')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  drawingTool === 'rectangle'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Click to drop rectangular boundary box"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Rectangle</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawingTool('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  drawingTool === 'upload'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Import Shapefile, KML, or GeoJSON"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Import File</span>
              </button>
            </div>
          </div>

          {/* ── Interactive Satellite GIS Canvas Box ── */}
          <div
            ref={containerRef}
            onClick={handleMapClick}
            className="relative w-full h-[580px] sm:h-[660px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-2xl group cursor-crosshair select-none"
          >
            {/* Satellite Background Texture */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=90')`,
                transform: `scale(${zoomLevel / 100})`,
              }}
            />

            {/* Multispectral False-Color Overlays */}
            {satelliteLayer === 'ndvi' && (
              <div
                className="absolute inset-0 mix-blend-color-dodge transition-opacity duration-300 pointer-events-none opacity-80"
                style={{
                  background:
                    'radial-gradient(ellipse at 45% 45%, rgba(16, 185, 129, 0.9), transparent 50%), radial-gradient(ellipse at 75% 30%, rgba(52, 211, 153, 0.8), transparent 45%)',
                }}
              />
            )}

            {satelliteLayer === 'ndre' && (
              <div
                className="absolute inset-0 mix-blend-screen transition-opacity duration-300 pointer-events-none opacity-75"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.8), transparent 45%), radial-gradient(circle at 30% 70%, rgba(16, 185, 129, 0.7), transparent 40%)',
                }}
              />
            )}

            {satelliteLayer === 'ndwi' && (
              <div
                className="absolute inset-0 mix-blend-overlay transition-opacity duration-300 pointer-events-none opacity-85"
                style={{
                  background:
                    'radial-gradient(circle at 60% 40%, rgba(56, 189, 248, 0.9), transparent 50%), radial-gradient(circle at 40% 70%, rgba(2, 132, 199, 0.8), transparent 45%)',
                }}
              />
            )}

            {satelliteLayer === 'thermal' && (
              <div
                className="absolute inset-0 mix-blend-screen transition-opacity duration-300 pointer-events-none opacity-75"
                style={{
                  background:
                    'radial-gradient(circle at 65% 55%, rgba(244, 63, 94, 0.85), transparent 40%), radial-gradient(circle at 35% 35%, rgba(59, 130, 246, 0.7), transparent 45%)',
                }}
              />
            )}

            {/* High-Precision Orthophoto Coordinate Grid Overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)`,
                backgroundSize: '36px 36px',
              }}
            />

            {/* SVG Polygon Canvas for Drawn Field Vertices */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 600"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="eos-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Polygon Perimeter Filled Area */}
              {vertices.length >= 3 && (
                <polygon
                  points={svgPoints}
                  fill="rgba(16, 185, 129, 0.28)"
                  stroke="#10b981"
                  strokeWidth="3"
                  filter="url(#eos-glow)"
                />
              )}

              {/* Lines connecting points before 3rd point */}
              {vertices.length < 3 && vertices.length > 1 && (
                <polyline
                  points={svgPoints}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
              )}

              {/* Individual Corner Vertex Pins */}
              {vertices.map((v, idx) => (
                <g key={idx} transform={`translate(${v.x * 10}, ${v.y * 6})`}>
                  <circle r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                  <circle r="16" fill="rgba(16, 185, 129, 0.3)" className="animate-ping" />
                  <text
                    y="-12"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    className="font-mono drop-shadow"
                  >
                    P{idx + 1}
                  </text>
                </g>
              ))}
            </svg>

            {/* Top Left Layer Switcher Pill */}
            <div
              className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1 p-1 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { id: 'true_color', label: '🛰️ True Color', icon: Layers },
                { id: 'ndvi', label: '🌿 NDVI', icon: Sparkles },
                { id: 'ndre', label: '🌾 NDRE', icon: Sprout },
                { id: 'ndwi', label: '💧 NDWI', icon: Globe },
                { id: 'thermal', label: '🌡️ Thermal', icon: Flame },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSatelliteLayer(id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    satelliteLayer === id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Top Right Zoom & Fullscreen Controls */}
            <div
              className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 15, 200))}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 15, 80))}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Drawing Help Overlay / Vertex Controls at Bottom Left */}
            <div
              className="absolute bottom-4 left-4 z-20 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/30 text-white shadow-2xl space-y-2 max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <MousePointerClick className="w-4 h-4" />
                  <span>Click satellite map to add boundary points</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {vertices.length} Points
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleUndoVertex}
                  disabled={vertices.length === 0}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 text-xs font-bold transition flex items-center gap-1"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearBoundary}
                  disabled={vertices.length === 0}
                  className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 disabled:opacity-40 text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Live Area Calculation Floating Pill at Bottom Right */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/30 text-white shadow-2xl font-mono text-xs">
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase">Calculated Area</span>
                <strong className="text-emerald-400 text-sm font-black">
                  {areaHa} ha <span className="text-slate-400 text-xs font-normal">({areaAcres} ac)</span>
                </strong>
              </div>
              <div className="w-px h-7 bg-slate-800" />
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Perimeter</span>
                <strong className="text-sky-300 font-bold">{perimeterMeters} m</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT 4 COLS: EOSDA Agronomic Configuration Drawer (Field Parameters)      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    Field Parameters
                  </h3>
                  <p className="text-[11px] text-slate-500">Agro-climatic specification</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Step 1 of 1
              </span>
            </div>

            {/* Field Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Field Name</label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. North Plot Bt-Cotton"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Farm / Estate Holding */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Farm / Holding</label>
              <input
                type="text"
                value={farmGroup}
                onChange={(e) => setFarmGroup(e.target.value)}
                placeholder="e.g. Nashik Agricultural Estate"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Crop Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Crop</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Bt Cotton (Bollgard II)">Bt Cotton (Bollgard II)</option>
                <option value="Sugarcane (Co-86032)">Sugarcane (Co-86032)</option>
                <option value="Soybean (JS-335)">Soybean (JS-335)</option>
                <option value="Grapes (Thompson Seedless)">Grapes (Thompson Seedless)</option>
                <option value="Tomato (Abhinav)">Tomato (Abhinav)</option>
                <option value="Pomegranate (Bhagwa)">Pomegranate (Bhagwa)</option>
                <option value="Red Onion (Nashik Special)">Red Onion (Nashik Special)</option>
                <option value="Wheat (PBW-550)">Wheat (PBW-550)</option>
                <option value="Rice (Basmati PB-1121)">Rice (Basmati PB-1121)</option>
              </select>
            </div>

            {/* Variety / Hybrid */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Seed Variety / Hybrid</label>
              <input
                type="text"
                value={cropVariety}
                onChange={(e) => setCropVariety(e.target.value)}
                placeholder="e.g. RCH-659 BG II"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Sowing & Harvest Date Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Sowing Date</label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Target Harvest</label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Soil Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Soil Classification</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Black Cotton Regur Clay">Black Cotton Regur Clay</option>
                <option value="Laterite Soil">Laterite Soil</option>
                <option value="River Basin Alluvial Loam">River Basin Alluvial Loam</option>
                <option value="Red Sandy Loam Soil">Red Sandy Loam Soil</option>
                <option value="Light Gravelly Murrum Soil">Light Gravelly Murrum Soil</option>
              </select>
            </div>

            {/* Irrigation Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Irrigation Setup</label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Drip Irrigation with Fertigation">Drip Irrigation with Fertigation</option>
                <option value="Micro-Sprinkler Overhead">Micro-Sprinkler Overhead</option>
                <option value="Furrow Flood Irrigation">Furrow Flood Irrigation</option>
                <option value="Rainfed Natural Precipitation">Rainfed Natural Precipitation</option>
              </select>
            </div>

            {/* Previous Season Crop (Rotation) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Previous Season Crop (Rotation)</label>
              <input
                type="text"
                value={previousCrop}
                onChange={(e) => setPreviousCrop(e.target.value)}
                placeholder="e.g. Soybean (JS-335)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveField}
              disabled={isSaving || vertices.length < 3}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <span>Syncing with Sentinel-2 Satellite...</span>
              ) : (
                <>
                  <span>Save Field & Launch Satellite Monitoring</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
