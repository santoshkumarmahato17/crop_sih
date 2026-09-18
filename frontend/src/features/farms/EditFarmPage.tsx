import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Layers, AlertCircle } from 'lucide-react';
import { FarmMapDrawer } from '@/components/map/FarmMapDrawer';
import { farmService } from '@/services/farmService';
import { UpdateFarmPayload } from '@/types';

export const EditFarmPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('India');
  const [soilType, setSoilType] = useState('');
  const [irrigationType, setIrrigationType] = useState('drip');
  const [farmingMethod, setFarmingMethod] = useState('organic');

  const [initialCoords, setInitialCoords] = useState<[number, number][][] | undefined>(undefined);
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState<any>(null);
  const [calculatedAreaHa, setCalculatedAreaHa] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadFarm(id);
    }
  }, [id]);

  const loadFarm = async (farmId: string) => {
    try {
      setIsLoading(true);
      const farm = await farmService.getFarm(farmId);
      setName(farm.name);
      setDescription(farm.description || '');
      setAddress(farm.address || '');
      setCity(farm.city || '');
      setRegion(farm.region || '');
      setCountry(farm.country || 'India');
      setSoilType(farm.soil_type || '');
      setIrrigationType(farm.irrigation_type || 'drip');
      setFarmingMethod(farm.farming_method || 'organic');
      setCalculatedAreaHa(farm.total_area_hectares);

      if (farm.boundary && farm.boundary.coordinates) {
        if (farm.boundary.type === 'Polygon') {
          setInitialCoords(farm.boundary.coordinates);
        } else if (farm.boundary.type === 'MultiPolygon') {
          setInitialCoords(farm.boundary.coordinates[0]);
        }
      }
    } catch (err: any) {
      setErrorMessage('Failed to load farm details for editing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePolygonChange = (geojson: any, areaHa: number) => {
    setBoundaryGeoJSON(geojson);
    if (areaHa > 0) {
      setCalculatedAreaHa(areaHa);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMessage(null);

    const payload: UpdateFarmPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      region: region.trim() || undefined,
      country: country.trim() || undefined,
      soil_type: soilType,
      irrigation_type: irrigationType,
      farming_method: farmingMethod,
      boundary: boundaryGeoJSON || undefined,
    };

    try {
      setIsSubmitting(true);
      await farmService.updateFarm(id, payload);
      navigate(`/farms/${id}`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update farm holding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-agri-400/70">Loading farm for editing...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/farms/${id}`}
          className="p-2 rounded-xl bg-agri-900 border border-slate-800 hover:bg-agri-800 text-agri-400/70 hover:text-agri-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-agri-100">Edit Farm Holding</h1>
          <p className="text-xs text-agri-400/70">Update farm attributes or adjust boundary perimeter.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Spatial Boundary Modification */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-agri-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-agri-400" />
              <span>Boundary Adjustment</span>
            </h2>

            {calculatedAreaHa > 0 && (
              <span className="text-xs font-mono font-bold text-agri-400 px-3 py-1 rounded-full bg-agri-500/10 border border-agri-500/25">
                Acreage: {calculatedAreaHa.toFixed(2)} ha
              </span>
            )}
          </div>

          <FarmMapDrawer
            initialPolygon={initialCoords}
            onPolygonChange={handlePolygonChange}
          />
        </div>

        {/* Identity & Soil */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-agri-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-agri-400" />
            <span>Farm Metadata</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Farm Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Address / Gat No.</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to={`/farms/${id}`}
            className="px-5 py-2.5 rounded-xl bg-agri-900 border border-slate-800 hover:bg-agri-800 text-agri-300 font-medium text-sm transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-agri-500 hover:bg-agri-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Changes...' : 'Save Farm Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
