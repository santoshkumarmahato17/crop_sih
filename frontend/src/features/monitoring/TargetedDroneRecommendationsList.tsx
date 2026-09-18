import React from 'react';
import {
  Plane,
  Clock,
  Send,
} from 'lucide-react';
import { DroneMonitoringRecommendation } from '@/types/monitoring';

interface TargetedDroneRecommendationsListProps {
  recommendations: DroneMonitoringRecommendation[];
  onDispatchMission?: (rec: DroneMonitoringRecommendation) => void;
}

export const TargetedDroneRecommendationsList: React.FC<TargetedDroneRecommendationsListProps> = ({
  recommendations,
  onDispatchMission,
}) => {
  return (
    <div className="space-y-4">
      {recommendations.map((rec) => {
        return (
          <div
            key={rec.id}
            className="p-5 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-agri-100 dark:border-agri-700/25 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-agri-500/15 text-agri-700 dark:text-agri-300 font-mono text-[10px] font-extrabold uppercase border border-agri-500/25">
                    Targeted Surveillance
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-extrabold uppercase border border-rose-500/30">
                    {rec.priority} PRIORITY
                  </span>
                </div>
                <h4 className="text-base font-black text-agri-900 dark:text-white flex items-center gap-2">
                  <Plane className="w-5 h-5 text-agri-600 dark:text-agri-400" />
                  <span>{rec.target_area_description}</span>
                </h4>
              </div>

              {onDispatchMission && (
                <button
                  type="button"
                  onClick={() => onDispatchMission(rec)}
                  disabled={rec.is_dispatched}
                  className="py-2 px-4 rounded-xl bg-agri-500 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 active:scale-95 whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>{rec.is_dispatched ? 'Dispatched' : 'Schedule Mission'}</span>
                </button>
              )}
            </div>

            {/* Targeted Buffer Zones */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-agri-500/70 font-bold">Targeted Envelope:</span>
              {rec.targeted_zones.map((zone) => (
                <span
                  key={zone}
                  className="px-2.5 py-0.5 rounded-lg bg-agri-50 dark:bg-agri-800/50 text-agri-800 dark:text-agri-200 font-mono font-bold border border-agri-200/50 dark:border-agri-700/30"
                >
                  Zone {zone}
                </span>
              ))}
            </div>

            <p className="text-xs text-agri-700 dark:text-agri-300 leading-relaxed">
              {rec.reason}
            </p>

            <div className="pt-3 border-t border-agri-100 dark:border-agri-700/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-agri-500/70 font-mono">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Slot Window: {rec.recommended_time_window}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Baseline Health: {rec.previous_health_score}%</span>
                <span className="text-rose-600 font-bold">Current Risk: {rec.current_risk_score}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
