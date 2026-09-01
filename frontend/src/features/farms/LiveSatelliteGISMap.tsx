import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Plane,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ShieldAlert,
  Flame,
} from 'lucide-react';

export interface FarmPolygonZone {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  ndvi: number;
  cwsi: number; // Crop Water Stress Index
  healthStatus: 'HEALTHY' | 'MODERATE_STRESS' | 'HIGH_RISK' | 'CRITICAL';
  pathogenRisk: string;
  soilMoisture: number;
  canopyTemp: number;
  lat: number;
  lng: number;
  polygonPoints: [number, number][]; // Screen percentage coordinates [x%, y%]
}

const MOCK_ZONES: FarmPolygonZone[] = [
  {
    id: 'zone-1',
    name: 'Sector A1 — North Canopy',
    crop: 'Bt Cotton (Bollgard II)',
    areaHa: 4.8,
    ndvi: 0.86,
    cwsi: 0.22,
    healthStatus: 'HEALTHY',
    pathogenRisk: 'None Detected (0%)',
    soilMoisture: 72,
    canopyTemp: 26.4,
    lat: 19.9975,
    lng: 73.7898,
    polygonPoints: [
      [22, 18],
      [44, 15],
      [48, 38],
      [26, 42],
    ],
  },
  {
    id: 'zone-2',
    name: 'Sector B2 — Central Vineyard',
    crop: 'Grapes (Thompson Seedless)',
    areaHa: 3.2,
    ndvi: 0.79,
    cwsi: 0.35,
    healthStatus: 'HEALTHY',
    pathogenRisk: 'Low Downy Mildew Risk (12%)',
    soilMoisture: 65,
    canopyTemp: 27.8,
    lat: 19.9982,
    lng: 73.7915,
    polygonPoints: [
      [52, 16],
      [78, 20],
      [82, 45],
      [56, 42],
    ],
  },
  {
    id: 'zone-3',
    name: 'Sector C3 — East Basin (Contagion Alert)',
    crop: 'Tomato (Abhinav)',
    areaHa: 2.6,
    ndvi: 0.58,
    cwsi: 0.76,
    healthStatus: 'HIGH_RISK',
    pathogenRisk: 'Early Blight (Alternaria solani, 84%)',
    soilMoisture: 38,
    canopyTemp: 32.1,
    lat: 19.9961,
    lng: 73.7932,
    polygonPoints: [
      [58, 52],
      [86, 50],
      [82, 82],
      [54, 78],
    ],
  },
  {
    id: 'zone-4',
    name: 'Sector D4 — South River Loam',
    crop: 'Sugarcane (Co-86032)',
    areaHa: 6.4,
    ndvi: 0.91,
    cwsi: 0.18,
    healthStatus: 'HEALTHY',
    pathogenRisk: 'Zero Infestation (2%)',
    soilMoisture: 84,
    canopyTemp: 25.2,
    lat: 19.9945,
    lng: 73.7885,
    polygonPoints: [
      [18, 50],
      [48, 48],
      [42, 85],
      [14, 80],
    ],
  },
];

export interface LiveSatelliteGISMapProps {
  initialZoom?: number;
  heightClass?: string;
  onZoneSelect?: (zone: FarmPolygonZone) => void;
  showDroneTracker?: boolean;
}

export const LiveSatelliteGISMap: React.FC<LiveSatelliteGISMapProps> = ({
  initialZoom = 100,
  heightClass = 'h-[580px]',
  onZoneSelect,
  showDroneTracker = true,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(initialZoom);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'ndvi' | 'thermal' | 'topo'>('satellite');
  const [selectedZone, setSelectedZone] = useState<FarmPolygonZone>(MOCK_ZONES[2]); // High risk default
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDrone, setShowDrone] = useState<boolean>(showDroneTracker);
  const [ndviOpacity] = useState<number>(75);
  const [dronePos, setDronePos] = useState<{ x: number; y: number; alt: number; heading: number }>({
    x: 35,
    y: 30,
    alt: 48,
    heading: 45,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Animate drone flight simulator across satellite canopy
  useEffect(() => {
    if (!showDrone) return;
    const interval = setInterval(() => {
      setDronePos((prev) => {
        const nextX = (prev.x + 0.35) % 90;
        const nextY = 25 + Math.sin(nextX * 0.15) * 22;
        const heading = (Math.atan2(Math.sin(nextX * 0.15) * 22 - prev.y, 0.35) * 180) / Math.PI + 90;
        return {
          x: nextX < 10 ? 10 : nextX,
          y: nextY,
          alt: 45 + Math.sin(nextX * 0.1) * 5,
          heading: heading,
        };
      });
    }, 120);

    return () => clearInterval(interval);
  }, [showDrone]);

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

  const handleZoneClick = (zone: FarmPolygonZone) => {
    setSelectedZone(zone);
    onZoneSelect?.(zone);
  };

  // Convert points array to SVG polygon string
  const getPointsString = (points: [number, number][]) => {
    return points.map(([px, py]) => `${px * 10},${py * 6}`).join(' ');
  };

  const getStatusColor = (status: FarmPolygonZone['healthStatus']) => {
    switch (status) {
      case 'HEALTHY':
        return '#10b981';
      case 'MODERATE_STRESS':
        return '#f59e0b';
      case 'HIGH_RISK':
        return '#f43f5e';
      case 'CRITICAL':
        return '#e11d48';
      default:
        return '#10b981';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClass} rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-2xl transition-all duration-300 select-none`}
    >
      {/* ── Layer 1: High-Res Satellite Aerial Base Imagery ── */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=90')`,
          transform: `scale(${zoomLevel / 100})`,
        }}
      />

      {/* ── Layer 2: Multispectral NDVI / Thermal Shader Overlays ── */}
      {mapLayer === 'ndvi' && (
        <div
          className="absolute inset-0 mix-blend-color-dodge transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: ndviOpacity / 100,
            background:
              'radial-gradient(ellipse at 30% 30%, rgba(16, 185, 129, 0.85), transparent 45%), radial-gradient(ellipse at 70% 30%, rgba(52, 211, 153, 0.8), transparent 40%), radial-gradient(ellipse at 70% 70%, rgba(244, 63, 94, 0.85), transparent 45%), radial-gradient(ellipse at 30% 70%, rgba(5, 150, 105, 0.9), transparent 50%)',
          }}
        />
      )}

      {mapLayer === 'thermal' && (
        <div
          className="absolute inset-0 mix-blend-screen transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: 0.7,
            background:
              'radial-gradient(circle at 70% 65%, rgba(239, 68, 68, 0.75), transparent 35%), radial-gradient(circle at 35% 30%, rgba(59, 130, 246, 0.6), transparent 40%), radial-gradient(circle at 30% 70%, rgba(16, 185, 129, 0.5), transparent 40%)',
          }}
        />
      )}

      {mapLayer === 'topo' && (
        <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply pointer-events-none" />
      )}

      {/* ── Layer 3: High-Tech Satellite Scanner Grid Overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Layer 4: Interactive Polygonal Farm Boundaries (SVG Canvas) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {MOCK_ZONES.map((zone) => {
          const isSelected = selectedZone?.id === zone.id;
          const strokeColor = getStatusColor(zone.healthStatus);

          return (
            <g key={zone.id} onClick={() => handleZoneClick(zone)} className="cursor-pointer group">
              {/* Field Polygon Area */}
              <polygon
                points={getPointsString(zone.polygonPoints)}
                fill={
                  zone.healthStatus === 'HIGH_RISK'
                    ? 'rgba(244, 63, 94, 0.28)'
                    : zone.healthStatus === 'MODERATE_STRESS'
                    ? 'rgba(245, 158, 11, 0.22)'
                    : 'rgba(16, 185, 129, 0.22)'
                }
                stroke={strokeColor}
                strokeWidth={isSelected ? 3.5 : 2}
                strokeDasharray={isSelected ? 'none' : '6 4'}
                filter={isSelected ? (zone.healthStatus === 'HIGH_RISK' ? 'url(#glow-rose)' : 'url(#glow-emerald)') : undefined}
                className="transition-all duration-300 group-hover:fill-opacity-50"
              />

              {/* Center Coordinate Pin & Label */}
              {(() => {
                const centerX =
                  zone.polygonPoints.reduce((acc, p) => acc + p[0], 0) / zone.polygonPoints.length;
                const centerY =
                  zone.polygonPoints.reduce((acc, p) => acc + p[1], 0) / zone.polygonPoints.length;

                return (
                  <g transform={`translate(${centerX * 10}, ${centerY * 6})`}>
                    <circle r="7" fill={strokeColor} className="animate-pulse" />
                    <circle r="14" fill={strokeColor} opacity="0.25" />
                    <text
                      y="20"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow-md font-sans"
                    >
                      {zone.name.split('—')[0]}
                    </text>
                    <text
                      y="32"
                      textAnchor="middle"
                      fill="#a7f3d0"
                      fontSize="9"
                      fontWeight="600"
                      className="pointer-events-none drop-shadow-sm font-mono"
                    >
                      NDVI {zone.ndvi.toFixed(2)}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* Live Drone UAV Flight Path & Projected Camera Sensor Beam */}
        {showDrone && (
          <g transform={`translate(${dronePos.x * 10}, ${dronePos.y * 6})`}>
            {/* Projected Sensor FOV Beam onto Crop Canopy */}
            <polygon
              points="-30,-15 30,-15 50,45 -50,45"
              fill="rgba(56, 189, 248, 0.15)"
              stroke="rgba(56, 189, 248, 0.6)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {/* Pulsing Sonar Sweep */}
            <circle r="24" fill="none" stroke="rgba(56, 189, 248, 0.8)" strokeWidth="1.5" className="animate-ping" />
            <circle r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* ── Layer 5: Top Left Satellite Layer Switcher Pill ── */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/85 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl">
        <button
          type="button"
          onClick={() => setMapLayer('satellite')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            mapLayer === 'satellite'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>🛰️ True Satellite</span>
        </button>

        <button
          type="button"
          onClick={() => setMapLayer('ndvi')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            mapLayer === 'ndvi'
              ? 'bg-lime-600 text-white shadow-md shadow-lime-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>🌿 NDVI Health</span>
        </button>

        <button
          type="button"
          onClick={() => setMapLayer('thermal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            mapLayer === 'thermal'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>💧 Thermal CWSI</span>
        </button>
      </div>

      {/* ── Layer 6: Top Right Satellite HUD & Flight Telemetry ── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Drone Live Telemetry Badge */}
        {showDrone && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-sky-500/40 text-sky-300 backdrop-blur-xl text-xs font-mono shadow-xl">
            <Plane className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>UAV-01 ALT: {dronePos.alt.toFixed(0)}m</span>
            <span className="text-slate-500">|</span>
            <span>SPEED: 14.2 m/s</span>
          </div>
        )}

        {/* Live Satellite Sync Status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/85 border border-slate-700 text-slate-300 backdrop-blur-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Sentinel-2 Sync</span>
          <span className="sm:hidden">Live</span>
        </div>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-2xl bg-slate-950/85 hover:bg-slate-800 text-white border border-slate-700 transition backdrop-blur-xl shadow-lg"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Satellite View'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Layer 7: Right Side Zoom & Compass Toolbar ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 p-1.5 bg-slate-950/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl">
        <button
          type="button"
          onClick={() => setZoomLevel((prev) => Math.min(prev + 20, 200))}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((prev) => Math.max(prev - 20, 80))}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel(100)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition text-[10px] font-mono font-bold"
          title="Reset Zoom"
        >
          100%
        </button>
        <div className="w-full h-px bg-slate-800 my-0.5" />
        <button
          type="button"
          onClick={() => setShowDrone((prev) => !prev)}
          className={`p-2 rounded-xl transition ${
            showDrone ? 'text-sky-400 bg-sky-500/20' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Drone Mission Overlay"
        >
          <Plane className="w-4 h-4" />
        </button>
      </div>

      {/* ── Layer 8: Bottom Left Selected Zone Telemetry Card (Glassmorphic) ── */}
      {selectedZone && (
        <div className="absolute bottom-4 left-4 z-20 max-w-[calc(100vw-32px)] sm:max-w-md p-4 rounded-3xl bg-slate-950/90 border border-emerald-500/30 backdrop-blur-2xl text-white shadow-2xl space-y-3 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black border font-mono ${
                    selectedZone.healthStatus === 'HIGH_RISK'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {selectedZone.healthStatus.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedZone.areaHa} Hectares
                </span>
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight mt-1">
                {selectedZone.name}
              </h4>
              <p className="text-xs text-emerald-300 font-medium">{selectedZone.crop}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">NDVI Index</span>
              <span className="text-xl font-black font-mono text-emerald-400">
                {selectedZone.ndvi.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Soil Moisture</span>
              <strong className="text-sky-300 text-xs">{selectedZone.soilMoisture}%</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Canopy Temp</span>
              <strong className="text-amber-300 text-xs">{selectedZone.canopyTemp}°C</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">CWSI Stress</span>
              <strong className="text-rose-300 text-xs">{selectedZone.cwsi.toFixed(2)}</strong>
            </div>
          </div>

          {/* Pathogen Threat Banner */}
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span className="truncate max-w-[220px]">{selectedZone.pathogenRisk}</span>
            </span>
            <button
              type="button"
              onClick={() => (window.location.href = '/advisories')}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition underline whitespace-nowrap ml-2"
            >
              View Advisory →
            </button>
          </div>
        </div>
      )}

      {/* ── Layer 9: Bottom Right Satellite Coordinates Strip ── */}
      <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-[10px] font-mono backdrop-blur-xl">
        <span>LAT: 19.9975° N</span>
        <span>LNG: 73.7898° E</span>
        <span>GSD: 0.5m/px</span>
      </div>
    </div>
  );
};
