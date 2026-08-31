import React from 'react';
import { MapPin, Info } from 'lucide-react';
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
  // Parse farm boundary coordinates
  let farmCoords: [number, number][] = [];
  if (boundary && boundary.coordinates) {
    if (boundary.type === 'Polygon' && boundary.coordinates.length > 0) {
      farmCoords = boundary.coordinates[0];
    } else if (boundary.type === 'MultiPolygon' && boundary.coordinates.length > 0) {
      farmCoords = boundary.coordinates[0][0];
    }
  }

  // Calculate local SVG scaling
  const baseCenter = { lng: 73.8530, lat: 18.5225 };
  const scale = 0.00005;

  const getStatusColor = (status: string, isSelected: boolean) => {
    if (isSelected) {
      return {
        fill: 'rgba(56, 189, 248, 0.45)',
        stroke: '#38bdf8',
        strokeWidth: '3.5',
      };
    }

    switch (status.toLowerCase()) {
      case 'healthy':
        return {
          fill: 'rgba(16, 185, 129, 0.25)',
          stroke: '#10b981',
          strokeWidth: '2',
        };
      case 'moderate_concern':
        return {
          fill: 'rgba(234, 179, 8, 0.3)',
          stroke: '#eab308',
          strokeWidth: '2',
        };
      case 'high_concern':
        return {
          fill: 'rgba(249, 115, 22, 0.35)',
          stroke: '#f97316',
          strokeWidth: '2',
        };
      case 'critical':
        return {
          fill: 'rgba(239, 68, 68, 0.4)',
          stroke: '#ef4444',
          strokeWidth: '2.5',
        };
      default:
        return {
          fill: 'rgba(16, 185, 129, 0.2)',
          stroke: '#10b981',
          strokeWidth: '1.5',
        };
    }
  };

  return (
    <div className="relative w-full h-96 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl select-none">
      {/* Background Topographic Matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

      {/* Top Left Farm Info Header */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 backdrop-blur shadow-md">
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold">{farmName}</span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400 font-mono font-medium">{totalHectares.toFixed(2)} ha</span>
        {zones.length > 0 && (
          <>
            <span className="text-slate-500">|</span>
            <span className="text-blue-400 font-mono font-medium">{zones.length} Subdivided Zones</span>
          </>
        )}
      </div>

      {/* Status Color Legend */}
      <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 backdrop-blur shadow-md">
        <span className="text-slate-400 font-medium">Zone Health:</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Healthy</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span>Critical</span>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
        <Info className="w-3 h-3 text-emerald-400" />
        <span>Click any zone to inspect detailed telemetry & risk indicators</span>
      </div>

      {/* SVG Spatial Render Layer */}
      <svg className="w-full h-full">
        {/* Parent Farm Outer Boundary (Dashed Guide) */}
        {farmCoords.length >= 3 && (
          <polygon
            points={farmCoords
              .map(([lng, lat]) => {
                const x = 350 + (lng - baseCenter.lng) / scale;
                const y = 180 - (lat - baseCenter.lat) / scale;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        )}

        {/* Subdivided Farm Zones */}
        {zones.map((zone) => {
          let coords: [number, number][] = [];
          if (zone.boundary && zone.boundary.coordinates) {
            if (zone.boundary.type === 'Polygon' && zone.boundary.coordinates.length > 0) {
              coords = zone.boundary.coordinates[0];
            } else if (zone.boundary.type === 'MultiPolygon' && zone.boundary.coordinates.length > 0) {
              coords = zone.boundary.coordinates[0][0];
            }
          }

          if (coords.length < 3) return null;

          const isSelected = selectedZoneId === zone.id;
          const style = getStatusColor(zone.health_status, isSelected);

          // Centroid calculation for text label
          const centroidLng = zone.centroid?.coordinates?.[0] || coords[0][0];
          const centroidLat = zone.centroid?.coordinates?.[1] || coords[0][1];
          const labelX = 350 + (centroidLng - baseCenter.lng) / scale;
          const labelY = 180 - (centroidLat - baseCenter.lat) / scale;

          return (
            <g
              key={zone.id}
              onClick={() => onZoneSelect && onZoneSelect(zone)}
              className="cursor-pointer transition hover:opacity-90"
            >
              <polygon
                points={coords
                  .map(([lng, lat]) => {
                    const x = 350 + (lng - baseCenter.lng) / scale;
                    const y = 180 - (lat - baseCenter.lat) / scale;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
              />

              {/* Zone Code Label Badge */}
              <rect
                x={labelX - 18}
                y={labelY - 10}
                width={36}
                height={20}
                rx={5}
                fill="#0f172a"
                stroke={style.stroke}
                strokeWidth="1.5"
              />
              <text
                x={labelX}
                y={labelY + 4}
                fill={isSelected ? '#38bdf8' : '#f8fafc'}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {zone.zone_code}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
