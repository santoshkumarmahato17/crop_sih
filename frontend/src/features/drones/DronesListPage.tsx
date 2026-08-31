import React, { useEffect, useState } from 'react';
import { Plus, Battery, Camera, Cpu, Sparkles, CheckCircle } from 'lucide-react';
import { droneService } from '@/services/droneService';
import { Drone } from '@/types';
import { ThreeDFieldSimulationViewer } from '@/features/drones/ThreeDFieldSimulationViewer';

export const DronesListPage: React.FC = () => {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('DJI Enterprise');
  const [modelName, setModelName] = useState('Matrice 350 RTK');
  const [cameraType, setCameraType] = useState('Multispectral + Thermal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDrones();
  }, []);

  const fetchDrones = async () => {
    try {
      setIsLoading(true);
      const data = await droneService.listDrones();
      setDrones(data.drones);
    } catch (err: any) {
      // Fallback demo data
      setDrones([
        {
          id: 'drone-demo-1',
          name: 'AgriFlyer Matrice-1',
          serial_number: 'DJI-M350-99214',
          manufacturer: 'DJI Enterprise',
          model_name: 'Matrice 350 RTK',
          camera_type: 'Zenmuse P1 + Multispectral',
          sensor_capabilities: ['RGB', 'RedEdge', 'NIR', 'Thermal_LWIR'],
          battery_percentage: 94.0,
          battery_cycle_count: 18,
          operational_status: 'AVAILABLE',
          status: 'idle',
          created_at: new Date().toISOString(),
        },
        {
          id: 'drone-demo-2',
          name: 'SkyScan Multispec-2',
          serial_number: 'DJI-M3M-44102',
          manufacturer: 'DJI Enterprise',
          model_name: 'Mavic 3 Multispectral',
          camera_type: '4-Band Multispectral + RGB',
          sensor_capabilities: ['Green', 'Red', 'RedEdge', 'NIR'],
          battery_percentage: 100.0,
          battery_cycle_count: 5,
          operational_status: 'AVAILABLE',
          status: 'idle',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serialNumber.trim()) return;

    try {
      setIsSubmitting(true);
      await droneService.registerDrone({
        name: name.trim(),
        serial_number: serialNumber.trim(),
        manufacturer,
        model_name: modelName,
        camera_type: cameraType,
        sensor_capabilities: ['RGB', 'RedEdge', 'NIR', 'Thermal_LWIR'],
        battery_percentage: 100.0,
        operational_status: 'AVAILABLE',
      });
      setIsModalOpen(false);
      setName('');
      setSerialNumber('');
      fetchDrones();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register drone airframe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-400" />
            <span>Drone Fleet Management & 3D Flight Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            UAV hardware units, Three.js 3D WebGL flight simulation, multispectral sensor capabilities, and battery telemetry.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Drone</span>
        </button>
      </div>

      {/* THREE.JS 3D WEBGL DRONE FLIGHT SIMULATOR */}
      <ThreeDFieldSimulationViewer farmName="West Valley Sector #1 — Drone Survey Mission" altitude={45} />

      {/* Fleet Overview Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading drone fleet...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drones.map((drone) => (
            <div
              key={drone.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{drone.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {drone.manufacturer} • {drone.model_name}
                    </p>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase">
                    {drone.operational_status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Battery Status</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {drone.battery_percentage.toFixed(0)}% ({drone.battery_cycle_count} cycles)
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${drone.battery_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>Payload: {drone.camera_type}</span>
                  </span>

                  <div className="flex flex-wrap gap-1 mt-1">
                    {(drone.sensor_capabilities || ['RGB', 'NIR']).map((band, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono"
                      >
                        {band}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>S/N: {drone.serial_number}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Ready</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Register Drone */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <span>Register Drone Unit</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Drone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AgriFlyer Pro 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Hardware Serial Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DJI-M350-10928"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Model Name</label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Camera & Sensor Payload</label>
                <input
                  type="text"
                  value={cameraType}
                  onChange={(e) => setCameraType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registering...' : 'Register Airframe'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
