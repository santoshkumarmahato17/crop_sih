import React, { useState, useEffect } from 'react';
import {
  Bug,
  Cpu,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  ShieldAlert,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  TrendingUp,
  Activity,
  FileText,
  Sliders,
} from 'lucide-react';
import { pestSensorService, PestObservation } from '@/services/pestSensorService';


export const PestTrapSensorMonitoringPage: React.FC = () => {
  // --- Form States: Pest Observation ---
  const [farm, setFarm] = useState('Green Valley Farm');
  const [zone, setZone] = useState('Zone A');
  const [crop, setCrop] = useState('Tomato');
  const [pestType, setPestType] = useState('Whitefly');
  const [trapId, setTrapId] = useState('TRAP-001');
  const [observationDate, setObservationDate] = useState('2026-09-19');
  const [pestCountStr, setPestCountStr] = useState('42');
  const [notes, setNotes] = useState('Increasing pest activity observed on lower leaves');

  // --- Form States: Field Sensor Data ---
  const [temperature, setTemperature] = useState<number | ''>(29);
  const [humidity, setHumidity] = useState<number | ''>(78);
  const [soilMoisture, setSoilMoisture] = useState<number | ''>(42);
  const [rainfall, setRainfall] = useState<number | ''>(12);
  const [leafWetness, setLeafWetness] = useState('High');
  const [windSpeed, setWindSpeed] = useState<number | ''>(8);

  // --- System / UI States ---
  const [isSimulatedMode, setIsSimulatedMode] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('2 minutes ago');
  const [observations, setObservations] = useState<PestObservation[]>([]);
  const [submittingPest, setSubmittingPest] = useState(false);
  const [submittingSensor, setSubmittingSensor] = useState(false);
  const [pestFormError, setPestFormError] = useState<string | null>(null);
  const [sensorFormError, setSensorFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Available dropdown options
  const PEST_TYPES = [
    'Aphids',
    'Whitefly',
    'Thrips',
    'Bollworm',
    'Fruit Fly',
    'Stem Borer',
    'Leaf Miner',
    'Armyworm',
    'Locust',
    'Other',
  ];

  const CROPS = [
    'Tomato',
    'Cotton',
    'Orange',
    'Maize',
    'Cashew',
    'Cassava',
    'Rice',
    'Wheat',
    'Soybean',
    'Onion',
    'Apple',
  ];

  const FARMS = ['Green Valley Farm', 'Sunrise Agro Farm', 'Golden Harvest Farm', 'Skyline Agri Estate'];
  const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Field #4'];
  const WETNESS_LEVELS = ['Low', 'Medium', 'High', 'Very High'];

  // Load observations on component mount
  useEffect(() => {
    loadObservations();
  }, []);

  const loadObservations = async () => {
    const data = await pestSensorService.getPestObservations();
    setObservations(data);
  };

  // Rule-based prototype risk calculation
  const currentPestCount = parseInt(pestCountStr, 10) || 0;
  const calculateRiskLevel = (count: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (count <= 10) return 'LOW';
    if (count <= 30) return 'MEDIUM';
    return 'HIGH';
  };
  const currentRisk = calculateRiskLevel(currentPestCount);

  // --- Handlers ---
  const handlePestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPestFormError(null);
    setSuccessMsg(null);

    // Validations
    if (!farm || !zone || !crop || !pestType || !trapId || !observationDate) {
      setPestFormError('Please fill in all required fields (Farm, Zone, Crop, Pest Type, Trap ID, Date).');
      return;
    }

    const count = parseInt(pestCountStr, 10);
    if (isNaN(count) || count < 0) {
      setPestFormError('Pest Count must be a valid non-negative integer (e.g., 0, 15, 42).');
      return;
    }

    setSubmittingPest(true);
    try {
      const formattedDate = new Date(observationDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const newObs = await pestSensorService.submitPestObservation({
        farmId: farm,
        zoneId: zone,
        crop,
        pestType,
        trapId,
        observationDate: formattedDate,
        pestCount: count,
        notes,
        isSimulated: isSimulatedMode,
      });

      setObservations((prev) => [newObs, ...prev]);
      setSuccessMsg(`Pest observation logged successfully! Risk level calculated: ${newObs.riskLevel}`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setPestFormError(err.message || 'Failed to submit pest observation.');
    } finally {
      setSubmittingPest(false);
    }
  };

  const handleSensorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSensorFormError(null);
    setSuccessMsg(null);

    const tempVal = typeof temperature === 'number' ? temperature : parseFloat(temperature as string);
    const humVal = typeof humidity === 'number' ? humidity : parseFloat(humidity as string);
    const soilVal = typeof soilMoisture === 'number' ? soilMoisture : parseFloat(soilMoisture as string);
    const rainVal = typeof rainfall === 'number' ? rainfall : parseFloat(rainfall as string);
    const windVal = typeof windSpeed === 'number' ? windSpeed : parseFloat(windSpeed as string);

    if (isNaN(tempVal) || tempVal < -50 || tempVal > 70) {
      setSensorFormError('Temperature must be a valid number between -50°C and 70°C.');
      return;
    }
    if (isNaN(humVal) || humVal < 0 || humVal > 100) {
      setSensorFormError('Humidity must be a valid percentage between 0% and 100%.');
      return;
    }
    if (isNaN(soilVal) || soilVal < 0 || soilVal > 100) {
      setSensorFormError('Soil moisture must be a valid percentage between 0% and 100%.');
      return;
    }
    if (isNaN(rainVal) || rainVal < 0) {
      setSensorFormError('Rainfall must be a non-negative number.');
      return;
    }
    if (isNaN(windVal) || windVal < 0) {
      setSensorFormError('Wind speed must be a non-negative number.');
      return;
    }

    setSubmittingSensor(true);
    try {
      await pestSensorService.submitSensorData({
        farmId: farm,
        zoneId: zone,
        temperature: tempVal,
        humidity: humVal,
        soilMoisture: soilVal,
        rainfall: rainVal,
        leafWetness,
        windSpeed: windVal,
        isSimulated: isSimulatedMode,
      });


      setLastUpdatedTime('Just now');
      setSuccessMsg(`Field sensor data recorded successfully for ${zone}!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setSensorFormError(err.message || 'Failed to submit sensor data.');
    } finally {
      setSubmittingSensor(false);
    }
  };

  const handleUseSimulatedData = () => {
    setIsSimulatedMode(true);
    setTemperature(29);
    setHumidity(78);
    setSoilMoisture(42);
    setRainfall(12);
    setLeafWetness('High');
    setWindSpeed(8);
    setPestCountStr('42');
    setPestType('Whitefly');
    setNotes('Increasing pest activity observed on lower leaves');
    setLastUpdatedTime('Just now');
    setSuccessMsg('Simulated demo sensor data loaded! (Demo / Simulated Data Mode active)');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#141012] text-[#e3dedf] p-4 md:p-8 space-y-8 font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#33262b] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#ef4444]/20 to-[#f97316]/20 border border-[#ef4444]/40 text-[#ef4444]">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Pest Trap & Sensor Monitoring
              </h1>
              <p className="text-xs md:text-sm text-[#9e8f95]">
                Monitor pest activity and field conditions for early crop-health risk detection.
              </p>
            </div>
          </div>
        </div>

        {/* Prototype Sensor Mode Status Badge */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-[#241a1e] border border-[#3e2c33] rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">
                ● Online
                <span className="text-[9px] bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 px-1.5 py-0.2 rounded font-mono uppercase font-extrabold">
                  {isSimulatedMode ? 'Simulated Sensor Data' : 'Live Mode'}
                </span>
              </div>
              <div className="text-[10px] text-[#9e8f95] font-mono">
                Last Updated: {lastUpdatedTime}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseSimulatedData}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#2b1e23] hover:bg-[#38262d] text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition shadow-md"
            title="Populate realistic sample sensor values"
          >
            <Sliders className="w-4 h-4" />
            <span>Use Simulated Sensor Data</span>
          </button>
        </div>
      </div>

      {/* ── Global Banner Alert ── */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs md:text-sm flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1 rounded bg-emerald-900/50"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Two-Column Layout (Desktop) / Single-Column (Mobile) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ---------------------------------------------------- */}
        {/* SECTION 4 & 5: PEST TRAP INPUT                       */}
        {/* ---------------------------------------------------- */}
        <div className="bg-[#1c1618] border border-[#35282e] rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#2d2025] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444]">
                <Bug className="w-4 h-4" />
              </div>
              <h2 className="text-base md:text-lg font-bold text-white">
                Pest Trap Observation
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase bg-[#2a1d22] text-[#a8999f] px-2 py-0.5 rounded border border-[#3b2a31]">
              Manual / Field Input
            </span>
          </div>

          {pestFormError && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{pestFormError}</span>
            </div>
          )}

          <form onSubmit={handlePestSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Farm Selection */}
              <div>
                <label className="block text-xs font-medium text-[#b5a7ad] mb-1.5">
                  Farm <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={farm}
                    onChange={(e) => setFarm(e.target.value)}
                    className="w-full bg-[#130f11] border border-[#3b2c32] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#ef4444] transition"
                  >
                    {FARMS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Zone / Field Selection */}
              <div>
                <label className="block text-xs font-medium text-[#b5a7ad] mb-1.5">
                  Zone / Field <span className="text-red-400">*</span>
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full bg-[#130f11] border border-[#3b2c32] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#ef4444] transition"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Selection */}
              <div>
                <label className="block text-xs font-medium text-[#b5a7ad] mb-1.5">
                  Crop <span className="text-red-400">*</span>
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full bg-[#130f11] border border-[#3b2c32] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#ef4444] transition"
                >
                  {CROPS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pest Type Selection */}
              <div>
                <label className="block text-xs font-medium text-[#b5a7ad] mb-1.5">
                  Pest Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={pestType}
                  onChange={(e) => setPestType(e.target.value)}
                  className="w-full bg-[#130f11] border border-[#3b2c32] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#ef4444] transition"
                >
                  {PEST_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trap ID */}
              <div>
                <label className="block text-xs font-medium text-[#b5a7ad] mb-1.5">
                  Trap ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={trapId}
                  onChange={(e) => setTrapId(e.target.value)}
                  placeholder="e.g. TRAP-001"
                  className="w-full bg-[#130f11] border border-[#3b2c32] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#ef4444] transition"
                />
              </div>

              {/* Observation Date */}
              <div>
                <label className="block text-xs font-medium text-[#b5a7ad] mb-1.5">
                  Observation Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={observationDate}
                  onChange={(e) => setObservationDate(e.target.value)}
                  className="w-full bg-[#130f11] border border-[#3b2c32] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#ef4444] transition"
                />
              </div>
            </div>

            {/* Pest Count */}
            <div>
              <label className="block text-xs font-medium text-[#b5a7ad] mb-1.5">
                Pest Count <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={pestCountStr}
                  onChange={(e) => setPestCountStr(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full bg-[#130f11] border border-[#3b2c32] rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-[#ef4444] transition"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-[#8e7e84] font-mono">
                  pests / trap
                </span>
              </div>
            </div>

            {/* Observation Notes */}
            <div>
              <label className="block text-xs font-medium text-[#b5a7ad] mb-1.5">
                Observation Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter field observation details..."
                className="w-full bg-[#130f11] border border-[#3b2c32] rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-[#ef4444] transition resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submittingPest}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#ef4444] to-[#f97316] hover:from-[#dc2626] hover:to-[#ea580c] text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submittingPest ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Observation...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Submit Pest Observation</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-[#85767b] italic text-center">
            Note: Pest categories are selectable observation options recorded by extension workers/farmers.
          </p>
        </div>

        {/* ---------------------------------------------------- */}
        {/* SECTION 6 & 7: SENSOR INPUT SECTION                  */}
        {/* ---------------------------------------------------- */}
        <div className="bg-[#1c1618] border border-[#35282e] rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#2d2025] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-white">
                  Field Sensor Data
                </h2>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-[#182633] text-[#7dd3fc] px-2 py-0.5 rounded border border-[#1e3a4a]">
              Demo / Simulated Data
            </span>
          </div>

          {sensorFormError && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{sensorFormError}</span>
            </div>
          )}

          <form onSubmit={handleSensorSubmit} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Temperature */}
              <div className="bg-[#130f11] border border-[#35272c] rounded-xl p-3">
                <div className="flex items-center justify-between text-[#b5a7ad] text-[11px] mb-1">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temp
                  </span>
                  <span className="text-[10px] text-[#8a7a80]">°C</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>

              {/* Humidity */}
              <div className="bg-[#130f11] border border-[#35272c] rounded-xl p-3">
                <div className="flex items-center justify-between text-[#b5a7ad] text-[11px] mb-1">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" /> Humidity
                  </span>
                  <span className="text-[10px] text-[#8a7a80]">%</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>

              {/* Soil Moisture */}
              <div className="bg-[#130f11] border border-[#35272c] rounded-xl p-3">
                <div className="flex items-center justify-between text-[#b5a7ad] text-[11px] mb-1">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" /> Soil Moist.
                  </span>
                  <span className="text-[10px] text-[#8a7a80]">%</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={soilMoisture}
                  onChange={(e) => setSoilMoisture(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>

              {/* Rainfall */}
              <div className="bg-[#130f11] border border-[#35272c] rounded-xl p-3">
                <div className="flex items-center justify-between text-[#b5a7ad] text-[11px] mb-1">
                  <span className="flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rainfall
                  </span>
                  <span className="text-[10px] text-[#8a7a80]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={rainfall}
                  onChange={(e) => setRainfall(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>

              {/* Leaf Wetness */}
              <div className="bg-[#130f11] border border-[#35272c] rounded-xl p-3">
                <div className="text-[#b5a7ad] text-[11px] mb-1">Leaf Wetness</div>
                <select
                  value={leafWetness}
                  onChange={(e) => setLeafWetness(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  {WETNESS_LEVELS.map((lw) => (
                    <option key={lw} value={lw} className="bg-[#1c1618] text-white">
                      {lw}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wind Speed */}
              <div className="bg-[#130f11] border border-[#35272c] rounded-xl p-3">
                <div className="flex items-center justify-between text-[#b5a7ad] text-[11px] mb-1">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-indigo-400" /> Wind
                  </span>
                  <span className="text-[10px] text-[#8a7a80]">km/h</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submittingSensor}
                className="flex-1 py-2.5 px-4 bg-[#2b1f24] hover:bg-[#3d2931] border border-[#523742] text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                {submittingSensor ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Submit Sensor Data</span>
              </button>

              <button
                type="button"
                onClick={handleUseSimulatedData}
                className="py-2.5 px-4 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Sample Values</span>
              </button>
            </div>
          </form>

          {/* Prototype Sensor Disclaimer */}
          <div className="p-3 rounded-xl bg-[#140f11] border border-[#2e2126] flex items-start gap-2.5 text-[11px] text-[#9c8c92]">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong>Software Prototype Mode:</strong> This section supports manual data entry and simulated field values for UI/backend demonstration. Physical IoT sensors can be linked via the REST API endpoint later.
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 8 & 9: PEST RISK ANALYSIS & COMBINED AGRI   */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Pest Activity & Risk Level Indicator */}
        <div className="bg-[#1c1618] border border-[#35282e] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#b5a7ad] uppercase tracking-wider">
              Pest Activity
            </span>
            <span className="text-[10px] bg-[#291b20] text-amber-400 font-mono px-2 py-0.5 rounded border border-amber-500/20">
              Prototype Risk Indicator
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{currentPestCount}</span>
            <span className="text-xs text-[#9e8f95] font-mono">pests / trap</span>
          </div>

          <div className="border-t border-[#2e2126] pt-3 flex items-center justify-between">
            <span className="text-xs text-[#b5a7ad]">Risk Level</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-md ${
                currentRisk === 'HIGH'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : currentRisk === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {currentRisk} RISK
            </span>
          </div>

          <div className="text-[10px] text-[#8a7b81] space-y-1 pt-1 font-mono">
            <div className="flex justify-between">
              <span>LOW: 0-10 pests</span>
              <span>MEDIUM: 11-30 pests</span>
              <span>HIGH: 31+ pests</span>
            </div>
            <div className="w-full bg-[#130f11] h-1.5 rounded-full overflow-hidden flex">
              <div className="w-1/3 bg-emerald-500/60"></div>
              <div className="w-1/3 bg-amber-500/60"></div>
              <div className="w-1/3 bg-red-500/60"></div>
            </div>
          </div>
        </div>

        {/* Card 2 & 3: Combined Multi-Modal Risk Flow Demonstration */}
        <div className="md:col-span-2 bg-[#1c1618] border border-[#35282e] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2e2126] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                AGRI SHIELD Multi-Factor Risk Assessment Engine
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
              Integrated Analytics
            </span>
          </div>

          {/* Workflow Flow Diagram */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-[#130f11] border border-[#33252a] p-2.5 rounded-xl">
              <div className="text-[10px] text-[#9e8f95] uppercase font-bold">Pest Count</div>
              <div className="text-sm font-black text-red-400 mt-1">{currentPestCount} / trap</div>
              <div className="text-[9px] text-[#7a6b71] truncate">{pestType}</div>
            </div>

            <div className="bg-[#130f11] border border-[#33252a] p-2.5 rounded-xl">
              <div className="text-[10px] text-[#9e8f95] uppercase font-bold">Field Sensors</div>
              <div className="text-xs font-bold text-amber-300 mt-1">
                {temperature}°C | {humidity}%
              </div>
              <div className="text-[9px] text-[#7a6b71] truncate">Rain: {rainfall}mm</div>
            </div>

            <div className="bg-[#130f11] border border-[#33252a] p-2.5 rounded-xl">
              <div className="text-[10px] text-[#9e8f95] uppercase font-bold">Crop Context</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">{crop}</div>
              <div className="text-[9px] text-[#7a6b71] truncate">{zone}</div>
            </div>

            <div className="bg-[#241316] border border-[#ef4444]/40 p-2.5 rounded-xl flex flex-col justify-center items-center">
              <div className="text-[10px] text-red-300 uppercase font-bold">System Risk</div>
              <div className="text-sm font-black text-red-400 mt-0.5">{currentRisk} PEST RISK</div>
            </div>
          </div>

          <p className="text-[11px] text-[#a6969c] leading-relaxed">
            AGRI SHIELD does not rely on camera images alone. It combines <strong>pest trap observations</strong>, <strong>field sensor microclimates</strong>, <strong>weather data</strong>, and <strong>crop types</strong> to generate early risk indicators.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 15: HIGH PEST ACTIVITY ALERT                 */}
      {/* ---------------------------------------------------- */}
      {currentRisk === 'HIGH' && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/80 via-[#261316] to-red-950/80 border-2 border-red-500/60 shadow-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>⚠️ High Pest Activity Detected</span>
                <span className="text-[10px] font-mono bg-red-500 text-white font-bold px-2 py-0.5 rounded-full">
                  ACTION REQUIRED
                </span>
              </h3>
              <p className="text-xs text-red-200 mt-0.5">
                {pestType} activity is increasing rapidly in {zone} ({currentPestCount} pests logged/trap).
              </p>
            </div>
          </div>

          <div className="bg-[#180a0c]/80 rounded-xl p-3.5 border border-red-900/50 text-xs text-red-100 space-y-1.5">
            <div className="font-bold text-red-300">Recommended Integrated Pest Management (IPM) Protocols:</div>
            <ul className="list-disc list-inside space-y-1 text-[#e8d5da]">
              <li>Conduct immediate physical field inspection across lower and upper canopy foliage in {zone}.</li>
              <li>Maintain daily sticky trap counts to measure nymph emergence velocity.</li>
              <li>Deploy bio-pesticide protocols (e.g. Neem Oil extract 5% EC or botanical sprays).</li>
              <li>Schedule extension worker field verification if counts exceed economic threshold.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 10 & 11: RECENT OBSERVATIONS & TREND GRAPH   */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Observations Table (2 cols on lg) */}
        <div className="lg:col-span-2 bg-[#1c1618] border border-[#35282e] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#2d2025] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">Recent Pest Observations</h3>
            </div>
            <span className="text-[10px] text-[#9e8f95] font-mono">
              Total Recorded: {observations.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#d8cbcf]">
              <thead className="bg-[#140f11] text-[#9e8f95] font-mono uppercase text-[10px] border-b border-[#2e2126]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Farm</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3">Crop</th>
                  <th className="py-2.5 px-3">Pest</th>
                  <th className="py-2.5 px-3 text-right">Count</th>
                  <th className="py-2.5 px-3 text-center">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a1d22]">
                {observations.map((obs) => (
                  <tr key={obs.id} className="hover:bg-[#251b1f] transition">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-white whitespace-nowrap">
                      {obs.observationDate}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{obs.farmId}</td>
                    <td className="py-2.5 px-3 text-[#b5a7ad]">{obs.zoneId}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">{obs.crop}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{obs.pestType}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                      {obs.pestCount}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          obs.riskLevel === 'HIGH'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : obs.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {obs.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-[#7a6b71] font-mono text-right">
            Showing records stored in AGRI SHIELD database / local storage.
          </p>
        </div>

        {/* Pest Activity Trend Graph (1 col on lg) */}
        <div className="bg-[#1c1618] border border-[#35282e] rounded-2xl p-5 md:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#2d2025] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                <h3 className="text-base font-bold text-white">Pest Activity Trend</h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Surging</span>
            </div>

            {/* SVG Custom Trend Graph */}
            <div className="bg-[#130f11] border border-[#2d2126] rounded-xl p-4 space-y-3">
              <div className="text-[11px] text-[#a8999f] flex justify-between">
                <span>Trap Count Trend</span>
                <span className="font-mono text-amber-400">17 Sep → 19 Sep</span>
              </div>

              <div className="h-40 relative flex items-end pt-4 pb-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#2c2025" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#2c2025" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="300" y2="100" stroke="#2c2025" strokeDasharray="3 3" />

                  {/* Trend Area */}
                  <polygon
                    points="30,90 150,60 270,20 270,110 30,110"
                    fill="url(#trendGradient)"
                    opacity="0.4"
                  />

                  {/* Trend Line */}
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    points="30,90 150,60 270,20"
                  />

                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Points */}
                  <circle cx="30" cy="90" r="5" fill="#f59e0b" stroke="#1c1618" strokeWidth="2" />
                  <circle cx="150" cy="60" r="5" fill="#f59e0b" stroke="#1c1618" strokeWidth="2" />
                  <circle cx="270" cy="20" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />

                  {/* Labels */}
                  <text x="30" y="80" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
                    12
                  </text>
                  <text x="150" y="50" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">
                    27
                  </text>
                  <text x="270" y="10" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="extrabold">
                    42
                  </text>
                </svg>
              </div>

              {/* X Axis Dates */}
              <div className="flex justify-between text-[10px] font-mono text-[#8c7d83] px-2 pt-1 border-t border-[#231a1e]">
                <span>17 Sep (12)</span>
                <span>18 Sep (27)</span>
                <span className="text-red-400 font-bold">19 Sep (42)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#9c8b91] bg-[#140f11] p-3 rounded-xl border border-[#291e23]">
            <span className="text-amber-400 font-bold">Trend Analysis:</span> Whitefly density increased from 12 to 42 pests/trap over 48 hours (+250% surge).
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestTrapSensorMonitoringPage;
