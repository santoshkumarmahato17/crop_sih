import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Undo, Trash2, Check, Sparkles, Layers, AlertCircle } from 'lucide-react';

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
  // Center around Pune Agricultural Belt by default
  const baseCenter: Point = { lng: 73.8530, lat: 18.5225 };
  const [points, setPoints] = useState<Point[]>([]);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [liveAreaHa, setLiveAreaHa] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Approximate geodesic polygon area calculator in hectares (WGS84 spherical formula)
  const calculateSphericalArea = (pts: Point[]): number => {
    if (pts.length < 3) return 0;
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6378137; // Earth's radius in meters
    let total = 0;

    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      const p1 = pts[i];
      const p2 = pts[j];
      total += rad(p2.lng - p1.lng) * (2 + Math.sin(rad(p1.lat)) + Math.sin(rad(p2.lat)));
    }
    const areaM2 = Math.abs((total * R * R) / 2.0);
    return Math.round((areaM2 / 10000.0) * 100) / 100;
  };

  useEffect(() => {
    if (initialPolygon && initialPolygon.length > 0 && initialPolygon[0].length >= 3) {
      const ring = initialPolygon[0];
      const loadedPts = ring.slice(0, -1).map(([lng, lat]) => ({ lng, lat }));
      setPoints(loadedPts);
      setIsClosed(true);
      const area = calculateSphericalArea(loadedPts);
      setLiveAreaHa(area);
    }
  }, [initialPolygon]);

  useEffect(() => {
    const area = calculateSphericalArea(points);
    setLiveAreaHa(area);

    if (points.length >= 3) {
      const closedCoords = [...points, points[0]].map((p) => [p.lng, p.lat]);
      const geojson = {
        type: 'Polygon',
        coordinates: [closedCoords],
      };
      onPolygonChange(geojson, area);
    } else {
      onPolygonChange(null, 0);
    }
  }, [points]);

  // Handle canvas click to add polygon vertex
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isClosed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel to relative lng/lat coordinate offset
    const scale = 0.00005;
    const newLng = Number((baseCenter.lng + (x - rect.width / 2) * scale).toFixed(6));
    const newLat = Number((baseCenter.lat - (y - rect.height / 2) * scale).toFixed(6));

    setPoints((prev) => [...prev, { lng: newLng, lat: newLat }]);
  };

  const handleClosePolygon = () => {
    if (points.length >= 3) {
      setIsClosed(true);
    }
  };

  const handleReset = () => {
    setPoints([]);
    setIsClosed(false);
    setLiveAreaHa(0);
  };

  const handleUndo = () => {
    setPoints((prev) => prev.slice(0, -1));
    setIsClosed(false);
  };

  const loadPresetDemoPolygon = () => {
    const demo: Point[] = [
      { lng: 73.8500, lat: 18.5200 },
      { lng: 73.8560, lat: 18.5200 },
      { lng: 73.8560, lat: 18.5250 },
      { lng: 73.8500, lat: 18.5250 },
    ];
    setPoints(demo);
    setIsClosed(true);
  };

  return (
    <div className="space-y-3">
      {/* Map Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-agri-300 font-medium">
            <MapPin className="w-4 h-4 text-agri-400" />
            <span>Boundary Coordinates ({points.length} vertices)</span>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-agri-500/10 border border-agri-500/25 text-agri-400 font-mono font-semibold">
            Live Area: {liveAreaHa.toFixed(2)} ha (~{(liveAreaHa * 2.47105).toFixed(2)} acres)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPresetDemoPolygon}
            className="px-2.5 py-1 rounded-lg bg-agri-800 hover:bg-slate-700 text-agri-300 transition flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Demo Polygon</span>
          </button>

          {points.length >= 3 && !isClosed && (
            <button
              type="button"
              onClick={handleClosePolygon}
              className="px-3 py-1 rounded-lg bg-agri-500 hover:bg-agri-500 text-white font-medium transition flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Complete Boundary</span>
            </button>
          )}

          {points.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleUndo}
                className="p-1.5 rounded-lg bg-agri-800 hover:bg-slate-700 text-agri-300 transition"
                title="Undo last vertex"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                title="Clear boundary"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Interactive Map Drawing Canvas */}
      <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* Map Center Coordinates Overlay */}
        <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md bg-agri-900/60 border border-slate-800 text-[10px] font-mono text-agri-400/70">
          Center: {baseCenter.lat.toFixed(4)}° N, {baseCenter.lng.toFixed(4)}° E (SRID 4326)
        </div>

        {/* Instruction Banner */}
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-agri-900/60 border border-slate-800 text-xs text-agri-300 backdrop-blur flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-agri-400" />
          <span>
            {isClosed
              ? 'Boundary closed and validated. Click "Load Demo Polygon" or "Clear" to modify.'
              : 'Click on the map to place polygon vertices. Add at least 3 points to enclose plot.'}
          </span>
        </div>

        {/* SVG Drawing Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {points.length >= 2 && (
            <polygon
              points={points
                .map((p) => {
                  const scale = 0.00005;
                  const x = 350 + (p.lng - baseCenter.lng) / scale;
                  const y = 160 - (p.lat - baseCenter.lat) / scale;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="rgba(34, 197, 94, 0.18)"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeDasharray={isClosed ? 'none' : '4 4'}
            />
          )}

          {points.map((p, idx) => {
            const scale = 0.00005;
            const x = 350 + (p.lng - baseCenter.lng) / scale;
            const y = 160 - (p.lat - baseCenter.lat) / scale;
            return (
              <g key={idx}>
                <circle cx={x} cy={y} r="6" fill="#22c55e" stroke="#0f172a" strokeWidth="2" />
                <text x={x + 8} y={y + 4} fill="#86efac" fontSize="10" fontFamily="monospace">
                  P{idx + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Interactive Click Capture Canvas */}
        <canvas
          ref={canvasRef}
          width={700}
          height={320}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      {points.length > 0 && points.length < 3 && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Add at least {3 - points.length} more point(s) to form a closed agricultural polygon.</span>
        </div>
      )}
    </div>
  );
};
