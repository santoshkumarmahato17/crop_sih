import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Cpu,
  Radio,
  Sparkles,
} from 'lucide-react';
import { FarmMapViewer } from '@/components/map/FarmMapViewer';
import { MissionImageryGallery } from '@/features/imagery/MissionImageryGallery';
import { droneService } from '@/services/droneService';
import { farmService } from '@/services/farmService';
import { zoneService } from '@/services/zoneService';
import { DroneMission, Farm, Zone } from '@/types';

export const MissionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [mission, setMission] = useState<DroneMission | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [simLog, setSimLog] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadMissionData(id);
    }
  }, [id]);

  const loadMissionData = async (missionId: string) => {
    try {
      setIsLoading(true);
      const missionData = await droneService.getMission(missionId);
      setMission(missionData);

      if (missionData.farm_id) {
        const [farmData, zonesData] = await Promise.all([
          farmService.getFarm(missionData.farm_id),
          zoneService.listZones(missionData.farm_id),
        ]);
        setFarm(farmData);
        setZones(zonesData.zones);
      }
    } catch (err: any) {
      // Demo fallback mock data
      setMission({
        id: missionId,
        farm_id: 'farm-demo-1',
        farm_name: 'Sahyadri Bio-Wheat Estate',
        drone_id: 'drone-demo-1',
        drone_name: 'AgriFlyer Matrice-1',
        flight_boundary: {
          type: 'Polygon',
          coordinates: [
            [
              [73.8500, 18.5200],
              [73.8560, 18.5200],
              [73.8560, 18.5250],
              [73.8500, 18.5250],
              [73.8500, 18.5200],
            ],
          ],
        },
        target_zones: ['Z01', 'Z02', 'Z03'],
        mission_date: new Date().toISOString(),
        altitude_meters: 50.0,
        flight_speed_mps: 5.0,
        overlap_percentage: 75.0,
        coverage_percentage: 0.0,
        priority: 'HIGH',
        status: 'SCHEDULED',
        created_at: new Date().toISOString(),
      });
      setSimLog(['[SYSTEM] Autonomous survey flight plan synced with MockDroneProvider.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMission = async () => {
    if (!mission) return;
    try {
      setIsExecuting(true);
      const updated = await droneService.startMission(mission.id);
      setMission(updated);
      setSimLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SIMULATION] Drone takeoff confirmed. Ascended to ${mission.altitude_meters}m AGL. Serpentine grid scan initiated.`,
      ]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start flight simulation.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCompleteMission = async () => {
    if (!mission) return;
    try {
      setIsExecuting(true);
      const updated = await droneService.completeMission(mission.id);
      setMission(updated);
      setSimLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SIMULATION] 100% boundary coverage scan completed. Safe RTH landing executed. 48 multispectral frames captured.`,
      ]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete flight simulation.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-agri-400/70">Loading flight telemetry...</div>;
  }

  if (!mission) {
    return <div className="p-12 text-center text-rose-400">Mission record not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/missions"
            className="p-2 rounded-xl bg-agri-900 border border-slate-800 hover:bg-agri-800 text-agri-400/70 hover:text-agri-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-agri-100">
                Flight Mission: {mission.farm_name || 'Autonomous Survey'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-agri-500/10 border border-agri-500/20 text-agri-400 text-xs font-bold font-mono">
                {mission.status}
              </span>
            </div>
            <p className="text-xs text-agri-400/70 flex items-center gap-1 mt-0.5">
              <Cpu className="w-3.5 h-3.5 text-agri-500/70" />
              <span>Assigned: {mission.drone_name || 'AgriFlyer Drone'}</span>
            </p>
          </div>
        </div>

        {/* Simulation Execution Triggers */}
        <div className="flex items-center gap-2">
          {mission.status === 'SCHEDULED' && (
            <button
              onClick={handleStartMission}
              disabled={isExecuting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/40 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isExecuting ? 'Initiating Takeoff...' : 'Launch Mission (Simulation)'}</span>
            </button>
          )}

          {mission.status === 'IN_PROGRESS' && (
            <button
              onClick={handleCompleteMission}
              disabled={isExecuting}
              className="px-4 py-2 rounded-xl bg-agri-500 hover:bg-agri-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isExecuting ? 'Concluding...' : 'Simulate Landing & Complete'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Flight Corridor Map */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-agri-400/70 flex items-center gap-2">
          <Radio className="w-4 h-4 text-agri-400" />
          <span>Flight Boundary Corridor & Target Zones</span>
        </h2>

        <FarmMapViewer
          boundary={mission.flight_boundary || farm?.boundary}
          totalHectares={farm?.total_area_hectares || 24.8}
          farmName={farm?.name || 'Target Farm'}
          zones={zones}
          selectedZoneId={null}
        />
      </div>

      {/* Flight Telemetry Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-agri-400/70 block font-medium">Survey Altitude</span>
          <p className="text-xl font-bold text-agri-100 font-mono mt-1">
            {mission.altitude_meters} <span className="text-sm text-agri-400/70">m AGL</span>
          </p>
          <p className="text-[11px] text-agri-500/70 mt-0.5">Ground Resolution: ~2.4 cm/px</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-agri-400/70 block font-medium">Flight Speed</span>
          <p className="text-xl font-bold text-agri-100 font-mono mt-1">
            {mission.flight_speed_mps} <span className="text-sm text-agri-400/70">m/s</span>
          </p>
          <p className="text-[11px] text-agri-500/70 mt-0.5">Overlap: {mission.overlap_percentage}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-agri-400/70 block font-medium">Target Zones</span>
          <div className="flex flex-wrap gap-1 mt-2">
            {(mission.target_zones || []).map((z, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono text-xs font-bold"
              >
                {z}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-agri-500/70 mt-1">Targeted Survey Area</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-agri-400/70 block font-medium">Mission Progress</span>
          <p className="text-xl font-bold text-agri-400 font-mono mt-1">
            {mission.coverage_percentage.toFixed(0)}%
          </p>
          <div className="w-full bg-agri-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-agri-500 h-full rounded-full transition-all"
              style={{ width: `${mission.coverage_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Drone Imagery Ingestion & Gallery Pipeline */}
      <MissionImageryGallery missionId={mission.id} zones={zones} />

      {/* Simulated Telemetry Log Console */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-agri-400/70">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-agri-400" />
            <span>Simulated Flight Telemetry Stream (Development Mode)</span>
          </span>
          <span className="text-[10px] text-agri-500/70">Provider: MockDroneProvider</span>
        </div>

        <div className="space-y-1 text-agri-300 max-h-48 overflow-y-auto">
          {simLog.length === 0 ? (
            <p className="text-agri-600">Flight simulation ready. Press "Launch Mission" to execute.</p>
          ) : (
            simLog.map((log, idx) => (
              <p key={idx} className="text-agri-400/90">
                {log}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
