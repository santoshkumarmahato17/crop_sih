import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Droplets,
  Layers,
} from 'lucide-react';
import { ZoneTrendData } from '@/types/monitoring';

interface HealthTimeSeriesChartProps {
  trendData: ZoneTrendData;
}

export const HealthTimeSeriesChart: React.FC<HealthTimeSeriesChartProps> = ({ trendData }) => {
  const [activeMetric, setActiveMetric] = useState<
    'health' | 'disease' | 'pest' | 'water' | 'area'
  >('health');

  const points = trendData.data_points || [];

  if (points.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 text-xs text-agri-400/70">
        No time-series observation data recorded for this zone yet.
      </div>
    );
  }

  // Extract values based on active metric
  const getMetricData = () => {
    switch (activeMetric) {
      case 'disease':
        return {
          title: 'Disease Pathology Risk (%)',
          color: '#f43f5e',
          values: points.map((p) => p.disease_risk),
          unit: '%',
          maxY: 100,
        };
      case 'pest':
        return {
          title: 'Pest Infestation Pressure (%)',
          color: '#f59e0b',
          values: points.map((p) => p.pest_risk),
          unit: '%',
          maxY: 100,
        };
      case 'water':
        return {
          title: 'CWSI Water Stress Index',
          color: '#0284c7',
          values: points.map((p) => p.water_stress * 100),
          unit: '%',
          maxY: 100,
        };
      case 'area':
        return {
          title: 'Affected Surface Area (Hectares)',
          color: '#a855f7',
          values: points.map((p) => p.affected_area_ha),
          unit: ' ha',
          maxY: Math.max(...points.map((p) => p.affected_area_ha), 2.5),
        };
      default:
        return {
          title: 'Canopy Vitality (Health Score)',
          color: '#10b981',
          values: points.map((p) => p.health_score),
          unit: '/100',
          maxY: 100,
        };
    }
  };

  const metric = getMetricData();
  const width = 580;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Build SVG Path
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(points.length - 1, 1)) * chartW;
    const val = metric.values[idx];
    const y = paddingY + chartH - (val / metric.maxY) * chartH;
    return { x, y, val, timestamp: p.timestamp };
  });

  const pathD = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${
    paddingY + chartH
  } L ${coords[0].x} ${paddingY + chartH} Z`;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 shadow-xl space-y-4">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-agri-100 dark:border-agri-700/25 pb-4">
        <div>
          <span className="text-[10px] font-bold text-agri-500/70 uppercase tracking-wider block">
            {trendData.zone_name} • Historical Telemetry
          </span>
          <h3 className="text-base font-black text-agri-900 dark:text-white">
            {metric.title}
          </h3>
        </div>

        {/* Metric Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-agri-50 dark:bg-surface-darkBg p-1 rounded-2xl border border-agri-200/50 dark:border-agri-700/25">
          <button
            type="button"
            onClick={() => setActiveMetric('health')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
              activeMetric === 'health'
                ? 'bg-agri-500 text-white shadow-sm'
                : 'text-agri-600 dark:text-agri-400/70 hover:text-agri-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Health</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('disease')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
              activeMetric === 'disease'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-agri-600 dark:text-agri-400/70 hover:text-agri-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Disease</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('water')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
              activeMetric === 'water'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-agri-600 dark:text-agri-400/70 hover:text-agri-900 dark:hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('area')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
              activeMetric === 'area'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-agri-600 dark:text-agri-400/70 hover:text-agri-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Area</span>
          </button>
        </div>
      </div>

      {/* SVG Time-Series Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 overflow-visible"
        >
          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
            const y = paddingY + chartH * (1 - frac);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-agri-100 dark:text-agri-800"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 font-mono"
                >
                  {(frac * metric.maxY).toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area Gradient Fill */}
          <defs>
            <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metric.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={metric.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaD} fill={`url(#grad-${activeMetric})`} />

          {/* Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke={metric.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Observation Data Points */}
          {coords.map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#ffffff"
                stroke={metric.color}
                strokeWidth="2.5"
              />
              {/* Value label */}
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                className="text-[10px] font-mono font-bold fill-slate-700 dark:fill-slate-200"
              >
                {pt.val}
                {metric.unit}
              </text>
              {/* Timestamp label */}
              <text
                x={pt.x}
                y={height - 5}
                textAnchor="middle"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {pt.timestamp}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
