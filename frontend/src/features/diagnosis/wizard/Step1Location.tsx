import React, { useEffect, useState } from 'react';
import { MapPin, ChevronRight, Plus, CheckCircle2, AlertTriangle, RefreshCw, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiagnosisWizard } from './DiagnosisWizardContext';
import { farmService } from '@/services/farmService';
import { zoneService } from '@/services/zoneService';
import { Farm, Zone } from '@/types';

interface Props {
  onNext: () => void;
}

export const Step1Location: React.FC<Props> = ({ onNext }) => {
  const navigate = useNavigate();
  const {
    farms, setFarms,
    selectedFarmId, setSelectedFarmId,
    zones, setZones,
    selectedZoneId, setSelectedZoneId,
    latitude, longitude, locationName, locationStatus, setLocationData,
  } = useDiagnosisWizard();

  const [isLoadingFarms, setIsLoadingFarms] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualLocInput, setShowManualLocInput] = useState(false);
  const [manualCity, setManualCity] = useState('');

  // Quick Farm Creation Modal State (in case user wants to add farm directly)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickFarmName, setQuickFarmName] = useState('');
  const [quickCropName, setQuickCropName] = useState('Tomato');
  const [isCreatingFarm, setIsCreatingFarm] = useState(false);

  useEffect(() => {
    loadInitialFarms();
  }, []);

  const loadInitialFarms = async () => {
    setIsLoadingFarms(true);
    setError(null);
    try {
      const res = await farmService.listFarms();
      let fetchedFarms = res.farms || [];

      // Fallback: If array is empty, check if there are locally stored created farms
      if (fetchedFarms.length === 0) {
        const storedLocal = localStorage.getItem('kisan_sathi_local_farms');
        if (storedLocal) {
          try {
            fetchedFarms = JSON.parse(storedLocal);
          } catch {
            // ignore JSON error
          }
        }
      }

      setFarms(fetchedFarms);

      if (fetchedFarms.length > 0) {
        const currentFarm = fetchedFarms.find(f => f.id === selectedFarmId) || fetchedFarms[0];
        setSelectedFarmId(currentFarm.id);
        loadZones(currentFarm.id);
        
        // Auto-extract location from farm if available
        if (currentFarm.city || currentFarm.region || currentFarm.address) {
          const locString = [currentFarm.address, currentFarm.city, currentFarm.region].filter(Boolean).join(', ');
          if (locationStatus === 'NOT_REQUESTED') {
            setLocationData({
              locationName: locString || currentFarm.name,
              locationStatus: 'GRANTED',
              latitude: 18.5204,
              longitude: 73.8567,
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch farms from server API, using fallback baseline.', err);
      // Ensure we don't crash if network fails
      setError('Unable to load farms from backend. Please check your connection.');
    } finally {
      setIsLoadingFarms(false);
    }
  };

  const loadZones = async (fId: string) => {
    setIsLoadingZones(true);
    try {
      const res = await zoneService.listZones(fId);
      let fetchedZones = res.zones || [];

      // If selected farm has no zones in API, provide default plot zone so user is never stuck
      if (fetchedZones.length === 0) {
        const targetFarm = farms.find((f) => f.id === fId);
        fetchedZones = [
          {
            id: `${fId}-zone-1`,
            farm_id: fId,
            name: 'Zone A — Main Field',
            area_hectares: (targetFarm as any)?.calculated_area_hectares || 1.2,
            crop_type: (targetFarm as any)?.crop_info?.common_name || '',
          } as any,
        ];
      }

      setZones(fetchedZones);
      if (fetchedZones.length > 0) {
        setSelectedZoneId(fetchedZones[0].id);
      }
    } catch (err) {
      console.warn('Failed to load zones for farm:', fId, err);
      // Fallback zone
      const fallbackZone: Zone = {
        id: `${fId}-zone-default`,
        farm_id: fId,
        name: 'Zone A — Main Cultivation Plot',
        area_hectares: 1.0,
      } as any;
      setZones([fallbackZone]);
      setSelectedZoneId(fallbackZone.id);
    } finally {
      setIsLoadingZones(false);
    }
  };

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fId = e.target.value;
    setSelectedFarmId(fId);
    if (fId) {
      loadZones(fId);
      const farmObj = farms.find((f) => f.id === fId);
      if (farmObj && (farmObj.city || farmObj.region)) {
        setLocationData({
          locationName: `${farmObj.name} (${[farmObj.city, farmObj.region].filter(Boolean).join(', ')})`,
          locationStatus: 'GRANTED',
        });
      }
    }
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationData({ locationStatus: 'UNAVAILABLE' });
      return;
    }

    setLocationData({ locationStatus: 'NOT_REQUESTED' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationData({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          locationName: `GPS (${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E)`,
          locationStatus: 'GRANTED',
        });
      },
      (err) => {
        console.warn('Geolocation permission error:', err);
        setLocationData({ locationStatus: 'DENIED' });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSaveManualLocation = () => {
    if (manualCity.trim()) {
      setLocationData({
        locationName: manualCity.trim(),
        locationStatus: 'MANUAL',
      });
      setShowManualLocInput(false);
    }
  };

  const handleQuickAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFarmName.trim()) return;

    setIsCreatingFarm(true);
    try {
      const newFarmObj: Farm = {
        id: `farm-${Date.now()}`,
        name: quickFarmName.trim(),
        description: 'Registered via Symptom Disease ID',
        calculated_area_hectares: 1.5,
        boundary: { type: 'Polygon', coordinates: [] },
        city: 'Pune',
        region: 'Maharashtra',
        country: 'India',
        soil_type: 'Black Cotton Clay Loam',
        soil_ph: 6.8,
        irrigation_type: 'drip',
        farming_method: 'organic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: 'current-user',
        crop_cycles: [],
      } as any;

      // Try server API first
      try {
        await farmService.createFarm({
          name: quickFarmName.trim(),
          soil_type: 'Black Cotton Clay Loam',
          boundary: { type: 'Polygon', coordinates: [[[73.8, 18.5], [73.81, 18.5], [73.81, 18.51], [73.8, 18.51], [73.8, 18.5]]]},
          crop_info: { common_name: quickCropName, planting_date: new Date().toISOString().split('T')[0] }
        });
      } catch {
        // Fallback to local persistence if offline
        const existingLocal = JSON.parse(localStorage.getItem('kisan_sathi_local_farms') || '[]');
        existingLocal.unshift(newFarmObj);
        localStorage.setItem('kisan_sathi_local_farms', JSON.stringify(existingLocal));
      }

      // Update state
      const updatedFarms = [newFarmObj, ...farms];
      setFarms(updatedFarms);
      setSelectedFarmId(newFarmObj.id);

      // Create fallback zone
      const newZone: Zone = {
        id: `${newFarmObj.id}-zone-1`,
        farm_id: newFarmObj.id,
        name: 'Zone A — Main Field',
        area_hectares: 1.5,
      } as any;
      setZones([newZone]);
      setSelectedZoneId(newZone.id);

      setShowQuickAddModal(false);
      setQuickFarmName('');
    } catch (err) {
      console.error('Error creating quick farm:', err);
    } finally {
      setIsCreatingFarm(false);
    }
  };

  const canProceed = selectedFarmId !== '' && selectedZoneId !== '';

  const selectedFarmObj = farms.find((f) => f.id === selectedFarmId);
  const selectedZoneObj = zones.find((z) => z.id === selectedZoneId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Step Title Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
          <MapPin className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
          <span>Farm & Zone Selection</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select the farm holding, zone, and location context where symptoms were observed.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadInitialFarms} className="text-xs font-bold underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* No Farms State */}
      {!isLoadingFarms && farms.length === 0 ? (
        <div className="p-8 rounded-2xl bg-amber-50/60 dark:bg-[#201815] border border-amber-200/80 dark:border-amber-900/40 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-inner">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white font-display">No Farms Found</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              You haven't registered any farm holdings yet. Add your first farm holding to continue with crop disease diagnosis.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowQuickAddModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Quick Add Farm Here</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/farms/new')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs transition"
            >
              Full Farm Registration Page
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Farm Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Select Farm *
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(true)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Farm
              </button>
            </div>
            <select
              value={selectedFarmId}
              onChange={handleFarmChange}
              disabled={isLoadingFarms}
              className="w-full bg-slate-50 dark:bg-[#1b1718] border border-slate-300 dark:border-[#382d33] rounded-xl p-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
            >
              {isLoadingFarms ? (
                <option>Loading farms...</option>
              ) : (
                farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    🏡 {f.name} {f.city ? `(${f.city})` : ''} — {(f as any).calculated_area_hectares || (f as any).area_hectares || 1.0} ha
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Zone Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Zone / Plot *
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              disabled={!selectedFarmId || isLoadingZones}
              className="w-full bg-slate-50 dark:bg-[#1b1718] border border-slate-300 dark:border-[#382d33] rounded-xl p-3 text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
            >
              {isLoadingZones ? (
                <option>Loading zones...</option>
              ) : (
                zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    📍 {z.name} ({(z as any).crop_type || 'Active Plot'})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}

      {/* Location Enablement Section */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1b1718] border border-slate-200 dark:border-[#34292e] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Farm Location & GPS Context
            </h3>
          </div>
          {locationStatus === 'GRANTED' && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              ACTIVE
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400">
          Allow KISAN SATHI to access location to identify your farm location and improve regional disease-risk analysis.
        </p>

        {/* Location Status State 1: Granted */}
        {(locationStatus === 'GRANTED' || locationStatus === 'MANUAL') && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <div className="font-extrabold text-sm">✓ Farm Location Available</div>
                <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                  {locationName || (latitude ? `GPS (${latitude.toFixed(4)}° N, ${longitude?.toFixed(4)}° E)` : 'Saved Farm Coordinates')}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={requestBrowserLocation}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition"
            >
              Re-Detect GPS
            </button>
          </div>
        )}

        {/* Location Status State 2: Not Requested */}
        {locationStatus === 'NOT_REQUESTED' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={requestBrowserLocation}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Enable Location</span>
            </button>
            <button
              type="button"
              onClick={() => setShowManualLocInput(true)}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#2b2226] text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-[#382b31] transition"
            >
              Enter Location Manually
            </button>
          </div>
        )}

        {/* Location Status State 3: Denied or Unavailable */}
        {(locationStatus === 'DENIED' || locationStatus === 'UNAVAILABLE') && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Location permission was denied or device location is unavailable.</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={requestBrowserLocation}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => setShowManualLocInput(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-[#2b2226] text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
              >
                Enter Location Manually
              </button>
            </div>
          </div>
        )}

        {/* Manual Location Input Expandable Form */}
        {showManualLocInput && (
          <div className="p-3 bg-white dark:bg-[#141112] rounded-xl border border-slate-200 dark:border-[#382d33] space-y-2 pt-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              City / District / Region
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Pune, Maharashtra"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#241c20] border border-slate-300 dark:border-[#382d33] rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveManualLocation}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Farm Location Confirmation Card */}
      {selectedFarmObj && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#171415] border border-slate-200 dark:border-[#2b2226] flex items-center justify-between text-xs">
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white text-sm">
              {selectedFarmObj.name}
            </div>
            <div className="text-slate-500 dark:text-slate-400 mt-0.5">
              Selected Zone: <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedZoneObj?.name || 'Main Zone'}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">
              Ready for Analysis
            </span>
          </div>
        </div>
      )}

      {/* Next Action Bar */}
      <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-800 mt-8">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-950/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Next: Crop Details</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Farm Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1b1718] border border-slate-200 dark:border-[#382d33] p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-display">
              + Quick Add Farm Holding
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your farm holding name and primary crop to continue with disease diagnosis.
            </p>

            <form onSubmit={handleQuickAddFarm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Farm Holding Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Valley Plot #1"
                  value={quickFarmName}
                  onChange={(e) => setQuickFarmName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#241c20] border border-slate-300 dark:border-[#382d33] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Crop
                </label>
                <select
                  value={quickCropName}
                  onChange={(e) => setQuickCropName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#241c20] border border-slate-300 dark:border-[#382d33] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Apple">Apple</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Corn">Corn</option>
                  <option value="Cotton">Cotton</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#282023] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFarm}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingFarm ? 'Creating...' : 'Save & Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
