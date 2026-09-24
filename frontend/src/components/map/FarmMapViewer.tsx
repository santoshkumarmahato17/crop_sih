import React, { useEffect, useRef } from 'react';
import { MapPin, Info } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GeoJSONGeometry, Zone } from '@/types';

interface FarmMapViewerProps {
  boundary?: GeoJSONGeometry;
  centerPoint?: GeoJSONGeometry;
  totalHectares: number;
  farmName: string;
  zones?: Zone[];
  selectedZoneId?: string | null;
  onZoneSelect?: (zone: Zone) => void;
}

export const FarmMapViewer: React.FC<FarmMapViewerProps> = ({
  boundary,
  totalHectares,
  farmName,
  zones = [],
  selectedZoneId,
  onZoneSelect,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  // Fallback to Pune coordinates if not provided
  const baseCenter = { lng: 73.8530, lat: 18.5225 };

  const getStatusColor = (status: string, isSelected: boolean) => {
    if (isSelected) {
      return { fill: 'rgba(56, 189, 248, 0.45)', stroke: '#38bdf8' };
    }
    switch (status.toLowerCase()) {
      case 'healthy':
        return { fill: 'rgba(16, 185, 129, 0.35)', stroke: '#10b981' };
      case 'moderate_concern':
        return { fill: 'rgba(234, 179, 8, 0.4)', stroke: '#eab308' };
      case 'high_concern':
        return { fill: 'rgba(249, 115, 22, 0.45)', stroke: '#f97316' };
      case 'critical':
        return { fill: 'rgba(239, 68, 68, 0.5)', stroke: '#ef4444' };
      default:
        return { fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981' };
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_API_KEY;

    let centerLng = baseCenter.lng;
    let centerLat = baseCenter.lat;

    if (boundary && boundary.coordinates && boundary.type === 'Polygon') {
      const coords = boundary.coordinates[0];
      if (coords && coords.length > 0) {
        centerLng = coords[0][0];
        centerLat = coords[0][1];
      }
    }

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
      center: [centerLng, centerLat],
      zoom: 16, // zoomed in to see the field
      interactive: true,
    });

    map.current.on('load', () => {
      // Add farm boundary
      if (boundary) {
        map.current?.addSource('farm-boundary', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: boundary,
            properties: {}
          }
        });
        map.current?.addLayer({
          id: 'farm-boundary-line',
          type: 'line',
          source: 'farm-boundary',
          paint: {
            'line-color': '#94a3b8',
            'line-width': 2,
            'line-dasharray': [4, 4]
          }
        });
      }

      // Add zones
      const features = zones.map(zone => {
        const isSelected = selectedZoneId === zone.id;
        const style = getStatusColor(zone.health_status, isSelected);
        return {
          type: 'Feature',
          geometry: zone.boundary,
          properties: {
            id: zone.id,
            zone_code: zone.zone_code,
            fillColor: style.fill,
            strokeColor: style.stroke,
            isSelected
          }
        };
      });

      map.current?.addSource('zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features as any
        }
      });

      map.current?.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': 1
        }
      });

      map.current?.addLayer({
        id: 'zones-line',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': ['get', 'strokeColor'],
          'line-width': ['case', ['boolean', ['get', 'isSelected'], false], 3, 2]
        }
      });

      // Add text label for zones
      map.current?.addLayer({
        id: 'zones-labels',
        type: 'symbol',
        source: 'zones',
        layout: {
          'text-field': ['get', 'zone_code'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] // Standard fallback
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1.5
        }
      });

      // Add click handler for zones
      map.current?.on('click', 'zones-fill', (e) => {
        if (e.features && e.features.length > 0 && onZoneSelect) {
          const clickedId = e.features[0].properties.id;
          const zone = zones.find(z => z.id === clickedId);
          if (zone) onZoneSelect(zone);
        }
      });
      
      // Change cursor
      map.current?.on('mouseenter', 'zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current?.on('mouseleave', 'zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [boundary]); // Initialize once per farm boundary

  // Update styles and selections dynamically without full reload
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    
    const features = zones.map(zone => {
      const isSelected = selectedZoneId === zone.id;
      const style = getStatusColor(zone.health_status, isSelected);
      return {
        type: 'Feature',
        geometry: zone.boundary,
        properties: {
          id: zone.id,
          zone_code: zone.zone_code,
          fillColor: style.fill,
          strokeColor: style.stroke,
          isSelected
        }
      };
    });

    const source = map.current.getSource('zones') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: features as any
      });
    }
  }, [zones, selectedZoneId]);

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl select-none">
      {/* Container for MapLibre */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Top Left Farm Info Header */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-agri-200 backdrop-blur shadow-md">
        <MapPin className="w-3.5 h-3.5 text-agri-400" />
        <span className="font-semibold">{farmName}</span>
        <span className="text-agri-500/70">|</span>
        <span className="text-agri-400 font-mono font-medium">{totalHectares.toFixed(2)} ha</span>
        {zones.length > 0 && (
          <>
            <span className="text-agri-500/70">|</span>
            <span className="text-blue-400 font-mono font-medium">{zones.length} Subdivided Zones</span>
          </>
        )}
      </div>

      {/* Status Color Legend */}
      <div className="absolute top-3 right-3 z-10 hidden sm:flex flex-col gap-1 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-agri-300 backdrop-blur shadow-md">
        <div className="text-agri-400/70 font-semibold mb-1">Disease Infection Map:</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 opacity-60 inline-block border border-emerald-500" />
            <span>Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-60 inline-block border border-yellow-500" />
            <span>Early Stress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 opacity-60 inline-block border border-orange-500" />
            <span>Infected (High)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 opacity-60 inline-block border border-rose-500" />
            <span>Critical Spread</span>
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md bg-agri-900/80 border border-slate-800 text-[10px] font-mono text-agri-400/90 flex items-center gap-1.5 backdrop-blur">
        <Info className="w-3 h-3 text-agri-400" />
        <span>Click any colored zone (red/orange indicates disease) to inspect telemetry</span>
      </div>
    </div>
  );
};
