import React from 'react';
import {
  Calendar,
  Clock,
  Plane,
  Eye,
  Camera,
  ChevronRight,
} from 'lucide-react';
import { MonitoringTask, MonitoringPriority, MonitoringMethod } from '@/types/monitoring';
import { useTranslation } from '@/i18n';

interface MonitoringScheduleTimelineProps {
  tasks: MonitoringTask[];
  onSelectTask: (task: MonitoringTask) => void;
  onStartTask?: (task: MonitoringTask) => void;
  onSubmitObservation?: (task: MonitoringTask) => void;
}

export const MonitoringScheduleTimeline: React.FC<MonitoringScheduleTimelineProps> = ({
  tasks,
  onSelectTask,
  onStartTask,
  onSubmitObservation,
}) => {
  const { t } = useTranslation();

  const getPriorityStyle = (priority: MonitoringPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    }
  };

  const getMethodIcon = (method: MonitoringMethod) => {
    switch (method) {
      case 'DRONE':
        return <Plane className="w-4 h-4 text-agri-600" />;
      case 'FIELD_INSPECTION':
        return <Eye className="w-4 h-4 text-sky-600" />;
      case 'FARMER_IMAGE':
        return <Camera className="w-4 h-4 text-purple-600" />;
      default:
        return <Calendar className="w-4 h-4 text-agri-600" />;
    }
  };

  // Group tasks by timeline horizon
  const todayTasks = tasks.filter((t) => {
    const d = new Date(t.scheduled_at);
    const now = new Date();
    return d.toDateString() === now.toDateString() || d < now;
  });

  const tomorrowTasks = tasks.filter((t) => {
    const d = new Date(t.scheduled_at);
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    return d.toDateString() === tomorrow.toDateString();
  });

  const upcomingTasks = tasks.filter(
    (t) => !todayTasks.includes(t) && !tomorrowTasks.includes(t)
  );

  const renderTaskCard = (task: MonitoringTask) => {
    const isCompleted = task.status === 'COMPLETED';
    const isEscalated = task.status === 'ESCALATED';

    return (
      <div
        key={task.id}
        className={`p-4 rounded-3xl border transition-all duration-200 shadow-sm flex flex-col justify-between gap-3 ${
          isEscalated
            ? 'bg-rose-500/5 border-rose-500/30'
            : isCompleted
            ? 'bg-emerald-500/5 border-agri-500/20'
            : 'bg-white dark:bg-surface-darkCard hover:bg-surface-light dark:hover:bg-agri-800/60/60 border-agri-200/50 dark:border-agri-700/25'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-agri-50 dark:bg-agri-800/50">
              {getMethodIcon(task.monitoring_method)}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-agri-500/70 block">
                {task.task_code}
              </span>
              <h4 className="text-sm font-black text-agri-900 dark:text-white">
                {task.zone_name || 'Farm Zone'}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getPriorityStyle(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
          </div>
        </div>

        <div className="space-y-1 text-xs text-agri-600 dark:text-agri-300">
          <p className="font-semibold text-agri-800 dark:text-agri-200">
            {task.suspected_condition || 'Foliar Health Inspection'}
          </p>
          <div className="flex items-center gap-2 text-agri-500/70 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Due: {task.due_at ? new Date(task.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Within 24h'}
            </span>
          </div>
        </div>

        {/* Card Actions */}
        <div className="pt-2 border-t border-agri-100 dark:border-agri-700/25 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectTask(task)}
            className="text-xs font-bold text-agri-500/70 hover:text-agri-900 dark:hover:text-white transition"
          >
            View Details
          </button>

          {!isCompleted && !isEscalated && (
            <div className="flex items-center gap-1.5">
              {task.status === 'SCHEDULED' && onStartTask && (
                <button
                  type="button"
                  onClick={() => onStartTask(task)}
                  className="px-3 py-1.5 rounded-xl bg-agri-50 dark:bg-agri-800/50 hover:bg-agri-100 dark:hover:bg-agri-700/40 text-agri-800 dark:text-white text-xs font-bold transition"
                >
                  Start
                </button>
              )}
              {onSubmitObservation && (
                <button
                  type="button"
                  onClick={() => onSubmitObservation(task)}
                  className="px-3.5 py-1.5 rounded-xl bg-agri-500 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <span>Submit Result</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Group 1: TODAY ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
            {t('monitoring.today')} ({todayTasks.length})
          </h3>
        </div>
        {todayTasks.length === 0 ? (
          <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs text-agri-400/70">
            No monitoring tasks scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayTasks.map(renderTaskCard)}
          </div>
        )}
      </div>

      {/* ── Group 2: TOMORROW ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
          {t('monitoring.tomorrow')} ({tomorrowTasks.length})
        </h3>
        {tomorrowTasks.length === 0 ? (
          <div className="p-4 rounded-2xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs text-agri-400/70">
            No monitoring tasks scheduled for tomorrow.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tomorrowTasks.map(renderTaskCard)}
          </div>
        )}
      </div>

      {/* ── Group 3: UPCOMING / LATER ── */}
      {upcomingTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-agri-500/70">
            {t('monitoring.in3Days')} ({upcomingTasks.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTasks.map(renderTaskCard)}
          </div>
        </div>
      )}
    </div>
  );
};
