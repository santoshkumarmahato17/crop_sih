import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Sprout, Layers, AlertCircle } from 'lucide-react';
import { FarmMapDrawer } from '@/components/map/FarmMapDrawer';
import { farmService } from '@/services/farmService';
import { CreateFarmPayload } from '@/types';

export const CreateFarmPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Pune');
  const [region, setRegion] = useState('Maharashtra');
  const [country, setCountry] = useState('India');
  const [soilType, setSoilType] = useState('Black Cotton Clay Loam');
  const [soilPh, setSoilPh] = useState(6.8);
  const [irrigationType, setIrrigationType] = useState('drip');
  const [farmingMethod, setFarmingMethod] = useState('organic');

  // Crop Information
  const [cropName, setCropName] = useState('Wheat');
  const [variety, setVariety] = useState('PBW-343');
  const [plantingDate, setPlantingDate] = useState('2026-06-01');
  const [growthStage, setGrowthStage] = useState('Tillering');
  const [targetYield, setTargetYield] = useState(5.2);

  // Boundary State
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState<any>(null);
  const [calculatedAreaHa, setCalculatedAreaHa] = useState<number>(0);

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePolygonChange = (geojson: any, areaHa: number) => {
    setBoundaryGeoJSON(geojson);
    setCalculatedAreaHa(areaHa);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Farm designation name is required.');
      return;
    }

    if (!boundaryGeoJSON) {
      setErrorMessage('Please draw a valid closed boundary polygon on the interactive map.');
      return;
    }

    if (calculatedAreaHa < 0.01) {
      setErrorMessage('Farm boundary area must be at least 0.01 hectares.');
      return;
    }

    const payload: CreateFarmPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      boundary: boundaryGeoJSON,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      region: region.trim() || undefined,
      country: country.trim() || undefined,
      soil_type: soilType,
      soil_ph: soilPh,
      irrigation_type: irrigationType,
      farming_method: farmingMethod,
      crop_info: {
        common_name: cropName.trim(),
        variety: variety.trim() || undefined,
        planting_date: plantingDate,
        growth_stage: growthStage,
        target_yield_tonnes_per_hectare: targetYield || undefined,
      },
    };

    try {
      setIsSubmitting(true);
      const created = await farmService.createFarm(payload);
      navigate(`/farms/${created.id}`);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to create farm holding.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/farms"
            className="p-2 rounded-xl bg-agri-900 border border-slate-800 hover:bg-agri-800 text-agri-400/70 hover:text-agri-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-agri-100">Register Farm Holding</h1>
            <p className="text-xs text-agri-400/70">
              Draw farm boundaries with PostGIS SRID 4326 and attach active crop cycles.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Spatial Boundary Mapping */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-agri-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-agri-400" />
              <span>1. Geospatial Farm Boundary (PostGIS)</span>
            </h2>

            {calculatedAreaHa > 0 && (
              <span className="text-xs font-mono font-bold text-agri-400 px-3 py-1 rounded-full bg-agri-500/10 border border-agri-500/25">
                Authoritative Area: {calculatedAreaHa.toFixed(2)} ha
              </span>
            )}
          </div>

          <p className="text-xs text-agri-400/70">
            Use the interactive tool below to plot farm perimeter vertices. The system calculates surface acreage automatically.
          </p>

          <FarmMapDrawer onPolygonChange={handlePolygonChange} />
        </div>

        {/* Section 2: General Farm Information */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-agri-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-agri-400" />
            <span>2. Farm Identity & Agronomic Baseline</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">
                Farm Holding Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sahyadri Bio-Wheat Estate"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">
                Description / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Organic cultivation plot"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">
                Street Address / Gat No.
              </label>
              <input
                type="text"
                placeholder="e.g. Gat No. 142, Pune Highway"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">City / Tehsil</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">State / Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Soil Classification</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              >
                <option value="Black Cotton Clay Loam">Black Cotton Clay Loam (Vertisol)</option>
                <option value="Red Sandy Loam">Red Sandy Loam (Alfisol)</option>
                <option value="Alluvial Silt Loam">Alluvial Silt Loam (Inceptisol)</option>
                <option value="Laterite Clay">Laterite Clay (Oxisol)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Soil pH</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={soilPh}
                onChange={(e) => setSoilPh(parseFloat(e.target.value) || 7.0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Irrigation Method</label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              >
                <option value="drip">Drip Irrigation</option>
                <option value="sprinkler">Micro-Sprinkler</option>
                <option value="flood">Flood / Furrow</option>
                <option value="rainfed">Rainfed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Farming Method</label>
              <select
                value={farmingMethod}
                onChange={(e) => setFarmingMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              >
                <option value="organic">Organic</option>
                <option value="conventional">Conventional</option>
                <option value="regenerative">Regenerative</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Active Crop Cycle */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-agri-100 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-agri-400" />
            <span>3. Active Sowing & Crop Cycle</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Crop Species *</label>
              <input
                type="text"
                required
                placeholder="e.g. Wheat, Rice, Cotton"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Cultivar / Variety</label>
              <input
                type="text"
                placeholder="e.g. PBW-343, Basmati-1121"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Sowing Date *</label>
              <input
                type="date"
                required
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Growth Stage</label>
              <input
                type="text"
                placeholder="e.g. Tillering, Flowering"
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-agri-300 mb-1">Target Yield (Tonnes/Ha)</label>
              <input
                type="number"
                step="0.1"
                value={targetYield}
                onChange={(e) => setTargetYield(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-agri-100 focus:outline-none focus:border-agri-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/farms"
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
            <span>{isSubmitting ? 'Registering Farm...' : 'Register Farm & Boundary'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
