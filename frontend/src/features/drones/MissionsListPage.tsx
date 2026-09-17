import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Send, Calendar, ArrowRight } from 'lucide-react';
import { droneService } from '@/services/droneService';
import { DroneMission } from '@/types';

export const MissionsListPage: React.FC = () => {
  const [missions, setMissions] = useState<DroneMission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      setIsLoading(true);
      const data = await droneService.listMissions();
      setMissions(data.missions);
    } catch (err: any) {
      // Demo fallback mock data
      setMissions([
        {
          id: 'mission-demo-1',
          farm_id: 'farm-1',
          farm_name: 'Sahyadri Bio-Wheat Estate',
          drone_id: 'drone-1',
          drone_name: 'AgriFlyer Matrice-1',
          target_zones: ['Z01', 'Z02', 'Z03'],
          mission_date: new Date().toISOString(),
          altitude_meters: 50.0,
          flight_speed_mps: 5.0,
          overlap_percentage: 75.0,
          coverage_percentage: 100.0,
          priority: 'HIGH',
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
        },
        {
          id: 'mission-demo-2',
          farm_id: 'farm-1',
          farm_name: 'Sahyadri Bio-Wheat Estate',
          drone_id: 'drone-2',
          drone_name: 'SkyScan Multispec-2',
          target_zones: ['Z04'],
          mission_date: new Date(Date.now() + 86400000).toISOString(),
          altitude_meters: 60.0,
          flight_speed_mps: 6.0,
          overlap_percentage: 80.0,
          coverage_percentage: 0.0,
          priority: 'NORMAL',
          status: 'SCHEDULED',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-agri-800 text-agri-300 text-xs font-medium">
            NORMAL
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-agri-500/10 border border-agri-500/25 text-agri-400 text-xs font-semibold">
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>In Flight</span>
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            Scheduled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-agri-800 text-agri-400/70 text-xs">
            {status}
          </span>
        );
    }
  };

  const filteredMissions = missions.filter((m) =>
    filterStatus === 'ALL' ? true : m.status.toUpperCase() === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-agri-100 flex items-center gap-2">
            <Send className="w-6 h-6 text-agri-400" />
            <span>Drone Survey Missions</span>
          </h1>
          <p className="text-sm text-agri-400/70 mt-1">
            Plan, schedule, and simulate autonomous aerial multispectral crop monitoring flights.
          </p>
        </div>

        <Link
          to="/missions/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-agri-500 hover:bg-agri-500 text-white font-semibold shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Survey Mission</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterStatus === status
                ? 'bg-agri-500/20 border border-agri-500/30 text-agri-400'
                : 'text-agri-400/70 hover:text-agri-200'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Mission Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-agri-400/70">Loading flight missions...</div>
      ) : filteredMissions.length === 0 ? (
        <div className="p-12 text-center text-agri-500/70 rounded-2xl bg-slate-900/40 border border-slate-800">
          No survey flight missions found. Schedule a mission to start monitoring.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMissions.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-agri-900/60 border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-agri-100 text-base">
                      {m.farm_name || 'Farm Survey'}
                    </h3>
                    <p className="text-xs text-agri-400/70 mt-0.5">
                      Airframe: {m.drone_name || 'Assigned Drone'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getPriorityBadge(m.priority)}
                    {getStatusBadge(m.status)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-agri-950/60 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-agri-500/70 block">Flight Date:</span>
                    <span className="text-agri-200 font-medium flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-agri-400" />
                      <span>{new Date(m.mission_date).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-agri-500/70 block">Altitude & Speed:</span>
                    <span className="text-agri-200 font-mono mt-0.5 block">
                      {m.altitude_meters}m AGL • {m.flight_speed_mps} m/s
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-agri-400/70">Target Zones:</span>
                    <div className="flex gap-1">
                      {(m.target_zones || []).map((z, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono text-[11px] font-bold"
                        >
                          {z}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-agri-400/70 pt-1">
                    <span>Flight Boundary Coverage:</span>
                    <span className="font-mono font-bold text-agri-400">
                      {m.coverage_percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-agri-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-agri-500 h-full rounded-full transition-all"
                      style={{ width: `${m.coverage_percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                <Link
                  to={`/missions/${m.id}`}
                  className="text-xs font-semibold text-agri-400 hover:text-agri-300 flex items-center gap-1"
                >
                  <span>Flight Control & Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
