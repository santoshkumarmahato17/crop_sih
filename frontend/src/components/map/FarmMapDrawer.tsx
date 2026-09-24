import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Undo, Trash2, Check, Sparkles, Layers, AlertCircle, Search } from 'lucide-react';

interface Point {
  lng: number;
  lat: number;
}

interface FarmMapDrawerProps {
  initialPolygon?: [number, number][][];
  onPolygonChange: (geojson: any, calculatedAreaHa: number) => void;
}

export const FarmMapDrawer: React.FC<FarmMapDrawerProps> = ({
  initialPolygon,
  onPolygonChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  const [points, setPoints] = useState<Point[]>([]);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [liveAreaHa, setLiveAreaHa] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Approximate geodesic polygon area calculator in hectares
  const calculateSphericalArea = (pts: Point[]): number => {
    if (pts.length < 3) return 0;
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6378137;
    let total = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      total += rad(pts[j].lng - pts[i].lng) * (2 + Math.sin(rad(pts[i].lat)) + Math.sin(rad(pts[j].lat)));
    }
    const areaM2 = Math.abs((total * R * R) / 2.0);
    return Math.round((areaM2 / 10000.0) * 100) / 100;
  };

  useEffect(() => {
    const area = calculateSphericalArea(points);
    setLiveAreaHa(area);
    if (points.length >= 3) {
      const closedCoords = [...points, points[0]].map((p) => [p.lng, p.lat]);
      onPolygonChange({ type: 'Polygon', coordinates: [closedCoords] }, area);
    } else {
      onPolygonChange(null, 0);
    }
  }, [points]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;
    
    const esriSatelliteStyle = {
      version: 8,
      sources: {
        'google-satellite': {
          type: 'raster',
          tiles: [
            'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
          ],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'google-satellite-layer',
          type: 'raster',
          source: 'google-satellite',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: googleSatelliteStyle as any,
      center: [76.0, 19.0], // Maharashtra center
      zoom: 6,
    });

    map.current.on('load', () => {
      map.current?.addSource('polygon', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current?.addLayer({
        id: 'polygon-fill',
        type: 'fill',
        source: 'polygon',
        paint: {
          'fill-color': '#2FA36B',
          'fill-opacity': 0.4,
        },
      });

      map.current?.addLayer({
        id: 'polygon-outline',
        type: 'line',
        source: 'polygon',
        paint: {
          'line-color': '#5CCFA0',
          'line-width': 3,
        },
      });
      
      map.current?.addSource('points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      
      map.current?.addLayer({
        id: 'points-layer',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': 6,
          'circle-color': '#5CCFA0',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        },
      });
    });

    const onClick = (e: maplibregl.MapMouseEvent) => {
      setIsClosed((closed) => {
        if (closed) return closed;
        setPoints((prev) => [...prev, { lng: e.lngLat.lng, lat: e.lngLat.lat }]);
        return closed;
      });
    };

    map.current.on('click', onClick);

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update map source when points change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('polygon') as maplibregl.GeoJSONSource;
    const pointsSource = map.current.getSource('points') as maplibregl.GeoJSONSource;
    
    if (source && pointsSource) {
      if (points.length >= 3) {
        const closedCoords = [...points, isClosed ? points[0] : points[points.length - 1]].map((p) => [p.lng, p.lat]);
        if (isClosed) {
           source.setData({
             type: 'FeatureCollection',
             features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [closedCoords] }, properties: {} }],
           });
        } else {
           source.setData({
             type: 'FeatureCollection',
             features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: points.map(p => [p.lng, p.lat]) }, properties: {} }],
           });
        }
      } else if (points.length > 0) {
        source.setData({
           type: 'FeatureCollection',
           features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: points.map(p => [p.lng, p.lat]) }, properties: {} }],
        });
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }

      pointsSource.setData({
        type: 'FeatureCollection',
        features: points.map(p => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: {}
        }))
      });
    }
  }, [points, isClosed]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;
    if (!MAPBOX_TOKEN) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=in`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        map.current?.flyTo({ center: [lng, lat], zoom: 14 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClosePolygon = () => { if (points.length >= 3) setIsClosed(true); };
  const handleReset = () => { setPoints([]); setIsClosed(false); setLiveAreaHa(0); };
  const handleUndo = () => { setPoints((prev) => prev.slice(0, -1)); setIsClosed(false); };
  const loadPresetPolygon = (presetIndex: number) => {
    const presets: { points: Point[], center: [number, number] }[] = [
      { // Preset 1
        points: [
          { lng: 73.8500, lat: 18.5200 },
          { lng: 73.8560, lat: 18.5200 },
          { lng: 73.8560, lat: 18.5250 },
          { lng: 73.8500, lat: 18.5250 },
        ],
        center: [73.8530, 18.5225]
      },
      { // Preset 2
        points: [
          { lng: 73.7850, lat: 19.9975 },
          { lng: 73.7920, lat: 19.9975 },
          { lng: 73.7900, lat: 20.0020 },
          { lng: 73.7830, lat: 20.0010 },
        ],
        center: [73.7875, 19.9995]
      },
      { // Preset 3
        points: [
          { lng: 75.9000, lat: 17.6500 },
          { lng: 75.9100, lat: 17.6520 },
          { lng: 75.9080, lat: 17.6580 },
          { lng: 75.8980, lat: 17.6550 },
        ],
        center: [75.9040, 17.6537]
      },
      { // Preset 4
        points: [
          { lng: 79.0800, lat: 21.1400 },
          { lng: 79.0850, lat: 21.1420 },
          { lng: 79.0830, lat: 21.1480 },
          { lng: 79.0780, lat: 21.1450 },
        ],
        center: [79.0815, 21.1437]
      }
    ];

    const preset = presets[presetIndex];
    setPoints(preset.points);
    setIsClosed(true);
    map.current?.flyTo({ center: preset.center, zoom: 14 });
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search for a location (e.g., Pune, Maharashtra)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg bg-white dark:bg-[#0D2729] border border-[#D4E8DF] dark:border-[#214A47] text-sm text-[#00695C] dark:text-[#8FE0C1] focus:outline-none focus:border-[#2FA36B]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2FA36B]" />
        </div>
        <button 
          type="submit" 
          disabled={isSearching}
          className="px-4 py-2 rounded-lg bg-[#087B62] text-white text-sm font-bold shadow-sm hover:bg-[#006B55] transition"
        >
          {isSearching ? 'Searching...' : 'Go'}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#F4FAF7] dark:bg-[#0D2729] border border-[#D4E8DF] dark:border-[#214A47] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#00695C] dark:text-[#8FE0C1] font-bold">
            <MapPin className="w-4 h-4 text-[#2FA36B] dark:text-[#5CCFA0]" />
            <span>Boundary ({points.length} vertices)</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-[#E8F5EF] dark:bg-[#123B35] border border-[#D4E8DF] dark:border-[#28504D] text-[#00695C] dark:text-[#8FE0C1] font-mono font-bold">
            Live Area: {liveAreaHa.toFixed(2)} ha (~{(liveAreaHa * 2.47105).toFixed(2)} acres)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => loadPresetPolygon(0)} className="px-3 py-1.5 rounded-[10px] bg-[#E8F5EF] dark:bg-[#123B35] hover:bg-[#D8ECE3] dark:hover:bg-[#1a4a43] border border-[#B9D8CA] dark:border-[#28504D] text-[#00695C] dark:text-[#8FE0C1] font-bold transition flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2FA36B]" /><span>Field 1</span>
          </button>
          <button type="button" onClick={() => loadPresetPolygon(1)} className="px-3 py-1.5 rounded-[10px] bg-[#E8F5EF] dark:bg-[#123B35] hover:bg-[#D8ECE3] dark:hover:bg-[#1a4a43] border border-[#B9D8CA] dark:border-[#28504D] text-[#00695C] dark:text-[#8FE0C1] font-bold transition flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2FA36B]" /><span>Field 2</span>
          </button>
          <button type="button" onClick={() => loadPresetPolygon(2)} className="px-3 py-1.5 rounded-[10px] bg-[#E8F5EF] dark:bg-[#123B35] hover:bg-[#D8ECE3] dark:hover:bg-[#1a4a43] border border-[#B9D8CA] dark:border-[#28504D] text-[#00695C] dark:text-[#8FE0C1] font-bold transition flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2FA36B]" /><span>Field 3</span>
          </button>
          <button type="button" onClick={() => loadPresetPolygon(3)} className="px-3 py-1.5 rounded-[10px] bg-[#E8F5EF] dark:bg-[#123B35] hover:bg-[#D8ECE3] dark:hover:bg-[#1a4a43] border border-[#B9D8CA] dark:border-[#28504D] text-[#00695C] dark:text-[#8FE0C1] font-bold transition flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2FA36B]" /><span>Field 4</span>
          </button>
          {points.length >= 3 && !isClosed && (
            <button type="button" onClick={handleClosePolygon} className="px-3.5 py-1.5 rounded-[10px] bg-[#087B62] text-white font-bold transition flex items-center gap-1 shadow-sm">
              <Check className="w-3.5 h-3.5" /><span>Complete</span>
            </button>
          )}
          {points.length > 0 && (
            <>
              <button type="button" onClick={handleUndo} className="p-1.5 rounded-lg border border-[#D4E8DF] dark:border-[#28504D] text-[#5F7775] transition" title="Undo"><Undo className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={handleReset} className="p-1.5 rounded-lg text-rose-600 border border-rose-200 transition" title="Clear"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      </div>

      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-[#D4E8DF] dark:border-[#28504D] shadow-inner">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-[#0D2729]/95 border border-[#D4E8DF] dark:border-[#28504D] text-xs text-[#00695C] dark:text-[#8FE0C1] font-semibold shadow-sm flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#2FA36B]" />
          <span>{isClosed ? 'Boundary closed. Click "Clear" to modify.' : 'Click map to place vertices.'}</span>
        </div>
      </div>

      {points.length > 0 && points.length < 3 && (
        <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>Add {3 - points.length} more point(s) to close polygon.</span>
        </div>
      )}
    </div>
  );
};
