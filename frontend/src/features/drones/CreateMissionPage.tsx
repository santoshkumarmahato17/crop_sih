import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, Check } from 'lucide-react';
import { FarmMapViewer } from '@/components/map/FarmMapViewer';
import { farmService } from '@/services/farmService';
import { zoneService } from '@/services/zoneService';
import { droneService } from '@/services/droneService';
import { CreateMissionPayload, Drone, Farm, MissionPriorityType, Zone } from '@/types';

export const CreateMissionPage: React.FC = () => {
  const navigate = useNavigate();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [drones, setDrones] = useState<Drone[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneCodes, setSelectedZoneCodes] = useState<string[]>([]);
  const [selectedDroneId, setSelectedDroneId] = useState<string>('');
  const [missionDate, setMissionDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [priority, setPriority] = useState<MissionPriorityType>('NORMAL');
  const [altitudeMeters, setAltitudeMeters] = useState<number>(50.0);
  const [flightSpeedMps, setFlightSpeedMps] = useState<number>(5.0);
  const [overlapPercentage, setOverlapPercentage] = useState<number>(75.0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [farmsData, dronesData] = await Promise.all([
        farmService.listFarms(),
        droneService.listDrones(),
      ]);

      setFarms(farmsData.farms);
      setDrones(dronesData.drones);

      if (farmsData.farms.length > 0) {
        const firstFarm = farmsData.farms[0];
        setSelectedFarmId(firstFarm.id);
        setSelectedFarm(firstFarm);
        loadZonesForFarm(firstFarm.id);
      }

      if (dronesData.drones.length > 0) {
        setSelectedDroneId(dronesData.drones[0].id);
      }
    } catch (err: any) {
      setErrorMessage('Failed to load farms and available drone fleet.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadZonesForFarm = async (farmId: string) => {
    try {
      const data = await zoneService.listZones(farmId);
      setZones(data.zones);
      // Select all zones by default
      setSelectedZoneCodes(data.zones.map((z) => z.zone_code));
    } catch (err: any) {
      setZones([]);
      setSelectedZoneCodes([]);
    }
  };

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const farmId = e.target.value;
    setSelectedFarmId(farmId);
    const found = farms.find((f) => f.id === farmId) || null;
    setSelectedFarm(found);
    if (farmId) {
      loadZonesForFarm(farmId);
    }
  };

  const toggleZoneSelection = (zoneCode: string) => {
    setSelectedZoneCodes((prev) =>
      prev.includes(zoneCode)
        ? prev.filter((code) => code !== zoneCode)
        : [...prev, zoneCode]
    );
  };

  const selectAllZones = () => {
    setSelectedZoneCodes(zones.map((z) => z.zone_code));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmId) {
      setErrorMessage('Please select a target farm.');
      return;
    }

    if (selectedZoneCodes.length === 0) {
      setErrorMessage('Please select at least one monitoring zone for the survey flight.');
      return;
    }

    const payload: CreateMissionPayload = {
      farm_id: selectedFarmId,
      drone_id: selectedDroneId || undefined,
      target_zones: selectedZoneCodes,
      mission_date: new Date(missionDate).toISOString(),
      priority,
      altitude_meters: altitudeMeters,
      flight_speed_mps: flightSpeedMps,
      overlap_percentage: overlapPercentage,
    };

    try {
      setIsSubmitting(true);
      const created = await droneService.createMission(payload);
      navigate(`/missions/${created.id}`);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to schedule drone survey mission.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-agri-400/70">Loading mission configuration...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/missions"
          className="p-2 rounded-xl bg-agri-900 border border-slate-800 hover:bg-agri-800 text-agri-400/70 hover:text-agri-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-agri-100">Schedule Drone Survey Mission</h1>
          <p className="text-xs text-agri-400/70">
            Define survey corridors, target monitoring zones, and autonomous flight parameters.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Farm & Airframe Selection */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-agri-100">
            1. Target Farm & Drone Assignment
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">
                Target Farm Holding *
              </label>
              <select
                required
                value={selectedFarmId}
                onChange={handleFarmChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.total_area_hectares.toFixed(1)} ha)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">
                Assigned UAV Airframe *
              </label>
              <select
                required
                value={selectedDroneId}
                onChange={(e) => setSelectedDroneId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              >
                {drones.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.model_name} • {d.battery_percentage.toFixed(0)}% Battery)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Target Zone Multi-Selection on Interactive Map */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-agri-100">
                2. Target Monitoring Zones Selection
              </h2>
              <p className="text-xs text-agri-400/70 mt-0.5">
                Click zones on the map or buttons below to select survey targets ({selectedZoneCodes.length} selected).
              </p>
            </div>

            <button
              type="button"
              onClick={selectAllZones}
              className="px-3 py-1.5 rounded-lg bg-agri-800 hover:bg-slate-700 text-agri-300 text-xs font-semibold transition"
            >
              Select All Zones
            </button>
          </div>

          {selectedFarm && (
            <FarmMapViewer
              boundary={selectedFarm.boundary}
              centerPoint={selectedFarm.center_point}
              totalHectares={selectedFarm.total_area_hectares}
              farmName={selectedFarm.name}
              zones={zones}
              selectedZoneId={null}
              onZoneSelect={(z) => toggleZoneSelection(z.zone_code)}
            />
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {zones.map((z) => {
              const isSelected = selectedZoneCodes.includes(z.zone_code);
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => toggleZoneSelection(z.zone_code)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-agri-400/70 hover:bg-agri-800'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{z.zone_code} ({z.area_hectares.toFixed(1)} ha)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flight Parameters & Priority */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-agri-100">
            3. Autonomous Flight Telemetry & Timing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">
                Scheduled Execution Date/Time *
              </label>
              <input
                type="datetime-local"
                required
                value={missionDate}
                onChange={(e) => setMissionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Mission Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MissionPriorityType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-agri-100 focus:outline-none focus:border-agri-500 font-bold"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">
                Altitude AGL (Meters)
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={altitudeMeters}
                onChange={(e) => setAltitudeMeters(parseFloat(e.target.value) || 50.0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-agri-100 focus:outline-none focus:border-agri-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">
                Speed (m/s)
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={flightSpeedMps}
                onChange={(e) => setFlightSpeedMps(parseFloat(e.target.value) || 5.0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-agri-100 focus:outline-none focus:border-agri-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">
                Forward Overlap %
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={overlapPercentage}
                onChange={(e) => setOverlapPercentage(parseFloat(e.target.value) || 75.0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-agri-100 focus:outline-none focus:border-agri-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/missions"
            className="px-5 py-2.5 rounded-xl bg-agri-900 border border-slate-800 hover:bg-agri-800 text-agri-300 font-medium text-sm transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-agri-500 hover:bg-agri-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Compiling Corridor...' : 'Schedule Survey Flight'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
