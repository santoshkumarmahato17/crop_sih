import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  MapPin,
  Sprout,
  Layers,
  AlertCircle,
  Navigation,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { FarmMapDrawer } from '@/components/map/FarmMapDrawer';
import { farmService } from '@/services/farmService';
import { CreateFarmPayload } from '@/types';

export const CreateFarmPage: React.FC = () => {
  const navigate = useNavigate();

  // Basic Identity
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Location Fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Pune');
  const [region, setRegion] = useState('Maharashtra');
  const [country, setCountry] = useState('India');
  const [lat, setLat] = useState<number>(18.5204);
  const [lng, setLng] = useState<number>(73.8567);

  // Geolocation state
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE'>('IDLE');
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

  // Size & Units
  const [farmSize, setFarmSize] = useState<number>(5);
  const [areaUnit, setAreaUnit] = useState<'Acres' | 'Hectares'>('Acres');

  // Soil & Cultivation baseline
  const [soilType, setSoilType] = useState('Black Cotton Clay Loam');
  const [soilPh, setSoilPh] = useState(6.8);
  const [irrigationType, setIrrigationType] = useState('drip');
  const [farmingMethod, setFarmingMethod] = useState('organic');

  // Crop Information
  const [cropName, setCropName] = useState('Tomato');
  const [variety, setVariety] = useState('Abhinav Hyb-3');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [growthStage, setGrowthStage] = useState('Vegetative');
  const [targetYield, setTargetYield] = useState(5.2);

  // Boundary State
  const [boundaryGeoJSON, setBoundaryGeoJSON] = useState<any>(null);
  const [drawnAreaHa, setDrawnAreaHa] = useState<number>(0);

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Convert farmSize to hectares
  const getHectares = (): number => {
    if (drawnAreaHa > 0) return drawnAreaHa;
    const sizeNum = Math.max(farmSize || 0, 0.1);
    return areaUnit === 'Acres' ? Math.round((sizeNum * 0.404686) * 100) / 100 : sizeNum;
  };

  const createCenteredPolygon = (centerLng: number, centerLat: number, hectares: number) => {
    const sideDeg = Math.sqrt(Math.max(hectares, 0.1)) * 0.0009;
    const minLng = Number((centerLng - sideDeg / 2).toFixed(6));
    const maxLng = Number((centerLng + sideDeg / 2).toFixed(6));
    const minLat = Number((centerLat - sideDeg / 2).toFixed(6));
    const maxLat = Number((centerLat + sideDeg / 2).toFixed(6));
    return {
      type: 'Polygon',
      coordinates: [
        [
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ],
      ],
    };
  };

  // Enable Browser Geolocation
  const handleEnableLocation = () => {
    setIsLocating(true);
    setLocationFeedback(null);
    setErrorMessage(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const latitude = Number(pos.coords.latitude.toFixed(6));
          const longitude = Number(pos.coords.longitude.toFixed(6));
          setLat(latitude);
          setLng(longitude);
          setLocationStatus('GRANTED');
          setLocationFeedback(`📍 Live GPS Location Detected: ${latitude}° N, ${longitude}° E`);

          if (!boundaryGeoJSON) {
            const autoPoly = createCenteredPolygon(longitude, latitude, getHectares());
            setBoundaryGeoJSON(autoPoly);
          }
        },
        (err) => {
          setIsLocating(false);
          if (err.code === err.PERMISSION_DENIED) {
            setLocationStatus('DENIED');
            setLocationFeedback('⚠️ Location permission denied. Please enter address manually below.');
          } else {
            setLocationStatus('UNAVAILABLE');
            setLocationFeedback('⚠️ Location service unavailable. Please enter address manually below.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocating(false);
      setLocationStatus('UNAVAILABLE');
      setLocationFeedback('⚠️ Geolocation is not supported by your browser. Please enter address manually below.');
    }
  };

  const handlePolygonChange = (geojson: any, areaHa: number) => {
    setBoundaryGeoJSON(geojson);
    setDrawnAreaHa(areaHa);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Farm designation name is required.');
      return;
    }

    const effectiveHectares = getHectares();
    let finalBoundary = boundaryGeoJSON;

    if (!finalBoundary) {
      finalBoundary = createCenteredPolygon(lng, lat, effectiveHectares);
      setBoundaryGeoJSON(finalBoundary);
    }

    const payload: CreateFarmPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      boundary: finalBoundary,
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
      await farmService.createFarm(payload);
      setSuccessMessage('✓ Farm added successfully');

      setTimeout(() => {
        navigate('/farms');
      }, 1200);
    } catch {
      setErrorMessage('Unable to save farm. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#071A1D] text-[#12302E] dark:text-[#E6F5F0] p-4 sm:p-6 space-y-6 rounded-3xl border border-[#D4E8DF]/60 dark:border-[#214A47]/60 shadow-sm transition-colors duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4E8DF] dark:border-[#214A47]">
        <div className="flex items-center gap-3">
          <Link
            to="/farms"
            className="p-2.5 rounded-xl bg-[#E8F5EF] dark:bg-[#123B35] border border-[#B9D8CA] dark:border-[#28504D] hover:bg-[#D8ECE3] dark:hover:bg-[#1a4a43] text-[#00695C] dark:text-[#8FE0C1] transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#00695C] dark:text-[#8FE0C1] flex items-center gap-2 tracking-tight">
              <Sprout className="w-6 h-6 text-[#2FA36B] dark:text-[#5CCFA0]" />
              <span>Add Farm Holding</span>
            </h1>
            <p className="text-xs text-[#5F7775] dark:text-[#9DBBB5] mt-0.5 font-medium">
              Register a new farm plot, location coordinates, surface area, and primary crop cycle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEnableLocation}
            disabled={isLocating}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-bold border transition ${
              locationStatus === 'GRANTED'
                ? 'bg-[#E8F5EF] dark:bg-[#123B35] border-[#B9D8CA] dark:border-[#28504D] text-[#00695C] dark:text-[#8FE0C1]'
                : 'bg-[#E8F5EF] dark:bg-[#123B35] hover:bg-[#D8ECE3] dark:hover:bg-[#1a4a43] border border-[#B9D8CA] dark:border-[#28504D] text-[#00695C] dark:text-[#8FE0C1]'
            }`}
          >
            {isLocating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#2FA36B] dark:text-[#5CCFA0]" />
            ) : (
              <Navigation className="w-4 h-4 text-[#2FA36B] dark:text-[#5CCFA0]" />
            )}
            <span>{isLocating ? 'Detecting Location...' : '[ Enable Location ]'}</span>
          </button>
        </div>
      </div>

      {/* Location Feedback Banner */}
      {locationFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
            locationStatus === 'GRANTED'
              ? 'bg-[#E8F5EF] dark:bg-[#123B35] border-[#B9D8CA] dark:border-[#28504D] text-[#00695C] dark:text-[#8FE0C1]'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {locationStatus === 'GRANTED' ? (
              <CheckCircle2 className="w-4 h-4 text-[#2FA36B] dark:text-[#5CCFA0] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
            <span>{locationFeedback}</span>
          </div>

          {(locationStatus === 'DENIED' || locationStatus === 'UNAVAILABLE') && (
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-mono">Manual location allowed</span>
          )}
        </div>
      )}

      {/* Success Notification Toast */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#087B62] dark:bg-[#2FA36B] text-white font-bold text-sm shadow-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage} — Opening My Farm...</span>
        </div>
      )}

      {/* Error Banner with Retry */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-3.5 py-1.5 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General Farm Identity */}
        <div className="p-6 rounded-[16px] bg-white dark:bg-[#0D2729] border border-[#D4E8DF] dark:border-[#214A47] space-y-4 shadow-sm">
          <h2 className="text-base font-extrabold text-[#00695C] dark:text-[#8FE0C1] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#2FA36B] dark:text-[#5CCFA0]" />
            <span>1. Farm Identity & Land Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Farm Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Green Valley Farm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] placeholder-[#78908D] dark:placeholder-[#76938E] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Primary Crop *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tomato, Wheat, Cotton, Sugarcane"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] placeholder-[#78908D] dark:placeholder-[#76938E] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                  Farm Size *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={farmSize}
                  onChange={(e) => setFarmSize(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] placeholder-[#78908D] dark:placeholder-[#76938E] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                  Area Unit *
                </label>
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as 'Acres' | 'Hectares')}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#164A42] dark:text-[#E6F5F0] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none font-medium"
                >
                  <option value="Acres">Acres</option>
                  <option value="Hectares">Hectares</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Calculated Equivalent Area
              </label>
              <div className="px-4 py-2.5 rounded-xl bg-[#F4FAF7] dark:bg-[#102F31] border border-[#D4E8DF] dark:border-[#28504D] text-sm font-mono text-[#00695C] dark:text-[#8FE0C1] font-bold flex items-center justify-between">
                <span>{getHectares().toFixed(2)} Hectares</span>
                <span className="text-xs text-[#5F7775] dark:text-[#9DBBB5] font-normal">
                  (~{areaUnit === 'Acres' ? farmSize : (farmSize * 2.47105).toFixed(1)} Acres)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Crop Variety (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Abhinav Hyb-3, PBW-343"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] placeholder-[#78908D] dark:placeholder-[#76938E] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Soil Type (Optional)
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#164A42] dark:text-[#E6F5F0] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              >
                <option value="Black Cotton Clay Loam">Black Cotton Soil (Regur Clay)</option>
                <option value="Red Sandy Loam">Red & Yellow Sandy Clay</option>
                <option value="Alluvial Silt Loam">River Basin Alluvial Loam</option>
                <option value="Laterite Clay">Laterite Soil (Jambha)</option>
                <option value="Medium Shallow Loam">Medium Shallow Loam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Soil pH
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={soilPh}
                onChange={(e) => setSoilPh(parseFloat(e.target.value) || 7.0)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] placeholder-[#78908D] dark:placeholder-[#76938E] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Irrigation Type (Optional)
              </label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#164A42] dark:text-[#E6F5F0] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              >
                <option value="drip">Drip Irrigation</option>
                <option value="sprinkler">Micro-Sprinkler</option>
                <option value="flood">Flood / Furrow</option>
                <option value="rainfed">Rainfed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Farming Method
              </label>
              <select
                value={farmingMethod}
                onChange={(e) => setFarmingMethod(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#164A42] dark:text-[#E6F5F0] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              >
                <option value="organic">Organic</option>
                <option value="conventional">Conventional</option>
                <option value="regenerative">Regenerative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Sowing Date
              </label>
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Growth Stage
              </label>
              <input
                type="text"
                placeholder="e.g. Vegetative, Flowering"
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] placeholder-[#78908D] dark:placeholder-[#76938E] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Target Yield (Tonnes/Ha)
              </label>
              <input
                type="number"
                step="0.1"
                value={targetYield}
                onChange={(e) => setTargetYield(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] placeholder-[#78908D] dark:placeholder-[#76938E] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Notes & Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Primary commercial harvest plot"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] placeholder-[#78908D] dark:placeholder-[#76938E] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Location & Coordinates */}
        <div className="p-6 rounded-[16px] bg-white dark:bg-[#0D2729] border border-[#D4E8DF] dark:border-[#214A47] space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#00695C] dark:text-[#8FE0C1] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2FA36B] dark:text-[#5CCFA0]" />
                <span>2. Location & Geographic Address</span>
              </h2>
              <p className="text-xs text-[#5F7775] dark:text-[#9DBBB5] mt-0.5">
                Click [ Enable Location ] to automatically set coordinates, or enter address manually.
              </p>
            </div>

            <button
              type="button"
              onClick={handleEnableLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-[#E8F5EF] dark:bg-[#123B35] hover:bg-[#D8ECE3] dark:hover:bg-[#1a4a43] border border-[#B9D8CA] dark:border-[#28504D] text-[#00695C] dark:text-[#8FE0C1] text-xs font-bold transition self-start sm:self-auto"
            >
              <Navigation className="w-3.5 h-3.5 text-[#2FA36B] dark:text-[#5CCFA0]" />
              <span>Use Current GPS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Street Address / Gat No.
              </label>
              <input
                type="text"
                placeholder="e.g. Gat No. 142, Khed Highway"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] placeholder-[#78908D] dark:placeholder-[#76938E] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                City / District
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                State / Region
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm text-[#173B38] dark:text-[#E6F5F0] focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Latitude Coordinate
              </label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm font-mono text-[#00695C] dark:text-[#8FE0C1] font-semibold focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244D4A] dark:text-[#B7D3CD] mb-1">
                Longitude Coordinate
              </label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] text-sm font-mono text-[#00695C] dark:text-[#8FE0C1] font-semibold focus:border-[#2FA36B] dark:focus:border-[#2FA36B] focus:ring-2 focus:ring-[#2FA36B]/20 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Interactive Farm Boundary Map */}
        <div className="p-6 rounded-[16px] bg-white dark:bg-[#0D2729] border border-[#D4E8DF] dark:border-[#214A47] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#00695C] dark:text-[#8FE0C1] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2FA36B] dark:text-[#5CCFA0]" />
                <span>3. Interactive Farm Boundary (PostGIS Polygon)</span>
              </h2>
              <p className="text-xs text-[#5F7775] dark:text-[#9DBBB5] mt-0.5">
                Draw farm perimeter vertices on the canvas below or let the system auto-generate the boundary.
              </p>
            </div>

            {drawnAreaHa > 0 && (
              <span className="text-xs font-mono font-bold text-[#00695C] dark:text-[#8FE0C1] px-3 py-1 rounded-full bg-[#E8F5EF] dark:bg-[#123B35] border border-[#D4E8DF] dark:border-[#28504D]">
                Drawn Area: {drawnAreaHa.toFixed(2)} ha
              </span>
            )}
          </div>

          <FarmMapDrawer onPolygonChange={handlePolygonChange} />
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/farms"
            className="px-6 py-3 rounded-[10px] bg-white dark:bg-[#091F22] border border-[#D4E8DF] dark:border-[#28504D] hover:bg-[#F7FAFC] dark:hover:bg-[#102F31] text-[#5F7775] dark:text-[#9DBBB5] font-semibold text-sm transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-[10px] bg-[#087B62] dark:bg-[#087B62] hover:bg-[#006B55] dark:hover:bg-[#2FA36B] text-white font-bold text-sm shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Saving Farm...' : 'Save Farm'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFarmPage;
