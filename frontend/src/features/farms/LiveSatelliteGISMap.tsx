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
  MapPin,
  Compass,
  Radio,
  Grid,
  Check,
} from 'lucide-react';
import {
  loadGoogleMaps,
  AGRO_REGION_PRESETS,
  AgroRegionPreset,
} from '@/services/googleMapsLoader';

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
    lat: 20.2205,
    lng: 73.8395,
    polygonPoints: [
      [20, 15],
      [45, 12],
      [48, 42],
      [24, 45],
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
    lat: 20.2212,
    lng: 73.8435,
    polygonPoints: [
      [52, 14],
      [82, 18],
      [85, 46],
      [55, 43],
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
    lat: 20.2168,
    lng: 73.8448,
    polygonPoints: [
      [55, 50],
      [86, 48],
      [82, 85],
      [52, 82],
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
    lat: 20.2155,
    lng: 73.8385,
    polygonPoints: [
      [16, 52],
      [48, 49],
      [44, 88],
      [12, 84],
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
  initialZoom = 17,
  heightClass = 'h-[600px] sm:h-[680px]',
  onZoneSelect,
  showDroneTracker = true,
}) => {
  const [activeRegion, setActiveRegion] = useState<AgroRegionPreset>(AGRO_REGION_PRESETS[0]); // Dindori Valley Farmlands default
  const [mapLayer, setMapLayer] = useState<
    'google_satellite' | 'google_hybrid' | 'google_terrain' | 'sentinel_satellite' | 'ndvi' | 'thermal'
  >('google_satellite');
  const [selectedZone, setSelectedZone] = useState<FarmPolygonZone>(MOCK_ZONES[2]); // High risk default
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDrone, setShowDrone] = useState<boolean>(showDroneTracker);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState<boolean>(false);

  // Google Maps State
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState<boolean>(false);
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: activeRegion.lat,
    lng: activeRegion.lng,
  });

  // Simulated Drone Coordinates
  const [dronePos, setDronePos] = useState<{ x: number; y: number; alt: number; heading: number }>({
    x: 35,
    y: 30,
    alt: 48,
    heading: 45,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const googleMapDivRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const googlePolygonsRef = useRef<any[]>([]);

  // 1. Initialize Google Maps via dynamic SDK loader
  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((googleMaps) => {
        if (!isMounted || !googleMapDivRef.current) return;

        try {
          const map = new googleMaps.Map(googleMapDivRef.current, {
            center: { lat: activeRegion.lat, lng: activeRegion.lng },
            zoom: initialZoom,
            mapTypeId:
              mapLayer === 'google_hybrid'
                ? googleMaps.MapTypeId.HYBRID
                : mapLayer === 'google_terrain'
                ? googleMaps.MapTypeId.TERRAIN
                : googleMaps.MapTypeId.SATELLITE,
            disableDefaultUI: true,
            gestureHandling: 'greedy',
            tilt: 45,
            rotateControl: false,
            scaleControl: true,
          });

          googleMapInstanceRef.current = map;
          setIsGoogleMapsReady(true);
          setGoogleMapsError(null);

          // Track center changes to update HUD coordinates
          map.addListener('center_changed', () => {
            const center = map.getCenter();
            if (center) {
              setCurrentCoords({
                lat: center.lat(),
                lng: center.lng(),
              });
            }
          });

          // Draw real geospatial farm boundaries on the Google Satellite canvas
          renderGooglePolygons(map, googleMaps, activeRegion);
        } catch (err: any) {
          console.warn('[LiveSatelliteGISMap] Failed to initialize Google Maps:', err);
          setGoogleMapsError(err.message || 'Map instantiation failed');
        }
      })
      .catch((err) => {
        console.warn('[LiveSatelliteGISMap] Could not load Google Maps SDK, falling back to Sentinel-2 cache:', err);
        setGoogleMapsError('Google Maps API connecting — using Sentinel-2 high-res fallback.');
      });

    // Listen for authentication failure events
    const handleAuthFailure = () => {
      setGoogleMapsError('Google Maps API key authentication error — using high-res satellite imagery.');
    };
    window.addEventListener('google-maps-auth-failure', handleAuthFailure);

    return () => {
      isMounted = false;
      window.removeEventListener('google-maps-auth-failure', handleAuthFailure);
    };
  }, []);

  // Helper: Renders high-precision farm boundary polygons directly on Google Maps
  const renderGooglePolygons = (map: any, googleMaps: any, region: AgroRegionPreset) => {
    // Clear previous polygons
    googlePolygonsRef.current.forEach((poly) => poly.setMap(null));
    googlePolygonsRef.current = [];

    MOCK_ZONES.forEach((zone) => {
      // Calculate real GPS bounds based on region center and polygon points
      const coords = zone.polygonPoints.map(([px, py]) => {
        const dLat = (py - 50) * -0.00015;
        const dLng = (px - 50) * 0.00018;
        return {
          lat: region.lat + dLat,
          lng: region.lng + dLng,
        };
      });

      const color = getStatusColor(zone.healthStatus);

      const polygon = new googleMaps.Polygon({
        paths: coords,
        strokeColor: color,
        strokeOpacity: 0.95,
        strokeWeight: 2.5,
        fillColor: color,
        fillOpacity: zone.healthStatus === 'HIGH_RISK' ? 0.45 : 0.3,
        map: map,
        clickable: true,
      });

      polygon.addListener('click', () => {
        handleZoneClick(zone);
        map.panTo({ lat: zone.lat || region.lat, lng: zone.lng || region.lng });
      });

      polygon.addListener('mouseover', () => {
        polygon.setOptions({ fillOpacity: 0.6, strokeWeight: 3.5 });
      });

      polygon.addListener('mouseout', () => {
        polygon.setOptions({
          fillOpacity: zone.healthStatus === 'HIGH_RISK' ? 0.45 : 0.3,
          strokeWeight: 2.5,
        });
      });

      googlePolygonsRef.current.push(polygon);
    });
  };

  // Switch region preset
  const handleSelectRegion = (preset: AgroRegionPreset) => {
    setActiveRegion(preset);
    setIsRegionMenuOpen(false);
    setCurrentCoords({ lat: preset.lat, lng: preset.lng });

    if (googleMapInstanceRef.current && (window as any).google?.maps) {
      googleMapInstanceRef.current.panTo({ lat: preset.lat, lng: preset.lng });
      googleMapInstanceRef.current.setZoom(preset.zoom);
      renderGooglePolygons(googleMapInstanceRef.current, (window as any).google.maps, preset);
    }
  };

  // Sync Google Map layer mode
  useEffect(() => {
    if (!googleMapInstanceRef.current || !(window as any).google?.maps) return;
    const gmaps = (window as any).google.maps;

    if (mapLayer === 'google_hybrid') {
      googleMapInstanceRef.current.setMapTypeId(gmaps.MapTypeId.HYBRID);
    } else if (mapLayer === 'google_terrain') {
      googleMapInstanceRef.current.setMapTypeId(gmaps.MapTypeId.TERRAIN);
    } else if (mapLayer === 'google_satellite') {
      googleMapInstanceRef.current.setMapTypeId(gmaps.MapTypeId.SATELLITE);
    }
  }, [mapLayer]);

  // Animate drone flight simulator across satellite canopy
  useEffect(() => {
    if (!showDrone) return;
    const interval = setInterval(() => {
      setDronePos((prev) => {
        const nextX = (prev.x + 0.35) % 90;
        const nextY = 25 + Math.sin(nextX * 0.15) * 22;
        const heading =
          (Math.atan2(Math.sin(nextX * 0.15) * 22 - prev.y, 0.35) * 180) / Math.PI + 90;
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

  const handleZoomIn = () => {
    if (googleMapInstanceRef.current) {
      const cur = googleMapInstanceRef.current.getZoom() || 17;
      googleMapInstanceRef.current.setZoom(Math.min(cur + 1, 21));
    }
  };

  const handleZoomOut = () => {
    if (googleMapInstanceRef.current) {
      const cur = googleMapInstanceRef.current.getZoom() || 17;
      googleMapInstanceRef.current.setZoom(Math.max(cur - 1, 10));
    }
  };

  const handleResetView = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: activeRegion.lat, lng: activeRegion.lng });
      googleMapInstanceRef.current.setZoom(activeRegion.zoom);
    }
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

  const isGoogleMapActive =
    mapLayer === 'google_satellite' || mapLayer === 'google_hybrid' || mapLayer === 'google_terrain';

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${heightClass} rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-2xl transition-all duration-300 select-none`}
    >
      {/* ── Layer 1A: Live Google Cloud Satellite / Hybrid Map Canvas ── */}
      <div
        ref={googleMapDivRef}
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
          isGoogleMapActive && isGoogleMapsReady ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Layer 1B: High-Res Real Top-Down Sentinel-2 Satellite Fallback ── */}
      {(!isGoogleMapActive || !isGoogleMapsReady) && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-500 ease-out z-0"
          style={{
            backgroundImage: `url('${
              mapLayer === 'ndvi'
                ? '/satellite/satellite_crop_ndvi.jpg'
                : '/satellite/satellite_crop_truecolor.jpg'
            }')`,
          }}
        />
      )}

      {/* ── Layer 2: Multispectral Thermal & NDVI Filter Overlays ── */}
      {mapLayer === 'thermal' && (
        <div
          className="absolute inset-0 mix-blend-screen transition-opacity duration-300 pointer-events-none z-10"
          style={{
            opacity: 0.85,
            background:
              'radial-gradient(circle at 70% 65%, rgba(239, 68, 68, 0.85), transparent 35%), radial-gradient(circle at 35% 30%, rgba(59, 130, 246, 0.7), transparent 40%), radial-gradient(circle at 30% 70%, rgba(16, 185, 129, 0.6), transparent 40%)',
          }}
        />
      )}

      {mapLayer === 'ndvi' && (
        <div
          className="absolute inset-0 mix-blend-color-dodge transition-opacity duration-300 pointer-events-none z-10 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse at 40% 40%, rgba(132, 204, 22, 0.8), transparent 50%), radial-gradient(circle at 75% 70%, rgba(234, 179, 8, 0.6), transparent 40%)',
          }}
        />
      )}

      {/* ── Layer 3: High-Tech Satellite Scanner Grid Overlay ── */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20 z-10"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* ── Layer 4: Interactive Polygonal Farm Boundaries (Fallback / Enhanced SVG Canvas) ── */}
      {(!isGoogleMapActive || !isGoogleMapsReady) && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto z-10"
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
            const pointsStr = zone.polygonPoints
              .map(([px, py]) => `${px * 10},${py * 6}`)
              .join(' ');
            const color = getStatusColor(zone.healthStatus);

            return (
              <g key={zone.id} className="cursor-pointer" onClick={() => handleZoneClick(zone)}>
                <polygon
                  points={pointsStr}
                  fill={color}
                  fillOpacity={isSelected ? 0.55 : 0.28}
                  stroke={color}
                  strokeWidth={isSelected ? 3.5 : 2}
                  strokeDasharray={isSelected ? '6,3' : 'none'}
                  filter={zone.healthStatus === 'HIGH_RISK' ? 'url(#glow-rose)' : 'url(#glow-emerald)'}
                  className="transition-all duration-300 hover:fill-opacity-50"
                />

                {/* Zone Label Pin */}
                <circle
                  cx={zone.polygonPoints[0][0] * 10}
                  cy={zone.polygonPoints[0][1] * 6}
                  r={5}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                <text
                  x={zone.polygonPoints[0][0] * 10 + 10}
                  y={zone.polygonPoints[0][1] * 6 + 4}
                  fill="#ffffff"
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  {zone.name.split('—')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {/* ── Layer 5: Top Left Controls (Layer Switcher & Indian Agricultural Region Selector) ── */}
      <div className="absolute top-4 left-4 z-30 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        {/* Layer Switcher Pill */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl">
          <button
            type="button"
            onClick={() => setMapLayer('google_satellite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              mapLayer === 'google_satellite'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Real-time Google Cloud High-Resolution Satellite View"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
            <span>🛰️ Google Satellite</span>
          </button>

          <button
            type="button"
            onClick={() => setMapLayer('google_hybrid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              mapLayer === 'google_hybrid'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Google Satellite with Roads & Field Landmarks"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🗺️ Hybrid</span>
          </button>

          <button
            type="button"
            onClick={() => setMapLayer('ndvi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              mapLayer === 'ndvi'
                ? 'bg-lime-600 text-white shadow-md shadow-lime-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Multispectral Sentinel-2 NDVI Foliar Vegetation Index"
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
            title="Crop Water Stress Index Thermal Radiometry"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>💧 Thermal CWSI</span>
          </button>

          <button
            type="button"
            onClick={() => setMapLayer('google_terrain')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              mapLayer === 'google_terrain'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Google Maps Topographical Elevation & Relief"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>⛰️ Terrain</span>
          </button>
        </div>

        {/* Indian Agro Region Quick-Jump Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRegionMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-emerald-300 hover:text-emerald-200 text-xs font-bold backdrop-blur-xl shadow-xl transition"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeRegion.name.split('—')[0]}</span>
            <span className="text-[10px] text-slate-400">({activeRegion.state})</span>
          </button>

          {isRegionMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 p-2 rounded-2xl bg-slate-950/95 border border-slate-700 backdrop-blur-2xl shadow-2xl space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Select Agro-Climatic Belt (Google Satellite)
              </div>
              {AGRO_REGION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectRegion(preset)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                    activeRegion.id === preset.id
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {activeRegion.id === preset.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{preset.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {preset.state} • {preset.primaryCrops}
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {preset.lat.toFixed(2)}°N
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Layer 6: Top Right Satellite Telemetry HUD ── */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        {/* Drone Live Telemetry Badge */}
        {showDrone && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/90 border border-sky-500/40 text-sky-300 backdrop-blur-xl text-xs font-mono shadow-xl">
            <Plane className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>UAV-01 ALT: {dronePos.alt.toFixed(0)}m</span>
            <span className="text-slate-500">|</span>
            <span>SPEED: 14.2 m/s</span>
          </div>
        )}

        {/* Live Satellite Feed Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/90 border backdrop-blur-xl text-xs font-mono shadow-xl ${
            googleMapsError
              ? 'border-amber-500/40 text-amber-300'
              : 'border-emerald-500/40 text-emerald-300'
          }`}
          title={googleMapsError || 'Connected to Google Cloud High-Resolution Satellite Feed'}
        >
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              googleMapsError ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span className="hidden sm:inline">
            {isGoogleMapsReady && !googleMapsError
              ? 'Google Cloud Satellite Live'
              : googleMapsError
              ? 'Sentinel-2 Fallback'
              : 'Sentinel-2 Sync'}
          </span>
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

      {/* ── Layer 7: Right Side Zoom & Tool Buttons ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 p-1.5 bg-slate-950/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Zoom In Satellite"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Zoom Out Satellite"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition text-[10px] font-mono font-bold"
          title="Reset View to Region Center"
        >
          Reset
        </button>
        <div className="w-full h-px bg-slate-800 my-0.5" />
        <button
          type="button"
          onClick={() => setShowGrid((prev) => !prev)}
          className={`p-2 rounded-xl transition ${
            showGrid ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Toggle Sub-Meter Precision Grid"
        >
          <Grid className="w-4 h-4" />
        </button>
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
        <div className="absolute bottom-4 left-4 z-30 max-w-[calc(100vw-32px)] sm:max-w-md p-4 rounded-3xl bg-slate-950/90 border border-emerald-500/30 backdrop-blur-2xl text-white shadow-2xl space-y-3 animate-in slide-in-from-bottom-3 duration-200">
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

      {/* ── Layer 9: Bottom Right Real-Time Satellite Coordinates Strip ── */}
      <div className="absolute bottom-4 right-4 z-30 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-950/85 border border-slate-800 text-slate-300 text-[10px] font-mono backdrop-blur-xl shadow-xl">
        <span className="flex items-center gap-1 text-emerald-400">
          <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '10s' }} />
          <span>LAT: {currentCoords.lat.toFixed(4)}° N</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-emerald-400">LNG: {currentCoords.lng.toFixed(4)}° E</span>
        <span className="text-slate-600">|</span>
        <span className="text-sky-300">GSD: 0.3m (Google High-Res)</span>
      </div>
    </div>
  );
};

export default LiveSatelliteGISMap;
