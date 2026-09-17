import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  Layers,
  UserCheck,
} from 'lucide-react';
import { MonitoringComparison } from '@/types/monitoring';
import { useTranslation } from '@/i18n';

interface BeforeAfterComparisonCardProps {
  comparison: MonitoringComparison;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  onRequestExpertReview?: () => void;
}

export const BeforeAfterComparisonCard: React.FC<BeforeAfterComparisonCardProps> = ({
  comparison,
  beforeImageUrl = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
  afterImageUrl = 'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80',
  onRequestExpertReview,
}) => {
  const { t } = useTranslation();
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide'>('sideBySide');

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'IMPROVING':
        return {
          label: t('monitoring.improving'),
          icon: <TrendingUp className="w-4 h-4 text-agri-600" />,
          classes: 'bg-agri-500/15 text-agri-700 dark:text-agri-300 border-agri-500/25',
        };
      case 'WORSENING':
        return {
          label: t('monitoring.worsening'),
          icon: <TrendingDown className="w-4 h-4 text-rose-600" />,
          classes: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        };
      case 'SPREADING':
        return {
          label: t('monitoring.spreading'),
          icon: <Layers className="w-4 h-4 text-purple-600" />,
          classes: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
        };
      default:
        return {
          label: t('monitoring.stable'),
          icon: <Minus className="w-4 h-4 text-blue-600" />,
          classes: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
        };
    }
  };

  const trendBadge = getTrendBadge(comparison.trend);

  const getHotspotBadge = (status: string) => {
    switch (status) {
      case 'EXPANDING':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'CONTRACTING':
        return 'bg-agri-500/15 text-agri-700 dark:text-agri-300 border-agri-500/25';
      case 'RESOLVED':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
      default:
        return 'bg-slate-500/15 text-agri-700 dark:text-agri-300 border-slate-500/30';
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 shadow-xl overflow-hidden space-y-6">
      {/* ── Top Header ── */}
      <div className="p-5 border-b border-agri-100 dark:border-agri-700/25 bg-surface-light/60 dark:bg-agri-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm ${trendBadge.classes}`}
            >
              {trendBadge.icon}
              <span>{trendBadge.label}</span>
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${getHotspotBadge(
                comparison.hotspot_status
              )}`}
            >
              Hotspot {comparison.hotspot_status}
            </span>

            {comparison.is_escalated && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                {t('monitoring.escalationRequired')}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-agri-900 dark:text-white">
            Crop-Health Follow-up Comparison Matrix
          </h3>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-200 dark:bg-agri-800/50 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('sideBySide')}
            className={`px-3 py-1 rounded-lg transition ${
              viewMode === 'sideBySide'
                ? 'bg-white dark:bg-surface-darkCard text-agri-900 dark:text-white shadow-sm'
                : 'text-agri-600 dark:text-agri-400/70'
            }`}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1 rounded-lg transition ${
              viewMode === 'slider'
                ? 'bg-white dark:bg-surface-darkCard text-agri-900 dark:text-white shadow-sm'
                : 'text-agri-600 dark:text-agri-400/70'
            }`}
          >
            Split Slider
          </button>
        </div>
      </div>

      {/* ── Visual Imagery Comparison Area ── */}
      <div className="px-6">
        {viewMode === 'sideBySide' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BEFORE FRAME */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-agri-500/70">
                <span>BEFORE (Initial Scan)</span>
                <span className="font-mono text-agri-600">Health: {comparison.previous_health_score}%</span>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-agri-200/50 dark:border-agri-700/25 h-56 bg-slate-950 shadow-md">
                <img
                  src={beforeImageUrl}
                  alt="Previous State"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white font-mono text-[10px] font-bold">
                  Baseline Optical Scan
                </div>
              </div>
            </div>

            {/* AFTER FRAME */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-agri-500/70">
                <span>AFTER (Follow-up Observation)</span>
                <span
                  className={`font-mono ${
                    comparison.health_change < 0 ? 'text-rose-600' : 'text-agri-600'
                  }`}
                >
                  Health: {comparison.current_health_score}% ({comparison.health_change > 0 ? '+' : ''}
                  {comparison.health_change} pts)
                </span>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-agri-200/50 dark:border-agri-700/25 h-56 bg-slate-950 shadow-md">
                <img
                  src={afterImageUrl}
                  alt="Follow-up State"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-agri-500/80 text-white font-mono text-[10px] font-bold">
                  Follow-up Re-scan
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Split Slider Mode */
          <div className="relative h-64 rounded-2xl overflow-hidden border border-agri-200/50 dark:border-agri-700/25 shadow-md select-none">
            <img
              src={afterImageUrl}
              alt="After"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforeImageUrl}
                alt="Before"
                className="w-full h-full object-cover"
                style={{ width: '100%' }}
              />
            </div>
            {/* Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-xl pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
            />
            <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-mono font-bold pointer-events-none">
              BEFORE
            </span>
            <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-agri-500/80 text-white text-[10px] font-mono font-bold pointer-events-none">
              AFTER
            </span>
          </div>
        )}
      </div>

      {/* ── Quantitative Delta Metrics Grid ── */}
      <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Health Score */}
        <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 space-y-1">
          <span className="text-[10px] font-bold text-agri-500/70 uppercase tracking-wider block">
            Canopy Vitality (Health Score)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-agri-400/70">
              {comparison.previous_health_score} →{' '}
              <strong className="text-agri-900 dark:text-white text-base">
                {comparison.current_health_score}
              </strong>
            </span>
            <span
              className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                comparison.health_change < 0
                  ? 'bg-rose-500/10 text-rose-600'
                  : 'bg-agri-500/10 text-agri-600'
              }`}
            >
              {comparison.health_change > 0 ? '+' : ''}
              {comparison.health_change} pts
            </span>
          </div>
        </div>

        {/* Metric 2: Disease Risk */}
        <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 space-y-1">
          <span className="text-[10px] font-bold text-agri-500/70 uppercase tracking-wider block">
            Pathology Threat (Disease Risk)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-agri-400/70">
              {comparison.previous_disease_risk}% →{' '}
              <strong className="text-agri-900 dark:text-white text-base">
                {comparison.current_disease_risk}%
              </strong>
            </span>
            <span
              className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                comparison.disease_risk_change > 0
                  ? 'bg-rose-500/10 text-rose-600'
                  : 'bg-agri-500/10 text-agri-600'
              }`}
            >
              {comparison.disease_risk_change > 0 ? '+' : ''}
              {comparison.disease_risk_change}%
            </span>
          </div>
        </div>

        {/* Metric 3: Affected Surface Area */}
        <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 space-y-1">
          <span className="text-[10px] font-bold text-agri-500/70 uppercase tracking-wider block">
            Affected Area Footprint
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-agri-400/70">
              {comparison.previous_affected_area_ha} ha →{' '}
              <strong className="text-agri-900 dark:text-white text-base">
                {comparison.current_affected_area_ha} ha
              </strong>
            </span>
            <span
              className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                comparison.affected_area_change_ha > 0
                  ? 'bg-purple-500/10 text-purple-600'
                  : 'bg-agri-500/10 text-agri-600'
              }`}
            >
              {comparison.affected_area_change_ha > 0 ? '+' : ''}
              {comparison.affected_area_change_ha} ha
            </span>
          </div>
        </div>
      </div>

      {/* ── Escalation / Action Recommendations ── */}
      <div className="p-6 border-t border-agri-100 dark:border-agri-700/25 bg-surface-light/50 dark:bg-slate-950/50 space-y-3">
        {comparison.is_escalated && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-agri-700 dark:text-agri-300 space-y-1.5">
            <span className="font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Escalation Notice:</span>
            </span>
            <p className="font-medium leading-relaxed">{comparison.escalation_reason}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-agri-500/70 block">Recommended Action:</span>
            <p className="font-semibold text-agri-800 dark:text-agri-200">
              {comparison.recommended_action || 'Continue routine scheduled follow-up.'}
            </p>
          </div>

          {comparison.is_escalated && onRequestExpertReview && (
            <button
              type="button"
              onClick={onRequestExpertReview}
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95 whitespace-nowrap"
            >
              <UserCheck className="w-4 h-4" />
              <span>Request Expert Re-Validation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
