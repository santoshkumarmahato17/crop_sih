import React from 'react';
import {
  Flame,
  Layers,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { HotspotTrendStatus } from '@/types/monitoring';

interface SpatialHotspotEvolutionCardProps {
  hotspotCode?: string;
  previousZones: string[];
  currentZones: string[];
  previousAreaHa: number;
  currentAreaHa: number;
  status: HotspotTrendStatus;
}

export const SpatialHotspotEvolutionCard: React.FC<SpatialHotspotEvolutionCardProps> = ({
  hotspotCode = 'HS-001 (Nashik North Corridor)',
  previousZones = ['Z17'],
  currentZones = ['Z16', 'Z17', 'Z18'],
  previousAreaHa = 1.2,
  currentAreaHa = 1.8,
  status = 'EXPANDING',
}) => {
  const deltaZones = currentZones.length - previousZones.length;
  const deltaArea = currentAreaHa - previousAreaHa;

  const getStatusBadge = () => {
    switch (status) {
      case 'EXPANDING':
        return {
          label: 'Hotspot Expanding',
          color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          desc: `Contagion expanded by +${deltaZones} zones (+${deltaArea.toFixed(1)} ha).`,
          icon: <TrendingUp className="w-4 h-4 text-rose-600" />,
        };
      case 'CONTRACTING':
        return {
          label: 'Hotspot Contracting',
          color: 'bg-agri-500/15 text-agri-700 dark:text-agri-300 border-agri-500/25',
          desc: `Infection footprint shrunk by ${Math.abs(deltaArea).toFixed(1)} ha.`,
          icon: <TrendingDown className="w-4 h-4 text-agri-600" />,
        };
      case 'RESOLVED':
        return {
          label: 'Hotspot Resolved',
          color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
          desc: 'All monitored zones are back below critical disease threshold.',
          icon: <CheckCircle2 className="w-4 h-4 text-sky-600" />,
        };
      default:
        return {
          label: 'Hotspot Stable',
          color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
          desc: 'Infection boundary remains contained within initial zones.',
          icon: <Layers className="w-4 h-4 text-blue-600" />,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-agri-100 dark:border-agri-700/25 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-agri-500/70 uppercase tracking-wider block">
              Geospatial Hotspot Tracking
            </span>
            <h3 className="text-sm font-black text-agri-900 dark:text-white">
              {hotspotCode}
            </h3>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm ${badge.color}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </span>
      </div>

      {/* Spatial Envelope Progression Visualizer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Initial Baseline Envelope */}
        <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 space-y-2">
          <span className="text-[10px] font-bold text-agri-500/70 uppercase tracking-wider block">
            Initial Hotspot Envelope (Day 1)
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {previousZones.map((z) => (
              <span
                key={z}
                className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs border border-amber-500/30"
              >
                Zone {z}
              </span>
            ))}
          </div>
          <span className="text-xs font-medium text-agri-500/70 block">
            Primary Area: <strong>{previousAreaHa} ha</strong>
          </span>
        </div>

        {/* Current Follow-up Envelope */}
        <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 space-y-2">
          <span className="text-[10px] font-bold text-agri-500/70 uppercase tracking-wider block">
            Follow-up Target Envelope (Today)
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {currentZones.map((z) => {
              const isNew = !previousZones.includes(z);
              return (
                <span
                  key={z}
                  className={`px-2.5 py-1 rounded-xl font-mono font-bold text-xs border ${
                    isNew
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  }`}
                >
                  Zone {z} {isNew ? '(+Spread)' : ''}
                </span>
              );
            })}
          </div>
          <span className="text-xs font-medium text-agri-500/70 block">
            Active Area: <strong>{currentAreaHa} ha</strong> ({deltaArea > 0 ? '+' : ''}
            {deltaArea.toFixed(1)} ha)
          </span>
        </div>
      </div>

      {/* Narrative Footer */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-agri-700 dark:text-agri-300 flex items-center gap-2 font-medium">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>{badge.desc}</span>
      </div>
    </div>
  );
};
