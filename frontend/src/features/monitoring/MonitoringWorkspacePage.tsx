import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Calendar,
  Layers,
  Plane,
  TrendingUp,
  RefreshCw,
  Clock,
  Flame,
} from 'lucide-react';
import {
  MonitoringTask,
  MonitoringStats,
  DroneMonitoringRecommendation,
  ZoneTrendData,
  FarmHealthEvent,
} from '@/types/monitoring';
import { monitoringService } from '@/services/monitoringService';
import { MonitoringScheduleTimeline } from './MonitoringScheduleTimeline';
import { BeforeAfterComparisonCard } from './BeforeAfterComparisonCard';
import { SpatialHotspotEvolutionCard } from './SpatialHotspotEvolutionCard';
import { TargetedDroneRecommendationsList } from './TargetedDroneRecommendationsList';
import { HealthTimeSeriesChart } from './HealthTimeSeriesChart';
import { FarmHealthTimelineView } from './FarmHealthTimelineView';
import { FieldInspectionFormModal } from './FieldInspectionFormModal';
import { FarmerObservationModal } from './FarmerObservationModal';
import { useTranslation } from '@/i18n';

export const MonitoringWorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'schedule' | 'comparison' | 'hotspots' | 'drones' | 'trends' | 'timeline'
  >('schedule');

  const [tasks, setTasks] = useState<MonitoringTask[]>([]);
  const [stats, setStats] = useState<MonitoringStats>({
    scheduled: 42,
    in_progress: 14,
    completed: 31,
    overdue: 7,
    critical: 4,
    hotspots_under_monitoring: 8,
    monitoring_coverage_pct: 84.5,
  });
  const [droneRecs, setDroneRecs] = useState<DroneMonitoringRecommendation[]>([]);
  const [trendData, setTrendData] = useState<ZoneTrendData | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<FarmHealthEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [selectedTaskForInspection, setSelectedTaskForInspection] = useState<MonitoringTask | null>(null);
  const [selectedTaskForFarmerPhoto, setSelectedTaskForFarmerPhoto] = useState<MonitoringTask | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, statsData, recsData, trendsRes, timelineRes] = await Promise.all([
        monitoringService.getTasks(),
        monitoringService.getMonitoringStatistics(),
        monitoringService.getDroneRecommendations(),
        monitoringService.getZoneTrends('zone-17'),
        monitoringService.getFarmHealthTimeline('farm-nashik-1'),
      ]);

      setTasks(tasksData);
      setStats(statsData);
      setDroneRecs(recsData);
      setTrendData(trendsRes);
      setTimelineEvents(timelineRes);
    } catch (err) {
      console.warn('Failed to load monitoring workspace', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleStartTask = async (task: MonitoringTask) => {
    await monitoringService.startTask(task.id);
    loadAllData();
  };

  const handleDispatchMission = (rec: DroneMonitoringRecommendation) => {
    rec.is_dispatched = true;
    setDroneRecs([...droneRecs]);
  };

  // Find a task with completed results for the comparison view
  const completedTask = tasks.find((t) => t.results && t.results.length > 0 && t.results[0].comparisons?.length);
  const activeComparison = completedTask?.results?.[0]?.comparisons?.[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ── Header Banner ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950 to-emerald-950 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-agri-500/15 border border-emerald-400/40 text-agri-300 font-mono text-[10px] font-extrabold uppercase tracking-wider">
              Closed-Loop Feedback Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-agri-400" />
            <span>{t('monitoring.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl">
            {t('monitoring.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={loadAllData}
          className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center justify-center gap-2 text-xs font-bold active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* ── Key Metrics Summary Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
            Scheduled Tasks
          </span>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{stats.scheduled}</p>
        </div>

        <div className="p-4 rounded-2xl bg-agri-500/10 border border-agri-500/20 space-y-1">
          <span className="text-[10px] font-bold text-agri-700 dark:text-agri-300 uppercase tracking-wider block">
            Completed
          </span>
          <p className="text-2xl font-black text-agri-700 dark:text-agri-400">{stats.completed}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            Overdue / Missed
          </span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.overdue}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
            Critical Escalations
          </span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{stats.critical}</p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
            Active Hotspots
          </span>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-400">{stats.hotspots_under_monitoring}</p>
        </div>

        <div className="p-4 rounded-2xl bg-agri-900 text-white space-y-1">
          <span className="text-[10px] font-bold text-agri-400 uppercase tracking-wider block">
            Monitoring Coverage
          </span>
          <p className="text-2xl font-black font-mono">{stats.monitoring_coverage_pct}%</p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-agri-50 dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 overflow-x-auto no-scrollbar">
        {[
          { id: 'schedule', label: t('monitoring.schedule'), icon: <Calendar className="w-4 h-4" /> },
          { id: 'comparison', label: t('monitoring.beforeAfter'), icon: <Layers className="w-4 h-4" /> },
          { id: 'hotspots', label: t('monitoring.hotspots'), icon: <Flame className="w-4 h-4" /> },
          { id: 'drones', label: t('monitoring.droneTargets'), icon: <Plane className="w-4 h-4" /> },
          { id: 'trends', label: t('monitoring.trends'), icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'timeline', label: t('monitoring.timeline'), icon: <Clock className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-agri-500 text-white shadow-md shadow-emerald-900/20'
                  : 'text-agri-600 dark:text-agri-400/70 hover:text-agri-900 dark:hover:text-white hover:bg-agri-100 dark:hover:bg-agri-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active Workspace Tab Content ── */}
      {activeTab === 'schedule' && (
        <MonitoringScheduleTimeline
          tasks={tasks}
          onSelectTask={(task) => setSelectedTaskForInspection(task)}
          onStartTask={handleStartTask}
          onSubmitObservation={(task) => {
            if (task.monitoring_method === 'FARMER_IMAGE') {
              setSelectedTaskForFarmerPhoto(task);
            } else {
              setSelectedTaskForInspection(task);
            }
          }}
        />
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-4">
          {activeComparison ? (
            <BeforeAfterComparisonCard
              comparison={activeComparison}
              onRequestExpertReview={() => navigate('/validation')}
            />
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 text-xs text-agri-400/70">
              Select a completed monitoring task to view before vs after delta comparison.
            </div>
          )}
        </div>
      )}

      {activeTab === 'hotspots' && (
        <SpatialHotspotEvolutionCard
          hotspotCode="HS-001 (Nashik North Corridor)"
          previousZones={['Z17']}
          currentZones={['Z16', 'Z17', 'Z18']}
          previousAreaHa={1.2}
          currentAreaHa={1.8}
          status="EXPANDING"
        />
      )}

      {activeTab === 'drones' && (
        <TargetedDroneRecommendationsList
          recommendations={droneRecs}
          onDispatchMission={handleDispatchMission}
        />
      )}

      {activeTab === 'trends' && trendData && (
        <HealthTimeSeriesChart trendData={trendData} />
      )}

      {activeTab === 'timeline' && (
        <FarmHealthTimelineView events={timelineEvents} />
      )}

      {/* ── Field Inspection Modal ── */}
      {selectedTaskForInspection && (
        <FieldInspectionFormModal
          task={selectedTaskForInspection}
          onClose={() => setSelectedTaskForInspection(null)}
          onSuccess={() => {
            setSelectedTaskForInspection(null);
            loadAllData();
            setActiveTab('comparison');
          }}
        />
      )}

      {/* ── Farmer Observation Modal ── */}
      {selectedTaskForFarmerPhoto && (
        <FarmerObservationModal
          task={selectedTaskForFarmerPhoto}
          onClose={() => setSelectedTaskForFarmerPhoto(null)}
          onSuccess={() => {
            setSelectedTaskForFarmerPhoto(null);
            loadAllData();
          }}
        />
      )}
    </div>
  );
};
