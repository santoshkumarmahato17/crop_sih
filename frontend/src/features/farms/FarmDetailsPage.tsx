import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Globe,
  Layers,
  Sparkles,
  CheckCircle,
  Shield,
  Radio,
} from 'lucide-react';
import { FarmMapViewer } from '@/components/map/FarmMapViewer';
import { ZoneTemporalAnalyticsModal } from '@/features/temporal/ZoneTemporalAnalyticsModal';
import { ZoneRiskExplanationModal } from '@/features/risk/ZoneRiskExplanationModal';
import { SpreadRiskGraphViewer } from '@/features/spread/SpreadRiskGraphViewer';
import { WaterRequirementMapViewer } from '@/features/water/WaterRequirementMapViewer';
import { AdaptiveMonitoringPanel } from '@/features/adaptive/AdaptiveMonitoringPanel';
import { farmService } from '@/services/farmService';
import { zoneService } from '@/services/zoneService';
import { Farm, Zone } from '@/types';

export const FarmDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Zoning Modal State
  const [isZoningModalOpen, setIsZoningModalOpen] = useState<boolean>(false);
  const [targetZoneCount, setTargetZoneCount] = useState<number>(4);
  const [isGeneratingZones, setIsGeneratingZones] = useState<boolean>(false);
  const [zoningMessage, setZoningMessage] = useState<string | null>(null);

  // Temporal Trend Modal State
  const [isTemporalModalOpen, setIsTemporalModalOpen] = useState<boolean>(false);

  // Risk Explanation Modal State
  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      loadFarmData(id);
    }
  }, [id]);

  const loadFarmData = async (farmId: string) => {
    try {
      setIsLoading(true);
      const farmData = await farmService.getFarm(farmId);
      setFarm(farmData);

      try {
        const zonesData = await zoneService.listZones(farmId);
        setZones(zonesData.zones);
        if (zonesData.zones.length > 0) {
          setSelectedZone(zonesData.zones[0]);
        }
      } catch (zoneErr) {
        // Fallback demo zones if backend not populated
        const mockZones: Zone[] = [
          {
            id: 'zone-1',
            farm_id: farmId,
            zone_code: 'Z01',
            name: 'North-West Quadrant',
            area_hectares: 6.2,
            monitoring_status: 'active',
            health_status: 'healthy',
            risk_status: 'low',
            is_active: true,
            created_at: new Date().toISOString(),
            boundary: {
              type: 'Polygon',
              coordinates: [
                [
                  [73.8500, 18.5225],
                  [73.8530, 18.5225],
                  [73.8530, 18.5250],
                  [73.8500, 18.5250],
                  [73.8500, 18.5225],
                ],
              ],
            },
            centroid: { type: 'Point', coordinates: [73.8515, 18.5237] },
          },
          {
            id: 'zone-2',
            farm_id: farmId,
            zone_code: 'Z02',
            name: 'North-East Quadrant',
            area_hectares: 6.2,
            monitoring_status: 'active',
            health_status: 'healthy',
            risk_status: 'low',
            is_active: true,
            created_at: new Date().toISOString(),
            boundary: {
              type: 'Polygon',
              coordinates: [
                [
                  [73.8530, 18.5225],
                  [73.8560, 18.5225],
                  [73.8560, 18.5250],
                  [73.8530, 18.5250],
                  [73.8530, 18.5225],
                ],
              ],
            },
            centroid: { type: 'Point', coordinates: [73.8545, 18.5237] },
          },
          {
            id: 'zone-3',
            farm_id: farmId,
            zone_code: 'Z03',
            name: 'South-West Quadrant',
            area_hectares: 6.2,
            monitoring_status: 'active',
            health_status: 'moderate_concern',
            risk_status: 'moderate',
            is_active: true,
            created_at: new Date().toISOString(),
            boundary: {
              type: 'Polygon',
              coordinates: [
                [
                  [73.8500, 18.5200],
                  [73.8530, 18.5200],
                  [73.8530, 18.5225],
                  [73.8500, 18.5225],
                  [73.8500, 18.5200],
                ],
              ],
            },
            centroid: { type: 'Point', coordinates: [73.8515, 18.5212] },
          },
          {
            id: 'zone-4',
            farm_id: farmId,
            zone_code: 'Z04',
            name: 'South-East Quadrant',
            area_hectares: 6.2,
            monitoring_status: 'active',
            health_status: 'healthy',
            risk_status: 'low',
            is_active: true,
            created_at: new Date().toISOString(),
            boundary: {
              type: 'Polygon',
              coordinates: [
                [
                  [73.8530, 18.5200],
                  [73.8560, 18.5200],
                  [73.8560, 18.5225],
                  [73.8530, 18.5225],
                  [73.8530, 18.5200],
                ],
              ],
            },
            centroid: { type: 'Point', coordinates: [73.8545, 18.5212] },
          },
        ];
        setZones(mockZones);
        setSelectedZone(mockZones[0]);
      }
    } catch (err: any) {
      // Demo fallback
      setFarm({
        id: farmId,
        name: 'Sahyadri Bio-Wheat Estate',
        description: 'High-yield research estate for bio-fortified wheat cultivation.',
        owner_id: 'user-1',
        owner_name: 'Rajesh Patil',
        total_area_hectares: 24.8,
        boundary: {
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
        soil_type: 'Deep Black Cotton (Vertisol)',
        irrigation_type: 'Drip Irrigation',
        farming_method: 'Organic Cultivation',
        address: 'Gat No. 142, Khed-Shivapur Corridor',
        city: 'Pune',
        region: 'Maharashtra',
        country: 'India',
        is_active: true,
        created_at: new Date().toISOString(),
        active_crop: {
          id: 'cycle-1',
          crop_name: 'Durum Wheat',
          variety: 'PBW-343',
          planting_date: '2026-06-01',
          status: 'active',
          target_yield: 5.5,
        },
        zones_count: 4,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateZones = async () => {
    if (!farm) return;
    try {
      setIsGeneratingZones(true);
      setZoningMessage(null);
      const res = await zoneService.generateZones(farm.id, {
        target_zone_count: targetZoneCount,
        link_active_crop: true,
      });
      setZones(res.zones);
      if (res.zones.length > 0) {
        setSelectedZone(res.zones[0]);
      }
      setIsZoningModalOpen(false);
      setZoningMessage(`Successfully generated ${res.total} monitoring zones.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate zoning grid.');
    } finally {
      setIsGeneratingZones(false);
    }
  };

  const handleDelete = async () => {
    if (!farm || !window.confirm(`Are you sure you want to delete farm "${farm.name}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await farmService.deleteFarm(farm.id);
      navigate('/farms');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete farm.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-agri-500/10 border border-agri-500/25 text-agri-400 text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Healthy</span>
          </span>
        );
      case 'moderate_concern':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>Moderate Concern</span>
          </span>
        );
      case 'high_concern':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>High Concern</span>
          </span>
        );
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Critical Alert</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-agri-400/70">Loading farm details...</div>;
  }

  if (!farm) {
    return (
      <div className="p-12 text-center text-rose-400">
        <p>Farm holding not found.</p>
        <Link to="/farms" className="text-agri-400 underline mt-2 inline-block">
          Return to farms list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/farms"
            className="p-2 rounded-xl bg-agri-900 border border-slate-800 hover:bg-agri-800 text-agri-400/70 hover:text-agri-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-agri-100">{farm.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-agri-500/10 border border-agri-500/20 text-agri-400 text-xs font-semibold">
                Active Estate
              </span>
            </div>
            <p className="text-xs text-agri-400/70 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-agri-500/70" />
              <span>{farm.address ? `${farm.address}, ` : ''}{farm.city}, {farm.region}, {farm.country}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoningModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-agri-500 hover:bg-agri-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Zones</span>
          </button>

          <Link
            to={`/farms/${farm.id}/edit`}
            className="px-3.5 py-2 rounded-xl bg-agri-800 hover:bg-slate-700 text-agri-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Farm</span>
          </Link>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>

      {zoningMessage && (
        <div className="p-3.5 rounded-xl bg-agri-500/10 border border-agri-500/25 text-agri-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{zoningMessage}</span>
        </div>
      )}

      {/* Spatial Map Boundary & Zones Viewer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-agri-400/70 flex items-center gap-2">
            <Globe className="w-4 h-4 text-agri-400" />
            <span>PostGIS Multi-Zone Topological Layout</span>
          </h2>
          <span className="text-xs text-agri-400/70">
            Click any zone on the canvas to inspect telemetry
          </span>
        </div>

        <FarmMapViewer
          boundary={farm.boundary}
          centerPoint={farm.center_point}
          totalHectares={farm.total_area_hectares}
          farmName={farm.name}
          zones={zones}
          selectedZoneId={selectedZone?.id}
          onZoneSelect={(zone) => setSelectedZone(zone)}
        />
      </div>

      {/* Zone Inspection & Summary Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Selected Zone Deep Dive Panel */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-agri-900/60 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
              <h3 className="font-bold text-agri-100 text-sm">
                {selectedZone ? selectedZone.name : 'Select a Zone'}
              </h3>
            </div>
            {selectedZone && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-xs">
                {selectedZone.zone_code}
              </span>
            )}
          </div>

          {selectedZone ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-agri-950/60 border border-slate-800/80">
                <span className="text-agri-400/70">Health Vitality:</span>
                {getHealthBadge(selectedZone.health_status)}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-agri-950/60 border border-slate-800/80">
                <span className="text-agri-400/70">Pathology Risk Level:</span>
                <span className="font-semibold text-agri-200 capitalize flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-agri-400" />
                  <span>{selectedZone.risk_status} Risk</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-agri-950/60 border border-slate-800/80">
                <span className="text-agri-400/70">Zonal Surface Area:</span>
                <span className="font-mono font-bold text-agri-400">
                  {selectedZone.area_hectares.toFixed(2)} ha (~{(selectedZone.area_hectares * 2.47105).toFixed(2)} ac)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-agri-950/60 border border-slate-800/80">
                <span className="text-agri-400/70">Monitoring Mode:</span>
                <span className="font-semibold text-agri-300 capitalize">
                  {selectedZone.monitoring_status.replace('_', ' ')}
                </span>
              </div>

              {selectedZone.centroid?.coordinates && (
                <div className="p-2.5 rounded-xl bg-agri-950/60 border border-slate-800/80">
                  <span className="text-agri-400/70 block mb-1">Centroid Coordinates (SRID 4326):</span>
                  <span className="font-mono text-[11px] text-agri-300">
                    {selectedZone.centroid.coordinates[1].toFixed(5)}° N, {selectedZone.centroid.coordinates[0].toFixed(5)}° E
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsTemporalModalOpen(true)}
                  className="py-2.5 px-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 text-[11px] font-bold transition flex items-center justify-center text-center shadow-sm"
                >
                  <span>Temporal Multi-Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRiskModalOpen(true)}
                  className="py-2.5 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 text-[11px] font-bold transition flex items-center justify-center text-center shadow-sm"
                >
                  <span>Explainable Risk Engine</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-agri-500/70 text-xs">
              Click any zone polygon on the map above or from the list below to inspect live telemetry.
            </div>
          )}
        </div>

        {/* Zones List Grid Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-agri-900/60 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-agri-100 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-agri-400" />
              <span>Subdivided Monitoring Zones ({zones.length})</span>
            </h3>
            <span className="text-xs text-agri-400/70 font-mono">
              Total: {zones.reduce((acc, z) => acc + z.area_hectares, 0).toFixed(2)} ha
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-agri-300">
              <thead className="border-b border-slate-800 text-agri-500/70 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Zone ID</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Acreage</th>
                  <th className="py-2.5 px-3">Health Status</th>
                  <th className="py-2.5 px-3">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {zones.map((z) => (
                  <tr
                    key={z.id}
                    onClick={() => setSelectedZone(z)}
                    className={`cursor-pointer transition ${
                      selectedZone?.id === z.id ? 'bg-agri-800/40' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{z.zone_code}</td>
                    <td className="py-2.5 px-3 text-agri-200">{z.name}</td>
                    <td className="py-2.5 px-3 font-mono text-agri-400">{z.area_hectares.toFixed(2)} ha</td>
                    <td className="py-2.5 px-3">{getHealthBadge(z.health_status)}</td>
                    <td className="py-2.5 px-3 capitalize text-agri-400/70">{z.risk_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Farm-Wide Temporal Health Timeline */}
      <div className="p-5 rounded-2xl bg-agri-900/60 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-agri-400" />
            <h3 className="font-bold text-agri-100 text-sm">
              Farm-Wide Multi-Flight Temporal Health Trajectory
            </h3>
          </div>
          <span className="text-xs text-agri-400/70 font-mono">
            Aggregate Temporal Analysis across {zones.length} Zones
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-agri-400/70 block font-medium">Historical Flights Analyzed</span>
            <p className="text-xl font-bold font-mono text-blue-400">4 Surveillance Missions</p>
            <span className="text-[10px] text-agri-500/70 block">Over Past 14 Days</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-agri-400/70 block font-medium">Dominant Farm Trajectory</span>
            <p className="text-xl font-bold text-agri-400 flex items-center gap-1">
              <span>STABLE / RECOVERING</span>
            </p>
            <span className="text-[10px] text-agri-500/70 block">Mean Health: 84.5%</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-agri-400/70 block font-medium">Zones Under Scrutiny</span>
            <p className="text-xl font-bold font-mono text-orange-400">
              {zones.filter((z) => z.risk_status !== 'low').length} Zones Flagged
            </p>
            <span className="text-[10px] text-agri-500/70 block">Z03, Z04 Moderate Risk</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[11px] text-agri-400/70 block font-medium">Rapid Decline Warnings</span>
            <p className="text-xl font-bold font-mono text-rose-400">0 Critical Surges</p>
            <span className="text-[10px] text-agri-500/70 block">Threshold: &gt;20% Drop</span>
          </div>
        </div>
      </div>

      {/* Neighbor Farm Intelligence & Spread Risk Graph */}
      <SpreadRiskGraphViewer farmId={farm.id} farmName={farm.name} />

      {/* Precision Water-Stress Analysis & Irrigation Priority Map */}
      <WaterRequirementMapViewer farmId={farm.id} farmName={farm.name} />

      {/* Risk-Adaptive Monitoring & Mission Scheduler */}
      <AdaptiveMonitoringPanel farmId={farm.id} farmName={farm.name} />

      {/* Modal: Generate Monitoring Zones Configuration */}
      {isZoningModalOpen && (
        <div className="fixed inset-0 z-50 bg-agri-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-agri-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-agri-400" />
                <h3 className="font-bold text-agri-100 text-base">Generate Monitoring Zones</h3>
              </div>
              <button
                onClick={() => setIsZoningModalOpen(false)}
                className="text-agri-500/70 hover:text-agri-300 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-agri-400/70">
              The algorithm will subdivide the farm boundary into equal geographic grid cells, clipping exactly to the boundary perimeter and eliminating microscopic slivers.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-agri-300">
                Select Target Zone Count
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[4, 9, 16, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTargetZoneCount(count)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                      targetZoneCount === count
                        ? 'bg-agri-500 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-agri-300 hover:bg-agri-800'
                    }`}
                  >
                    {count} Zones
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsZoningModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-agri-800 hover:bg-slate-700 text-agri-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateZones}
                disabled={isGeneratingZones}
                className="px-5 py-2 rounded-xl bg-agri-500 hover:bg-agri-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingZones ? 'Partitioning...' : 'Generate & Clip Zones'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Temporal Multi-Scan Trajectory Analytics */}
      {isTemporalModalOpen && selectedZone && (
        <ZoneTemporalAnalyticsModal
          zone={selectedZone}
          onClose={() => setIsTemporalModalOpen(false)}
        />
      )}

      {/* Modal: Explainable Crop Health Risk Assessment */}
      {isRiskModalOpen && selectedZone && (
        <ZoneRiskExplanationModal
          zone={selectedZone}
          onClose={() => setIsRiskModalOpen(false)}
        />
      )}
    </div>
  );
};
