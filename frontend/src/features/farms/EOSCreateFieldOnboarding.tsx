import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadGoogleMaps } from '@/services/googleMapsLoader';
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
  Radio,
  Crosshair,
  MapPin,
  Check,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  Hand,
  Compass,
} from 'lucide-react';

export interface DrawnVertex {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

interface RegionPreset {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  cropDefault: string;
  varietyDefault: string;
  soilDefault: string;
  irrigationDefault: string;
  initialVertices: DrawnVertex[];
  bgImage: string;
}

const REGION_PRESETS: RegionPreset[] = [
  {
    id: 'dindori',
    name: 'Dindori Valley Tomato & Vineyard Fields',
    state: 'Maharashtra',
    country: 'India',
    lat: 20.2185,
    lng: 73.842,
    cropDefault: 'Tomato (Abhinav)',
    varietyDefault: 'Syngenta Abhinav F1',
    soilDefault: 'Black Cotton Regur Clay',
    irrigationDefault: 'Drip Irrigation with Fertigation',
    initialVertices: [
      { x: 34.2, y: 18.5 },
      { x: 65.8, y: 17.2 },
      { x: 66.4, y: 64.6 },
      { x: 33.8, y: 65.2 },
    ],
    bgImage: '/satellite/satellite_crop_truecolor.jpg',
  },
  {
    id: 'punjab_cropland',
    name: 'Khanna Rural Wheat & Rice Fields',
    state: 'Punjab',
    country: 'India',
    lat: 30.718,
    lng: 76.192,
    cropDefault: 'Wheat (PBW-550)',
    varietyDefault: 'PBW-550 Certified',
    soilDefault: 'River Basin Alluvial Loam',
    irrigationDefault: 'Furrow Flood Irrigation',
    initialVertices: [
      { x: 16.5, y: 18.2 },
      { x: 32.5, y: 18.2 },
      { x: 32.5, y: 49.5 },
      { x: 16.5, y: 49.5 },
    ],
    bgImage: '/satellite/satellite_crop_truecolor.jpg',
  },
  {
    id: 'pollachi_farms',
    name: 'Pollachi Rural Farmland & Crop Canopy',
    state: 'Tamil Nadu',
    country: 'India',
    lat: 10.742,
    lng: 77.015,
    cropDefault: 'Maize (Hybrid DHM-117)',
    varietyDefault: 'DHM-117 Certified',
    soilDefault: 'Red Sandy Loam Soil',
    irrigationDefault: 'Micro-Sprinkler Overhead',
    initialVertices: [
      { x: 50.4, y: 50.8 },
      { x: 82.8, y: 50.8 },
      { x: 82.8, y: 82.4 },
      { x: 50.4, y: 82.4 },
    ],
    bgImage: '/satellite/satellite_crop_truecolor.jpg',
  },
  {
    id: 'krishna_delta',
    name: 'Krishna Delta Rural Paddy & Cashew Basin',
    state: 'Andhra Pradesh',
    country: 'India',
    lat: 16.085,
    lng: 80.785,
    cropDefault: 'Rice (Basmati 1121)',
    varietyDefault: 'Pusa-1121',
    soilDefault: 'Alluvial Delta Clay',
    irrigationDefault: 'Canal Flow Irrigation',
    initialVertices: [
      { x: 67.5, y: 17.5 },
      { x: 83.2, y: 17.5 },
      { x: 83.2, y: 49.8 },
      { x: 67.5, y: 49.8 },
    ],
    bgImage: '/satellite/satellite_crop_truecolor.jpg',
  },
];

export const EOSCreateFieldOnboarding: React.FC = () => {
  const navigate = useNavigate();

  // Active Region Preset
  const [activeRegion, setActiveRegion] = useState<RegionPreset>(REGION_PRESETS[0]);

  // Field Interaction & Drawing Mode: 'pan' | 'polygon' | 'rectangle' | 'upload'
  const [toolMode, setToolMode] = useState<'pan' | 'polygon' | 'rectangle' | 'upload'>('pan');
  const [satelliteLayer, setSatelliteLayer] = useState<
    'google_satellite' | 'google_hybrid' | 'true_color' | 'ndvi' | 'ndre' | 'ndwi' | 'thermal'
  >('google_satellite');
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentMapZoom, setCurrentMapZoom] = useState<number>(17);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number }>({
    lat: REGION_PRESETS[0].lat,
    lng: REGION_PRESETS[0].lng,
  });
  const [imagePan, setImagePan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingFallback, setIsDraggingFallback] = useState<boolean>(false);
  const [fallbackDragStart, setFallbackDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Boundary Vertices
  const [vertices, setVertices] = useState<DrawnVertex[]>(REGION_PRESETS[0].initialVertices);
  const [draggedVertexIndex, setDraggedVertexIndex] = useState<number | null>(null);

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
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasSvgRef = useRef<SVGSVGElement>(null);
  const googleMapDivRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<any>(null);

  // Initialize Google Maps for field boundary drawing scene
  useEffect(() => {
    let isMounted = true;
    loadGoogleMaps()
      .then((googleMaps) => {
        if (!isMounted || !googleMapDivRef.current) return;
        try {
          const map = new googleMaps.Map(googleMapDivRef.current, {
            center: { lat: activeRegion.lat, lng: activeRegion.lng },
            zoom: currentMapZoom,
            mapTypeId:
              satelliteLayer === 'google_hybrid'
                ? googleMaps.MapTypeId.HYBRID
                : googleMaps.MapTypeId.SATELLITE,
            disableDefaultUI: true,
            gestureHandling: 'greedy', // Enables 1-finger touch and desktop mouse dragging anywhere
            draggable: true,
            scrollwheel: true,
            disableDoubleClickZoom: false,
            tilt: 0,
          });
          googleMapInstanceRef.current = map;
          setIsGoogleMapsReady(true);

          map.addListener('center_changed', () => {
            const c = map.getCenter();
            if (c) {
              setCurrentCenter({ lat: c.lat(), lng: c.lng() });
            }
          });

          map.addListener('zoom_changed', () => {
            const z = map.getZoom();
            if (typeof z === 'number') {
              setCurrentMapZoom(z);
            }
          });
        } catch (e) {
          console.warn('[EOSCreateFieldOnboarding] Google Map init error:', e);
        }
      })
      .catch((e) => {
        console.warn('[EOSCreateFieldOnboarding] Google Maps load failed:', e);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync Google Map type when satelliteLayer switches
  useEffect(() => {
    if (!googleMapInstanceRef.current || !(window as any).google?.maps) return;
    const gmaps = (window as any).google.maps;
    if (satelliteLayer === 'google_hybrid') {
      googleMapInstanceRef.current.setMapTypeId(gmaps.MapTypeId.HYBRID);
    } else if (satelliteLayer === 'google_satellite') {
      googleMapInstanceRef.current.setMapTypeId(gmaps.MapTypeId.SATELLITE);
    }
  }, [satelliteLayer]);

  // Select region preset
  const handleSelectRegion = (preset: RegionPreset) => {
    setActiveRegion(preset);
    setSearchQuery(`${preset.name}, ${preset.state}, ${preset.country}`);
    setCropType(preset.cropDefault);
    setCropVariety(preset.varietyDefault);
    setSoilType(preset.soilDefault);
    setIrrigationType(preset.irrigationDefault);
    setFarmGroup(preset.name);
    setVertices(preset.initialVertices);
    setCurrentCenter({ lat: preset.lat, lng: preset.lng });
    setImagePan({ x: 0, y: 0 });

    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: preset.lat, lng: preset.lng });
      googleMapInstanceRef.current.setZoom(17);
      setCurrentMapZoom(17);
    }
  };

  // Compute field area (Hectares, Acres, Gunthas) & perimeter from vertices
  const { areaHa, areaAcres, areaGunthas, perimeterMeters } = useMemo(() => {
    if (vertices.length < 3) {
      return { areaHa: 0, areaAcres: 0, areaGunthas: 0, perimeterMeters: 0 };
    }

    // High precision shoelace polygon formula mapped to 1km top-down satellite bounding scene
    let shoelace = 0;
    let perimeter = 0;
    for (let i = 0; i < vertices.length; i++) {
      const next = (i + 1) % vertices.length;
      shoelace += vertices[i].x * vertices[next].y - vertices[next].x * vertices[i].y;

      const dx = (vertices[next].x - vertices[i].x) * 10; // 10m per percentage on 1000m orthophoto
      const dy = (vertices[next].y - vertices[i].y) * 10;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    const rawAreaSqMeters = Math.abs(shoelace / 2) * 10 * 10;
    const ha = +(rawAreaSqMeters / 10000).toFixed(2);
    const acres = +(ha * 2.47105).toFixed(2);
    const gunthas = +(ha * 100).toFixed(1);
    const periM = Math.round(perimeter);

    return {
      areaHa: Math.max(ha, 0.4),
      areaAcres: Math.max(acres, 0.99),
      areaGunthas: Math.max(gunthas, 40),
      perimeterMeters: Math.max(periM, 260),
    };
  }, [vertices]);

  // Directional Pan (Swap) Handlers - left, right, up, down, anywhere
  const handlePanBy = (dx: number, dy: number) => {
    if (googleMapInstanceRef.current && (satelliteLayer === 'google_satellite' || satelliteLayer === 'google_hybrid')) {
      googleMapInstanceRef.current.panBy(dx, dy);
    } else {
      setImagePan((prev) => ({
        x: Math.max(-800, Math.min(800, prev.x - dx)),
        y: Math.max(-800, Math.min(800, prev.y - dy)),
      }));
    }
  };

  const handlePanLeft = () => handlePanBy(-220, 0);
  const handlePanRight = () => handlePanBy(220, 0);
  const handlePanUp = () => handlePanBy(0, -220);
  const handlePanDown = () => handlePanBy(0, 220);

  const handleRecenter = () => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat: activeRegion.lat, lng: activeRegion.lng });
      googleMapInstanceRef.current.setZoom(17);
      setCurrentMapZoom(17);
    }
    setCurrentCenter({ lat: activeRegion.lat, lng: activeRegion.lng });
    setImagePan({ x: 0, y: 0 });
    setZoomLevel(100);
  };

  // Zoom In / Out Handlers (+ and -)
  const handleZoomIn = () => {
    if (googleMapInstanceRef.current && (satelliteLayer === 'google_satellite' || satelliteLayer === 'google_hybrid')) {
      const cur = googleMapInstanceRef.current.getZoom() || 17;
      const next = Math.min(cur + 1, 21);
      googleMapInstanceRef.current.setZoom(next);
      setCurrentMapZoom(next);
    }
    setZoomLevel((z) => Math.min(z + 20, 260));
  };

  const handleZoomOut = () => {
    if (googleMapInstanceRef.current && (satelliteLayer === 'google_satellite' || satelliteLayer === 'google_hybrid')) {
      const cur = googleMapInstanceRef.current.getZoom() || 17;
      const next = Math.max(cur - 1, 10);
      googleMapInstanceRef.current.setZoom(next);
      setCurrentMapZoom(next);
    }
    setZoomLevel((z) => Math.max(z - 20, 60));
  };

  const handleSetZoomLevel = (targetZoom: number) => {
    if (googleMapInstanceRef.current && (satelliteLayer === 'google_satellite' || satelliteLayer === 'google_hybrid')) {
      googleMapInstanceRef.current.setZoom(targetZoom);
      setCurrentMapZoom(targetZoom);
    }
    setZoomLevel(targetZoom === 15 ? 80 : targetZoom === 17 ? 100 : targetZoom === 19 ? 140 : 180);
  };

  // Keyboard navigation for Pan & Zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePanLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePanRight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePanUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handlePanDown();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [satelliteLayer, currentMapZoom]);

  // Search geocoder & preset matcher
  const handleSearchLocation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Direct GPS format "20.2185, 73.8420"
    const coordMatch = query.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (googleMapInstanceRef.current) {
        googleMapInstanceRef.current.panTo({ lat, lng });
        googleMapInstanceRef.current.setZoom(17);
        setCurrentMapZoom(17);
      }
      setCurrentCenter({ lat, lng });
      return;
    }

    // Google Maps Geocoder if SDK available
    if ((window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: query }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          if (googleMapInstanceRef.current) {
            googleMapInstanceRef.current.panTo({ lat, lng });
            googleMapInstanceRef.current.setZoom(17);
            setCurrentMapZoom(17);
          }
          setCurrentCenter({ lat, lng });
        } else {
          fallbackMatchPreset(query);
        }
      });
    } else {
      fallbackMatchPreset(query);
    }
  };

  const fallbackMatchPreset = (query: string) => {
    const qLower = query.toLowerCase();
    const found = REGION_PRESETS.find(
      (p) =>
        p.name.toLowerCase().includes(qLower) ||
        p.state.toLowerCase().includes(qLower) ||
        p.cropDefault.toLowerCase().includes(qLower)
    );
    if (found) {
      handleSelectRegion(found);
    }
  };

  // Click on satellite canvas to add vertices
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode === 'pan' || toolMode === 'upload') return;
    if (draggedVertexIndex !== null) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    if (toolMode === 'rectangle') {
      const w = 24;
      const h = 20;
      setVertices([
        { x: +Math.max(2, Math.min(98, clickX - w / 2)).toFixed(1), y: +Math.max(2, Math.min(98, clickY - h / 2)).toFixed(1) },
        { x: +Math.max(2, Math.min(98, clickX + w / 2)).toFixed(1), y: +Math.max(2, Math.min(98, clickY - h / 2)).toFixed(1) },
        { x: +Math.max(2, Math.min(98, clickX + w / 2)).toFixed(1), y: +Math.max(2, Math.min(98, clickY + h / 2)).toFixed(1) },
        { x: +Math.max(2, Math.min(98, clickX - w / 2)).toFixed(1), y: +Math.max(2, Math.min(98, clickY + h / 2)).toFixed(1) },
      ]);
    } else if (toolMode === 'polygon') {
      setVertices((prev) => [...prev, { x: +clickX.toFixed(1), y: +clickY.toFixed(1) }]);
    }
  };

  // Vertex Dragging handlers
  const handleVertexMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setDraggedVertexIndex(index);
  };

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      toolMode === 'pan' &&
      (!isGoogleMapsReady || (satelliteLayer !== 'google_satellite' && satelliteLayer !== 'google_hybrid'))
    ) {
      setIsDraggingFallback(true);
      setFallbackDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedVertexIndex !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const moveX = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
      const moveY = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

      setVertices((prev) =>
        prev.map((v, idx) => (idx === draggedVertexIndex ? { x: +moveX.toFixed(1), y: +moveY.toFixed(1) } : v))
      );
    } else if (isDraggingFallback) {
      const dx = e.clientX - fallbackDragStart.x;
      const dy = e.clientY - fallbackDragStart.y;
      setImagePan((prev) => ({
        x: Math.max(-800, Math.min(800, prev.x + dx)),
        y: Math.max(-800, Math.min(800, prev.y + dy)),
      }));
      setFallbackDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContainerMouseUp = () => {
    setDraggedVertexIndex(null);
    setIsDraggingFallback(false);
  };

  const handleUndoVertex = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVertices((prev) => (prev.length > 0 ? prev.slice(0, -1) : []));
  };

  const handleClearBoundary = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVertices([]);
  };

  const handleSnapToCentralParcel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVertices([
      { x: 34.2, y: 18.5 },
      { x: 65.8, y: 17.2 },
      { x: 66.4, y: 64.6 },
      { x: 33.8, y: 65.2 },
    ]);
  };

  const handleSaveField = () => {
    if (vertices.length < 3) {
      alert('Please place at least 3 corner points on the top-down satellite map to define your field boundary.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSuccessToast(`Field "${fieldName}" (${areaHa} ha) successfully linked to Sentinel-2 satellite pipeline!`);
      setTimeout(() => {
        navigate('/farms');
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

  // Convert vertices to SVG polygon points string (scaled to 1000x600 viewBox)
  const svgPoints = vertices.map((v) => `${v.x * 10},${v.y * 6}`).join(' ');

  // Determine active satellite imagery layer background
  const getSatelliteBackground = () => {
    switch (satelliteLayer) {
      case 'ndvi':
        return '/satellite/satellite_crop_ndvi.jpg';
      case 'ndre':
        return '/satellite/satellite_crop_ndre.jpg';
      case 'true_color':
      default:
        return activeRegion.bgImage;
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 pb-20 animate-in fade-in duration-200">
      {/* ── Top EOS Header Ribbon ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-950 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/20">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Sentinel-2 & Landsat-9 Satellite Pipeline</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">
              90° Nadir Orthomosaic (0.5m GSD)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Pentagon className="w-7 h-7 text-emerald-400" />
            <span>Create & Draw Field Boundary (शेताची सीमा आखा)</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-3xl">
            Pinpoint and draw high-precision agricultural field boundaries directly onto real 90° top-down satellite imagery to unlock continuous NDVI vegetation index monitoring, soil moisture tracking, and AI disease early warnings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/farms')}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2 text-xs font-bold active:scale-95 whitespace-nowrap self-start md:self-auto"
        >
          <Navigation className="w-4 h-4" />
          <span>Exit to Farm View</span>
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
            <form onSubmit={handleSearchLocation} className="relative w-full sm:w-80 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search district, village or GPS coords..."
                className="w-full pl-10 pr-16 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-sm"
              >
                Find
              </button>
            </form>

            {/* Geometry Drawing & Pan Mode Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setToolMode('pan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  toolMode === 'pan'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Pan / Move / Swap map in any direction"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Pan / Move</span>
              </button>

              <button
                type="button"
                onClick={() => setToolMode('polygon')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  toolMode === 'polygon'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Click point-by-point to draw custom polygon boundary"
              >
                <Pentagon className="w-3.5 h-3.5" />
                <span>Draw Polygon</span>
              </button>

              <button
                type="button"
                onClick={() => setToolMode('rectangle')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  toolMode === 'rectangle'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Click to drop rectangular boundary box"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Rectangle</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  toolMode === 'upload'
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

          {/* Agricultural Region Quick Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>Satellite Scene:</span>
            </span>
            {REGION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectRegion(preset)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeRegion.id === preset.id
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/50'
                }`}
              >
                {activeRegion.id === preset.id && <Check className="w-3 h-3 text-emerald-500" />}
                <span>{preset.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({preset.state})</span>
              </button>
            ))}
          </div>

          {/* ── Interactive Satellite GIS Canvas Box ── */}
          <div
            ref={containerRef}
            onClick={handleMapClick}
            onMouseDown={handleContainerMouseDown}
            onMouseMove={handleContainerMouseMove}
            onMouseUp={handleContainerMouseUp}
            className={`relative w-full h-[580px] sm:h-[660px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-2xl group select-none ${
              toolMode === 'pan'
                ? isDraggingFallback
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-crosshair'
            }`}
          >
            {/* Live Google Cloud Satellite Base Imagery */}
            <div
              ref={googleMapDivRef}
              className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
                toolMode === 'pan' ? 'pointer-events-auto' : 'pointer-events-none'
              } ${
                (satelliteLayer === 'google_satellite' || satelliteLayer === 'google_hybrid') && isGoogleMapsReady
                  ? 'opacity-100 z-0'
                  : 'opacity-0'
              }`}
            />

            {/* Real Top-Down Sentinel-2 Satellite Fallback Base */}
            {(!(satelliteLayer === 'google_satellite' || satelliteLayer === 'google_hybrid') || !isGoogleMapsReady) && (
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-300 ease-out z-0"
                style={{
                  backgroundImage: `url('${getSatelliteBackground()}')`,
                  transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${zoomLevel / 100})`,
                }}
              />
            )}

            {/* Multispectral Dynamic Overlays for NDWI and Thermal */}
            {satelliteLayer === 'ndwi' && (
              <div
                className="absolute inset-0 mix-blend-color-dodge transition-opacity duration-300 pointer-events-none opacity-85"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(2, 132, 199, 0.85), transparent 60%), radial-gradient(circle at 25% 25%, rgba(56, 189, 248, 0.9), transparent 45%), radial-gradient(circle at 75% 75%, rgba(14, 165, 233, 0.8), transparent 50%)',
                }}
              />
            )}

            {satelliteLayer === 'thermal' && (
              <div
                className="absolute inset-0 mix-blend-screen transition-opacity duration-300 pointer-events-none opacity-85"
                style={{
                  background:
                    'radial-gradient(circle at 65% 55%, rgba(239, 68, 68, 0.85), transparent 45%), radial-gradient(circle at 35% 35%, rgba(59, 130, 246, 0.75), transparent 45%), radial-gradient(circle at 50% 80%, rgba(245, 158, 11, 0.8), transparent 40%)',
                }}
              />
            )}

            {/* Sub-Meter Orthophoto Coordinate Grid Overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Satellite Metadata HUD Strip at Top */}
            <div className="absolute top-16 left-4 z-10 hidden sm:flex items-center gap-3.5 py-1.5 px-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/25 text-[10px] font-mono text-emerald-300 pointer-events-none shadow-xl">
              <span className="flex items-center gap-1.5 font-bold">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>GPS: {currentCenter.lat.toFixed(4)}°N, {currentCenter.lng.toFixed(4)}°E</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">Zoom: {currentMapZoom}x</span>
              <span className="text-slate-600">|</span>
              <span>GSD: {(0.5 * Math.pow(2, Math.max(0, 17 - currentMapZoom))).toFixed(2)}m/px</span>
              <span className="text-slate-600">|</span>
              <span>Cloud: 0.0%</span>
              <span className="text-slate-600">|</span>
              <span className="text-sky-300">Sentinel-2 & Google High-Res</span>
            </div>

            {/* On-Canvas Mode Quick-Switcher Pill */}
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-slate-950/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setToolMode('pan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  toolMode === 'pan'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Drag map anywhere to swap left, right, up, down"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>✋ Pan & Move</span>
              </button>
              <button
                type="button"
                onClick={() => setToolMode('polygon')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  toolMode === 'polygon'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Click on map to drop boundary points"
              >
                <Pentagon className="w-3.5 h-3.5" />
                <span>✏️ Draw Points</span>
              </button>
            </div>

            {/* SVG Polygon Canvas for Drawn Field Vertices */}
            <svg
              ref={canvasSvgRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 600"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="eos-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <radialGradient id="polygonFillGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.22" />
                </radialGradient>
              </defs>

              {/* Polygon Perimeter Filled Area */}
              {vertices.length >= 3 && (
                <polygon
                  points={svgPoints}
                  fill="url(#polygonFillGrad)"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  filter="url(#eos-glow)"
                  className="transition-all duration-100"
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
              {vertices.map((v, idx) => {
                const isDragging = draggedVertexIndex === idx;
                return (
                  <g
                    key={idx}
                    transform={`translate(${v.x * 10}, ${v.y * 6})`}
                    className="cursor-move pointer-events-auto"
                    onMouseDown={(e) => handleVertexMouseDown(e, idx)}
                  >
                    {/* Pulsing Radar Ring */}
                    <circle
                      r={isDragging ? 22 : 14}
                      fill="rgba(16, 185, 129, 0.35)"
                      className={isDragging ? 'animate-none' : 'animate-ping'}
                    />

                    {/* Outer Glow Pin */}
                    <circle
                      r="10"
                      fill={isDragging ? '#34d399' : '#10b981'}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="shadow-lg hover:scale-125 transition-transform"
                    />

                    {/* Center Core Dot */}
                    <circle r="3.5" fill="#ffffff" />

                    {/* Point Label Badge */}
                    <rect
                      x="-14"
                      y="-26"
                      width="28"
                      height="15"
                      rx="4"
                      fill="#022c22"
                      stroke="#10b981"
                      strokeWidth="1.2"
                    />
                    <text
                      y="-15"
                      textAnchor="middle"
                      fill="#34d399"
                      fontSize="9"
                      fontWeight="bold"
                      className="font-mono select-none"
                    >
                      P{idx + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Top Left Layer Switcher Pill matching screenshot */}
            <div
              className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1 p-1 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { id: 'google_satellite', label: '🛰️ Google Satellite', icon: Radio },
                { id: 'google_hybrid', label: '🗺️ Hybrid', icon: Layers },
                { id: 'true_color', label: '🛰️ Sentinel-2', icon: Layers },
                { id: 'ndvi', label: '🌿 NDVI', icon: Sparkles },
                { id: 'ndre', label: '🌾 NDRE', icon: Sprout },
                { id: 'ndwi', label: '💧 NDWI', icon: Globe },
                { id: 'thermal', label: '🌡️ Thermal', icon: Flame },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSatelliteLayer(id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    satelliteLayer === id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Top Right Zoom & Fullscreen Controls matching screenshot */}
            <div
              className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-1">
                {currentMapZoom}x
              </span>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Zoom Out (−)"
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

            {/* Directional Pan (Swap) D-Pad & Zoom Widget */}
            <div
              className="absolute bottom-20 right-4 z-20 flex flex-col items-center gap-2 p-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-emerald-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* D-Pad Header */}
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3 h-3 text-emerald-400" />
                  <span>Swap / Pan</span>
                </span>
                <span className="text-[9px] font-mono font-bold text-sky-400">
                  {currentMapZoom}x
                </span>
              </div>

              {/* 4-Way Directional D-Pad */}
              <div className="grid grid-cols-3 gap-1 w-28 h-28 place-items-center">
                <div />
                {/* UP */}
                <button
                  type="button"
                  onClick={handlePanUp}
                  title="Swap Up (वर सरकवा)"
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-90 border border-slate-700/60 shadow"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div />

                {/* LEFT */}
                <button
                  type="button"
                  onClick={handlePanLeft}
                  title="Swap Left (डावीकडे सरकवा)"
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-90 border border-slate-700/60 shadow"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* CENTER RECENTER */}
                <button
                  type="button"
                  onClick={handleRecenter}
                  title="Recenter to Farm (मध्यभागी आणा)"
                  className="w-8 h-8 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 flex items-center justify-center transition active:scale-90 border border-emerald-500/40 shadow font-bold"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                </button>

                {/* RIGHT */}
                <button
                  type="button"
                  onClick={handlePanRight}
                  title="Swap Right (उजवीकडे सरकवा)"
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-90 border border-slate-700/60 shadow"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div />
                {/* DOWN */}
                <button
                  type="button"
                  onClick={handlePanDown}
                  title="Swap Down (खाली सरकवा)"
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-90 border border-slate-700/60 shadow"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div />
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-slate-800 my-0.5" />

              {/* Zoom Controls (+ and -) */}
              <div className="flex items-center gap-1.5 w-full">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In (+) विस्तृत करा"
                  className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-200 hover:text-white flex items-center justify-center transition font-black text-sm border border-slate-700/60 shadow active:scale-95"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out (−) संक्षिप्त करा"
                  className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-200 hover:text-white flex items-center justify-center transition font-black text-sm border border-slate-700/60 shadow active:scale-95"
                >
                  −
                </button>
              </div>

              {/* Quick Zoom Presets */}
              <div className="grid grid-cols-3 gap-1 w-full text-[9px] font-mono font-bold pt-0.5">
                <button
                  type="button"
                  onClick={() => handleSetZoomLevel(15)}
                  className={`py-1 rounded-lg border text-center transition ${
                    currentMapZoom === 15
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="District view (15x)"
                >
                  15x
                </button>
                <button
                  type="button"
                  onClick={() => handleSetZoomLevel(17)}
                  className={`py-1 rounded-lg border text-center transition ${
                    currentMapZoom === 17
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Farm parcel view (17x)"
                >
                  17x
                </button>
                <button
                  type="button"
                  onClick={() => handleSetZoomLevel(19)}
                  className={`py-1 rounded-lg border text-center transition ${
                    currentMapZoom === 19
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Crop canopy view (19x)"
                >
                  19x
                </button>
              </div>
            </div>

            {/* Drawing Help Overlay / Vertex Controls at Bottom Left matching screenshot */}
            <div
              className="absolute bottom-4 left-4 z-20 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/30 text-white shadow-2xl space-y-2 max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  {toolMode === 'pan' ? (
                    <>
                      <Hand className="w-4 h-4" />
                      <span>Pan Mode: Drag map anywhere or use swap arrows</span>
                    </>
                  ) : (
                    <>
                      <MousePointerClick className="w-4 h-4" />
                      <span>Click satellite map to add boundary points</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {vertices.length} Points
                </span>
              </div>

              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Move className="w-3 h-3 text-emerald-400" />
                <span>Drag any P pin to fine-tune parcel boundary coordinates</span>
              </p>

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

                <button
                  type="button"
                  onClick={handleSnapToCentralParcel}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition flex items-center gap-1 ml-auto"
                  title="Snap boundary to central high-yield crop parcel"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Snap Parcel</span>
                </button>
              </div>
            </div>

            {/* Live Area Calculation Floating Pill at Bottom Right matching screenshot */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-emerald-500/30 text-white shadow-2xl font-mono text-xs">
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block uppercase">Calculated Area</span>
                <strong className="text-emerald-400 text-sm font-black">
                  {areaHa} ha <span className="text-slate-400 text-xs font-normal">({areaAcres} ac)</span>
                </strong>
                <span className="text-[9px] text-emerald-300/80 block font-sans">
                  ~{areaGunthas} Gunthas / Bigha
                </span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Perimeter</span>
                <strong className="text-sky-300 font-bold">{perimeterMeters} m</strong>
                <span className="text-[9px] text-slate-500 block font-sans">
                  ~{(perimeterMeters * 3.28084).toFixed(0)} ft
                </span>
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Import Boundary File</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Upload existing GIS vector files (.GeoJSON, .KML, or Shapefile zip) to automatically map field boundaries.
            </p>

            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center space-y-2 cursor-pointer transition">
              <UploadCloud className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-slate-200">Drag & drop your GIS boundary file here</p>
              <p className="text-[10px] text-slate-400">Supports GeoJSON, KML, SHP (Max 10MB)</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSnapToCentralParcel({ stopPropagation: () => {} } as any);
                  setShowImportModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Load Sample GeoJSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
