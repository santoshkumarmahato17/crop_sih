import React, { useEffect, useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { useDiagnosisWizard } from './DiagnosisWizardContext';
import { farmService } from '@/services/farmService';
import { zoneService } from '@/services/zoneService';

interface Props {
  onNext: () => void;
}

export const Step1Location: React.FC<Props> = ({ onNext }) => {
  const {
    farms, setFarms,
    selectedFarmId, setSelectedFarmId,
    zones, setZones,
    selectedZoneId, setSelectedZoneId
  } = useDiagnosisWizard();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (farms.length === 0) {
      loadInitialFarms();
    }
  }, []);

  const loadInitialFarms = async () => {
    setIsLoading(true);
    try {
      const res = await farmService.listFarms();
      setFarms(res.farms);
      if (res.farms.length > 0) {
        setSelectedFarmId(res.farms[0].id);
        loadZones(res.farms[0].id);
      }
    } catch (err) {
      setError('Failed to load farms.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadZones = async (fId: string) => {
    try {
      const res = await zoneService.listZones(fId);
      setZones(res.zones);
      if (res.zones.length > 0) {
        setSelectedZoneId(res.zones[0].id);
      }
    } catch (err) {
      setError('Failed to load zones.');
    }
  };

  const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fId = e.target.value;
    setSelectedFarmId(fId);
    loadZones(fId);
  };

  const canProceed = selectedFarmId !== '' && selectedZoneId !== '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <MapPin className="text-emerald-600" />
          Location Selection
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Select the farm and specific zone where the symptoms were observed.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Farm Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">Select Farm</label>
          <select
            value={selectedFarmId}
            onChange={handleFarmChange}
            disabled={isLoading}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {isLoading ? (
              <option>Loading farms...</option>
            ) : farms.length === 0 ? (
              <option value="">No farms available</option>
            ) : (
              farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Zone Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">Select Zone</label>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            disabled={!selectedFarmId || zones.length === 0}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {zones.length === 0 ? (
              <option value="">No zones available</option>
            ) : (
              zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} - {(z as any).crop_type || 'Zone'} ({z.area_hectares} ha)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t mt-8">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Crop Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
