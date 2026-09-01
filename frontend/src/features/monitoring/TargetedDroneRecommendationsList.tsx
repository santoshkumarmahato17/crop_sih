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
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-extrabold uppercase border border-emerald-500/30">
                    Targeted Surveillance
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-extrabold uppercase border border-rose-500/30">
                    {rec.priority} PRIORITY
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Plane className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{rec.target_area_description}</span>
                </h4>
              </div>

              {onDispatchMission && (
                <button
                  type="button"
                  onClick={() => onDispatchMission(rec)}
                  disabled={rec.is_dispatched}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 active:scale-95 whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>{rec.is_dispatched ? 'Dispatched' : 'Schedule Mission'}</span>
                </button>
              )}
            </div>

            {/* Targeted Buffer Zones */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">Targeted Envelope:</span>
              {rec.targeted_zones.map((zone) => (
                <span
                  key={zone}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold border border-slate-200 dark:border-slate-700"
                >
                  Zone {zone}
                </span>
              ))}
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {rec.reason}
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-mono">
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
