import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
export interface FarmPolygonZone {
  id: string;
  name: string;
  crop: string;
  areaHa: number;
  healthStatus: 'HEALTHY' | 'MODERATE_STRESS' | 'HIGH_RISK' | 'CRITICAL';
  polygonPoints: [number, number][]; // Assuming tuples of [x, y]
}
interface MaplibreGISViewerProps {
  zones: FarmPolygonZone[];
  selectedZoneId?: string;
  onZoneClick?: (zoneId: string) => void;
}

export const MaplibreGISViewer: React.FC<MaplibreGISViewerProps> = ({
  zones,
  selectedZoneId,
  onZoneClick,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // We will use a public satellite tile provider (Esri World Imagery)
  const SATELLITE_STYLE = {
    version: 8 as const,
    sources: {
      'google-satellite': {
        type: 'raster' as const,
        tiles: [
          'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        ],
        tileSize: 256,
        attribution: 'Map data © Google',
      },
    },
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster' as const,
        source: 'google-satellite',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Center on Dindori by default
    const initialCenter = [73.842, 20.2185] as [number, number];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: SATELLITE_STYLE,
      center: initialCenter,
      zoom: 16,
      pitch: 45,
      bearing: -17.6,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add a source for our polygons
      map.current.addSource('farm-parcels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Add fill layer
      map.current.addLayer({
        id: 'parcel-fills',
        type: 'fill',
        source: 'farm-parcels',
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.6, 0.4],
        },
      });

      // Add outline layer
      map.current.addLayer({
        id: 'parcel-borders',
        type: 'line',
        source: 'farm-parcels',
        paint: {
          'line-color': ['get', 'borderColor'],
          'line-width': 3,
        },
      });

      // Hover effect logic
      let hoveredStateId: string | null = null;
      map.current.on('mousemove', 'parcel-fills', (e) => {
        if (!map.current || !e.features || e.features.length === 0) return;
        if (e.features[0].id) {
          if (hoveredStateId) {
            map.current.setFeatureState({ source: 'farm-parcels', id: hoveredStateId }, { hover: false });
          }
          hoveredStateId = e.features[0].id as string;
          map.current.setFeatureState({ source: 'farm-parcels', id: hoveredStateId }, { hover: true });
        }
      });
      map.current.on('mouseleave', 'parcel-fills', () => {
        if (!map.current || !hoveredStateId) return;
        map.current.setFeatureState({ source: 'farm-parcels', id: hoveredStateId }, { hover: false });
        hoveredStateId = null;
      });

      // Click event
      map.current.on('click', 'parcel-fills', (e) => {
        if (e.features && e.features.length > 0 && onZoneClick) {
          onZoneClick(e.features[0].properties.id);
        }
      });

      renderZones();
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      map.current?.remove();
    };
  }, []); // Run once on mount

  const renderZones = () => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Convert our pixel/percentage points to geographic coordinates for demonstration
    // In a real app, FarmPolygonZone would have real geojson
    const features = zones.map((zone) => {
      // Simulate real geo-coordinates around the center based on polygonPoints
      // Assuming polygonPoints are percentage offsets from top-left, we'll map them around lat/lng
      const baseLat = 20.2185;
      const baseLng = 73.8420;
      const geoPoints = zone.polygonPoints.map((p: [number, number]) => {
        const dx = (p[0] - 50) * 0.00005; // rough scaling
        const dy = (50 - p[1]) * 0.00005; 
        return [baseLng + dx, baseLat + dy];
      });
      // Close the polygon
      geoPoints.push(geoPoints[0]);

      let color = '#10b981'; // Healthy green
      if (zone.healthStatus === 'MODERATE_STRESS') color = '#f59e0b';
      if (zone.healthStatus === 'HIGH_RISK') color = '#ef4444';
      if (zone.healthStatus === 'CRITICAL') color = '#991b1b';

      return {
        type: 'Feature' as const,
        id: zone.id,
        properties: {
          id: zone.id,
          name: zone.name,
          fillColor: color,
          borderColor: color,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [geoPoints],
        },
      };
    });

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    const source = map.current.getSource('farm-parcels') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(geojsonData);
    }

    // Update custom HTML markers for labels
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    zones.forEach((zone) => {
      const el = document.createElement('div');
      el.className = 'px-2 py-1 rounded-md shadow-lg font-bold text-xs pointer-events-none transition-transform ' +
        (zone.id === selectedZoneId 
          ? 'bg-emerald-600 text-white scale-110 z-10' 
          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 opacity-90');
      
      let cropEmoji = '🌿';
      if (zone.crop.includes('Cotton')) cropEmoji = '☁️';
      if (zone.crop.includes('Grapes')) cropEmoji = '🍇';
      if (zone.crop.includes('Tomato')) cropEmoji = '🍅';
      if (zone.crop.includes('Corn') || zone.crop.includes('Maize')) cropEmoji = '🌽';
      
      el.innerHTML = `<div class="flex items-center space-x-1"><span>${cropEmoji}</span><span>${zone.name.split(' ')[0]}</span></div><div class="text-[10px] text-slate-500 dark:text-slate-400 font-normal">${zone.areaHa} ha</div>`;

      // Find center of polygon to place marker
      const markerLng = 73.8420 + ((zone.polygonPoints[0][0] - 50) * 0.00005);
      const markerLat = 20.2185 + ((50 - zone.polygonPoints[0][1]) * 0.00005);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([markerLng, markerLat])
        .addTo(map.current!);
      
      markersRef.current.push(marker);
    });
  };

  // Update on zones or selectedZoneId change
  useEffect(() => {
    renderZones();
    
    // Recenter map on selected zone if there is one
    if (selectedZoneId && map.current && map.current.isStyleLoaded()) {
      const zone = zones.find(z => z.id === selectedZoneId);
      if (zone) {
        const markerLng = 73.8420 + ((zone.polygonPoints[0][0] - 50) * 0.00005);
        const markerLat = 20.2185 + ((50 - zone.polygonPoints[0][1]) * 0.00005);
        map.current.flyTo({ center: [markerLng, markerLat], zoom: 17, speed: 1.2 });
      }
    }
  }, [zones, selectedZoneId]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      {/* Floating Toolbar inside Map */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-1 flex">
          <button className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700">Manual</button>
          <button className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">Satellite</button>
        </div>
      </div>
      
      {/* Floating Weather Widget with ASInsight branding */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-4 w-48">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weather</span>
            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">ASInsight</span>
          </div>
          <div className="flex items-end space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">26°</span>
            <span className="text-sm font-medium text-slate-500 pb-1">Sunny</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center space-x-1">
              <span className="opacity-70">Wind:</span>
              <span className="font-semibold">12 km/h</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="opacity-70">Hum:</span>
              <span className="font-semibold">45%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map Tagline */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-white/20">
          <p className="text-xs font-medium bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            ASInsight offers crop classification and spots hidden stress early from orbit.
          </p>
        </div>
      </div>
    </div>
  );
};
