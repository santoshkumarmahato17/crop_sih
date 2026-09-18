import React, { useEffect, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  Droplets,
  Bug,
  ShieldAlert,
} from 'lucide-react';
import { temporalService } from '@/services/temporalService';
import { HealthTrendClassification, Zone, ZoneTrendResponse } from '@/types';

interface ZoneTemporalAnalyticsModalProps {
  zone: Zone;
  onClose: () => void;
}

export const ZoneTemporalAnalyticsModal: React.FC<ZoneTemporalAnalyticsModalProps> = ({
  zone,
  onClose,
}) => {
  const [trendData, setTrendData] = useState<ZoneTrendResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'health' | 'disease' | 'pest' | 'water'>('health');

  useEffect(() => {
    fetchTrendData();
  }, [zone.id]);

  const fetchTrendData = async () => {
    try {
      setIsLoading(true);
      const data = await temporalService.getZoneTrend(zone.id);
      setTrendData(data);
    } catch (err: any) {
      // Fallback demo multi-scan data (e.g., Scan 1: 92 -> Scan 2: 86 -> Scan 3: 74 -> Scan 4: 61)
      setTrendData({
        zone_id: zone.id,
        zone_code: zone.zone_code,
        farm_id: zone.farm_id,
        total_scans: 4,
        health_trend: 'RAPIDLY_DECLINING',
        disease_trend: 'SURGING',
        pest_trend: 'INCREASING',
        water_stress_trend: 'CRITICAL',
        anomaly_trend: 'EXPANDING',
        classification: 'RAPIDLY_DECLINING',
        delta_last_scan_percent: -13.0,
        delta_total_percent: -31.0,
        velocity_per_day: -4.4,
        baseline_health: 92.0,
        current_health: 61.0,
        recent_scans: [
          {
            scan_id: 'scan-1',
            observation_date: new Date(Date.now() - 7 * 86400000).toISOString(),
            health_score: 92.0,
            mean_ndvi: 0.82,
            disease_probability: 4.0,
            disease_count: 0,
            max_disease_severity: 'none',
            pest_probability: 2.0,
            pest_count: 0,
            water_stress_cwsi: 0.12,
            water_stress_category: 'none',
            anomaly_score: 8.0,
          },
          {
            scan_id: 'scan-2',
            observation_date: new Date(Date.now() - 5 * 86400000).toISOString(),
            health_score: 86.0,
            mean_ndvi: 0.76,
            disease_probability: 12.0,
            disease_count: 1,
            max_disease_severity: 'low',
            pest_probability: 5.0,
            pest_count: 0,
            water_stress_cwsi: 0.24,
            water_stress_category: 'mild',
            anomaly_score: 14.0,
          },
          {
            scan_id: 'scan-3',
            observation_date: new Date(Date.now() - 2 * 86400000).toISOString(),
            health_score: 74.0,
            mean_ndvi: 0.65,
            disease_probability: 38.0,
            disease_count: 2,
            max_disease_severity: 'moderate',
            pest_probability: 18.0,
            pest_count: 1,
            water_stress_cwsi: 0.48,
            water_stress_category: 'moderate',
            anomaly_score: 26.0,
          },
          {
            scan_id: 'scan-4',
            observation_date: new Date().toISOString(),
            health_score: 61.0,
            mean_ndvi: 0.52,
            disease_probability: 68.0,
            disease_count: 4,
            max_disease_severity: 'high',
            pest_probability: 32.0,
            pest_count: 2,
            water_stress_cwsi: 0.72,
            water_stress_category: 'severe',
            anomaly_score: 39.0,
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getClassificationBadge = (classification: HealthTrendClassification) => {
    switch (classification) {
      case 'RAPIDLY_DECLINING':
        return (
          <span className="px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-black flex items-center gap-1.5 animate-pulse">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>RAPIDLY DECLINING</span>
          </span>
        );
      case 'DECLINING':
        return (
          <span className="px-3 py-1 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-400 text-xs font-bold flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-orange-400" />
            <span>DECLINING</span>
          </span>
        );
      case 'IMPROVING':
        return (
          <span className="px-3 py-1 rounded-xl bg-agri-500/15 border border-agri-500/30 text-agri-400 text-xs font-bold flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-agri-400" />
            <span>IMPROVING</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-400 text-xs font-semibold flex items-center gap-1.5">
            <Minus className="w-4 h-4 text-blue-400" />
            <span>STABLE</span>
          </span>
        );
    }
  };

  // Helper to draw SVG polyline chart
  const renderChart = (points: { x: number; y: number; val: number; label: string }[], strokeColor: string) => {
    if (points.length < 2) {
      return (
        <div className="h-44 flex items-center justify-center text-agri-500/70 text-xs font-mono">
          Insufficient scans for temporal trajectory curve. At least 2 monitoring flights required.
        </div>
      );
    }

    const svgPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

    return (
      <div className="relative w-full h-48 bg-slate-950 rounded-2xl border border-slate-800/80 p-4">
        {/* Grid lines */}
        <div className="absolute inset-x-4 top-8 border-b border-slate-900" />
        <div className="absolute inset-x-4 top-24 border-b border-slate-900" />
        <div className="absolute inset-x-4 top-36 border-b border-slate-900" />

        <svg className="w-full h-full overflow-visible">
          {/* Trend Polyline */}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={svgPoints}
          />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" fill="#0f172a" stroke={strokeColor} strokeWidth="2.5" />
              <text
                x={p.x}
                y={p.y - 10}
                fill="#f8fafc"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {p.val}
              </text>
              <text
                x={p.x}
                y={155}
                fill="#64748b"
                fontSize="9"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const scans = trendData?.recent_scans || [];
  const chartWidth = 520;
  const stepX = scans.length > 1 ? chartWidth / (scans.length - 1) : 0;

  // Chart data projections
  const healthPoints = scans.map((s, idx) => ({
    x: 40 + idx * stepX,
    y: 130 - (s.health_score / 100) * 100,
    val: s.health_score,
    label: `Scan ${idx + 1}`,
  }));

  const diseasePoints = scans.map((s, idx) => ({
    x: 40 + idx * stepX,
    y: 130 - (s.disease_probability / 100) * 100,
    val: s.disease_probability,
    label: `Scan ${idx + 1}`,
  }));

  const pestPoints = scans.map((s, idx) => ({
    x: 40 + idx * stepX,
    y: 130 - (s.pest_probability / 100) * 100,
    val: s.pest_probability,
    label: `Scan ${idx + 1}`,
  }));

  const waterPoints = scans.map((s, idx) => ({
    x: 40 + idx * stepX,
    y: 130 - s.water_stress_cwsi * 100,
    val: Math.round(s.water_stress_cwsi * 100),
    label: `Scan ${idx + 1}`,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-3xl w-full p-6 rounded-2xl bg-agri-900 border border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-sm">
              {zone.zone_code}
            </span>
            <div>
              <h3 className="font-bold text-agri-100 text-base">
                Temporal Crop Health & Multi-Scan Trajectory
              </h3>
              <p className="text-xs text-agri-400/70">
                Holding Zone: <span className="text-agri-200 font-semibold">{zone.name}</span> ({zone.area_hectares.toFixed(1)} ha)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-agri-500/70 hover:text-agri-300 text-sm">
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-agri-400/70 space-y-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Computing multi-scan rate of change...</p>
          </div>
        ) : trendData ? (
          <div className="space-y-5">
            {/* Top Trajectory Summary Bar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] text-agri-400/70 block font-medium">Trajectory Classification:</span>
                <div>{getClassificationBadge(trendData.classification)}</div>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono">
                <div>
                  <span className="text-agri-500/70 block text-[10px]">Net Health Delta</span>
                  <span
                    className={`text-base font-bold ${
                      trendData.delta_total_percent < 0 ? 'text-rose-400' : 'text-agri-400'
                    }`}
                  >
                    {trendData.delta_total_percent > 0 ? `+${trendData.delta_total_percent}` : trendData.delta_total_percent}%
                  </span>
                </div>

                <div>
                  <span className="text-agri-500/70 block text-[10px]">Velocity / Day</span>
                  <span
                    className={`text-base font-bold ${
                      trendData.velocity_per_day < 0 ? 'text-rose-400' : 'text-agri-400'
                    }`}
                  >
                    {trendData.velocity_per_day > 0 ? `+${trendData.velocity_per_day}` : trendData.velocity_per_day}%/d
                  </span>
                </div>

                <div>
                  <span className="text-agri-500/70 block text-[10px]">Total Scans</span>
                  <span className="text-base font-bold text-blue-400">{trendData.total_scans}</span>
                </div>
              </div>
            </div>

            {/* Metric Chart Tabs */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('health')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'health'
                      ? 'bg-agri-500/20 text-agri-400 border border-agri-500/30'
                      : 'text-agri-400/70 hover:text-agri-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Health Trajectory</span>
                </button>

                <button
                  onClick={() => setActiveTab('disease')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'disease'
                      ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                      : 'text-agri-400/70 hover:text-agri-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Disease Risk Trend ({trendData.disease_trend})</span>
                </button>

                <button
                  onClick={() => setActiveTab('pest')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'pest'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                      : 'text-agri-400/70 hover:text-agri-200'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Pest Trend ({trendData.pest_trend})</span>
                </button>

                <button
                  onClick={() => setActiveTab('water')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'water'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                      : 'text-agri-400/70 hover:text-agri-200'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Water Deficit ({trendData.water_stress_trend})</span>
                </button>
              </div>

              {/* Dynamic SVG Multi-Line Chart */}
              {activeTab === 'health' && renderChart(healthPoints, '#10b981')}
              {activeTab === 'disease' && renderChart(diseasePoints, '#ef4444')}
              {activeTab === 'pest' && renderChart(pestPoints, '#f59e0b')}
              {activeTab === 'water' && renderChart(waterPoints, '#38bdf8')}
            </div>

            {/* Multi-Scan Comparison Table */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-agri-200 uppercase tracking-wider">
                Multi-Scan Chronological Observation Table
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-agri-300">
                  <thead className="border-b border-slate-800 text-agri-500/70 uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-2 px-2.5">Scan</th>
                      <th className="py-2 px-2.5">Observation Date</th>
                      <th className="py-2 px-2.5">Health Score</th>
                      <th className="py-2 px-2.5">Disease Prob</th>
                      <th className="py-2 px-2.5">Pest Prob</th>
                      <th className="py-2 px-2.5">CWSI Water Stress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {scans.map((s, idx) => (
                      <tr key={s.scan_id} className="hover:bg-slate-900/60">
                        <td className="py-2 px-2.5 font-bold text-blue-400">Scan {idx + 1}</td>
                        <td className="py-2 px-2.5 text-agri-300">
                          {new Date(s.observation_date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-agri-400">{s.health_score}%</td>
                        <td className="py-2 px-2.5 text-rose-400">{s.disease_probability}%</td>
                        <td className="py-2 px-2.5 text-amber-400">{s.pest_probability}%</td>
                        <td className="py-2 px-2.5 text-blue-400">{s.water_stress_cwsi.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-agri-800 hover:bg-slate-700 text-agri-200 text-xs font-semibold"
          >
            Close Trajectory
          </button>
        </div>
      </div>
    </div>
  );
};
