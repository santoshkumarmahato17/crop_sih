import React from 'react';
import {
  AlertTriangle,
  Plane,
  Sprout,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { FarmHealthEvent } from '@/types/monitoring';

interface FarmHealthTimelineViewProps {
  events: FarmHealthEvent[];
}

export const FarmHealthTimelineView: React.FC<FarmHealthTimelineViewProps> = ({ events }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ESCALATION_REQUIRED':
      case 'ESCALATION_TRIGGERED':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'DRONE_SCAN_COMPLETED':
      case 'DRONE_MONITORING_COMPLETED':
        return <Plane className="w-4 h-4 text-agri-600" />;
      case 'ADVISORY_ISSUED':
      case 'ADVISORY_DISPATCHED':
        return <Sprout className="w-4 h-4 text-sky-600" />;
      case 'HOTSPOT_DETECTED':
      case 'PRIMARY_HOTSPOT_DETECTED':
        return <Flame className="w-4 h-4 text-amber-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-agri-600" />;
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 shadow-xl space-y-6">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-agri-500/70 uppercase tracking-wider block">
          Closed-Loop Intelligence History
        </span>
        <h3 className="text-base font-black text-agri-900 dark:text-white">
          Farm Health & Closed-Loop Action Timeline
        </h3>
      </div>

      <div className="relative pl-6 border-l-2 border-agri-200/50 dark:border-agri-700/25 space-y-6">
        {events.map((evt) => (
          <div key={evt.id} className="relative space-y-1.5 group">
            {/* Timeline Dot */}
            <div className="absolute -left-[31px] top-1 w-7 h-7 rounded-full bg-white dark:bg-surface-darkCard border-2 border-slate-300 dark:border-agri-700/30 flex items-center justify-center shadow-sm group-hover:scale-110 transition">
              {getEventIcon(evt.event_type)}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-agri-400/70">
                {new Date(evt.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {evt.zone_name && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-agri-50 dark:bg-agri-800/50 text-agri-600 dark:text-agri-300">
                  {evt.zone_name}
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-black text-agri-900 dark:text-white">
              {evt.title}
            </h4>
            <p className="text-xs text-agri-600 dark:text-agri-300 leading-relaxed">
              {evt.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
