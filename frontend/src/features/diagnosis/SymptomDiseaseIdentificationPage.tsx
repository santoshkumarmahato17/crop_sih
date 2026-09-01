import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  BrainCircuit,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Sprout,
  ShieldCheck,
  Plane,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Info,
  X,
  FileCheck,
  Layers,
  History,
} from 'lucide-react';
import { farmService } from '@/services/farmService';
import { zoneService } from '@/services/zoneService';
import {
  diagnosisService,
  SymptomAnalysisPayload,
  SymptomAnalysisResult,
  DiagnosisHistoryItem,
} from '@/services/diagnosisService';
import { Farm, Zone } from '@/types';

// Structured Symptom Categories
const SYMPTOM_TAXONOMY = {
  'Leaf Symptoms': [
    'Yellowing',
    'Browning',
    'Wilting',
    'Curling',
    'Spots',
    'Blotches',
    'Holes',
    'Powdery coating',
    'Rust-like appearance',
    'Mosaic pattern',
    'Vein discoloration',
    'Necrosis',
  ],
  'Stem Symptoms': [
    'Lesions',
    'Discoloration',
    'Cracking',
    'Rot',
    'Wilting',
    'Swelling',
  ],
  'Fruit Symptoms': [
    'Spots',
    'Rot',
    'Discoloration',
    'Deformation',
    'Cracking',
    'Premature dropping',
  ],
  'Whole Plant': [
    'Stunted growth',
    'Sudden wilting',
    'Slow growth',
    'Plant death',
    'Uneven growth',
  ],
};

const PLANT_PARTS = ['Leaf', 'Stem', 'Root', 'Fruit', 'Flower', 'Whole Plant'];
const GROWTH_STAGES = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity', 'Harvest'];
const CROP_TYPES = ['Tomato', 'Rice', 'Wheat', 'Corn', 'Banana', 'Chilli', 'Potato', 'Cotton', 'Sugarcane'];

export const SymptomDiseaseIdentificationPage: React.FC = () => {
  const navigate = useNavigate();

  // Active View Tab: 'NEW_CHECK' vs 'HISTORY'
  const [activeTab, setActiveTab] = useState<'NEW_CHECK' | 'HISTORY'>('NEW_CHECK');

  // Topology State
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Form State
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [growthStage, setGrowthStage] = useState<string>('Flowering');
  const [selectedPlantParts, setSelectedPlantParts] = useState<string[]>(['Leaf']);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Spots', 'Yellowing', 'Browning']);
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE'>('HIGH');
  const [distribution, setDistribution] = useState<string>('One section of the zone');
  const [symptomDuration, setSymptomDuration] = useState<string>('4–7 days ago');
  const [farmerNotes, setFarmerNotes] = useState<string>('');

  // Optional Context
  const [showOptionalContext, setShowOptionalContext] = useState<boolean>(false);
  const [recentPesticide, setRecentPesticide] = useState<string>('None in last 14 days');
  const [recentFertilizer, setRecentFertilizer] = useState<string>('NPK 19-19-19 drip applied 5 days ago');
  const [recentIrrigation, setRecentIrrigation] = useState<string>('Drip irrigation 2 days ago');
  const [recentRainfall, setRecentRainfall] = useState<string>('Moderate rain 3 days ago (14mm)');
  const [visibleInsects, setVisibleInsects] = useState<string>('Small white flies spotted under leaves');
  const [unusualWeather, setUnusualWeather] = useState<string>('High morning humidity (>85%)');

  // Image Upload State
  const [uploadedImages, setUploadedImages] = useState<{ url: string; name: string }[]>([
    {
      url: '/tomato-bg.jpg',
      name: 'Tomato_Leaf_Spot_Macro_01.jpg',
    },
  ]);

  // AI Pipeline Execution State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<SymptomAnalysisResult | null>(null);
  const [validationRequested, setValidationRequested] = useState<boolean>(false);

  // History State
  const [historyItems, setHistoryItems] = useState<DiagnosisHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Form Validation Alert
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load Farms & Initial History
  useEffect(() => {
    loadInitialFarms();
    loadHistory();
  }, []);

  const loadInitialFarms = async () => {
    try {
      const res = await farmService.listFarms();
      setFarms(res.farms);
      if (res.farms.length > 0) {
        setSelectedFarmId(res.farms[0].id);
        loadZones(res.farms[0].id);
      }
    } catch (err) {
      console.warn('Failed to load farms', err);
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
      console.warn('Failed to load zones', err);
    }
  };

  const handleFarmChange = (fId: string) => {
    setSelectedFarmId(fId);
    loadZones(fId);
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await diagnosisService.getDiagnosisHistory();
      setHistoryItems(res.items);
    } catch (err) {
      console.warn('Failed to load diagnosis history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Toggle Symptom
  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  // Toggle Plant Part
  const togglePlantPart = (part: string) => {
    setSelectedPlantParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  // Handle Drag & Drop / File Input
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setUploadedImages((prev) => [
            ...prev,
            { url: uploadEvent.target!.result as string, name: file.name },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Execute Symptom Analysis Workflow
  const handleAnalyze = async () => {
    setValidationError(null);

    if (!selectedFarmId) {
      setValidationError('Please select an authorized Farm.');
      return;
    }
    if (!selectedZoneId) {
      setValidationError('Please select a Zone to inspect.');
      return;
    }
    if (selectedSymptoms.length === 0) {
      setValidationError('Please select at least one observed symptom.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(1);

    // Multi-stage non-blocking progressive steps
    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 500);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 1000);
    const stepTimer3 = setTimeout(() => setAnalysisStep(4), 1500);
    const stepTimer4 = setTimeout(() => setAnalysisStep(5), 2000);

    const payload: SymptomAnalysisPayload = {
      farm_id: selectedFarmId,
      zone_id: selectedZoneId,
      crop_type: selectedCrop,
      growth_stage: growthStage,
      plant_parts: selectedPlantParts,
      symptoms: selectedSymptoms,
      severity,
      distribution,
      symptom_start_date: symptomDuration,
      farmer_notes: farmerNotes,
      recent_pesticide_fungicide: recentPesticide,
      recent_fertilizer: recentFertilizer,
      recent_irrigation: recentIrrigation,
      recent_rainfall: recentRainfall,
      visible_insects: visibleInsects,
      recent_unusual_weather: unusualWeather,
      images: uploadedImages.map((img) => ({
        image_url: img.url,
        original_filename: img.name,
      })),
    };

    try {
      const result = await diagnosisService.analyzeCropHealth(payload);
      setTimeout(() => {
        setAnalysisResult(result);
        setIsAnalyzing(false);
        setValidationRequested(false);
        loadHistory();
      }, 2500);
    } catch (err: any) {
      console.error('Diagnosis analysis failed', err);
      setIsAnalyzing(false);
      setValidationError('Analysis pipeline encountered an error. Please try again.');
    }

    return () => {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
    };
  };

  // Request Extension-Worker Validation
  const handleRequestValidation = async () => {
    if (!analysisResult) return;
    try {
      await diagnosisService.requestExpertValidation(analysisResult.id);
      setValidationRequested(true);
      setAnalysisResult((prev) => (prev ? { ...prev, validation_status: 'PENDING' } : null));
    } catch (err) {
      console.warn('Failed to request validation', err);
      setValidationRequested(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-3 sm:px-6 transition-colors duration-200">
      {/* ── Top Header & Tab Navigation ── */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 backdrop-blur-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Identify Crop Health Issue
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Describe observed symptoms and upload plant imagery to identify possible crop-health anomalies.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('NEW_CHECK');
              setAnalysisResult(null);
            }}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'NEW_CHECK'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Health Check</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'HISTORY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Previous Checks ({historyItems.length})</span>
          </button>
        </div>
      </div>

      {/* ── Main View Area ── */}
      {activeTab === 'HISTORY' ? (
        /* History View */
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-500" />
              <span>Previous Crop Health Checks</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono font-semibold">
              Total Recorded: {historyItems.length}
            </span>
          </div>

          {isLoadingHistory ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading previous diagnosis reports...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No diagnosis records found</p>
              <p className="text-[11px]">Start a new health check above to analyze plant symptoms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 hover:border-emerald-500/50 transition-all space-y-3 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                        {item.primary_condition}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span>{item.farm_name} • Zone {item.zone_code} ({item.crop_type})</span>
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border ${
                          item.status === 'EXPERT_CONFIRMED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {item.status === 'EXPERT_CONFIRMED' ? 'EXPERT CONFIRMED' : 'AI SUSPECTED'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {Math.round(item.ai_confidence * 100)}% Confidence
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Severity: <strong className="text-slate-800 dark:text-slate-200">{item.severity}</strong></span>
                    <span>Validation: <strong className={item.validation_status === 'CONFIRMED' ? 'text-emerald-500' : 'text-amber-500'}>{item.validation_status}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isAnalyzing ? (
        /* Multi-step AI Progress Loading Screen */
        <div className="p-12 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto animate-pulse">
            <BrainCircuit className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Analyzing Crop Health...
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Executing multi-factor agronomic neural inference and spatial disease correlation.
            </p>
          </div>

          {/* Step Progress Indicators */}
          <div className="max-w-md mx-auto space-y-2.5 text-left pt-2">
            {[
              { step: 1, label: 'Receiving information & farmer symptoms' },
              { step: 2, label: 'Analyzing uploaded foliar imagery' },
              { step: 3, label: 'Comparing symptoms against plant pathology base' },
              { step: 4, label: 'Checking crop growth stage & weather context' },
              { step: 5, label: 'Evaluating spatial risk & neighboring zones' },
              { step: 6, label: 'Preparing explainable diagnostic result' },
            ].map((st) => (
              <div
                key={st.step}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all duration-300 ${
                  analysisStep >= st.step
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                {analysisStep >= st.step ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex-shrink-0" />
                )}
                <span className="text-xs font-semibold">{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : analysisResult ? (
        /* ── Full Diagnostic Result View ── */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Result Banner */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-extrabold tracking-wider">
                    {analysisResult.status === 'EXPERT_CONFIRMED' ? 'EXPERT CONFIRMED' : 'AI SUSPECTED — HIGH ATTENTION'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(analysisResult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {analysisResult.primary_condition}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{analysisResult.farm_name} • Zone {analysisResult.zone_code} ({analysisResult.crop_type}, {analysisResult.growth_stage})</span>
                </p>
              </div>

              {/* Confidence Gauge */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {analysisResult.confidence_percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    AI Confidence
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500">
                  <BrainCircuit className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Scientific Notice */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Scientific Protocol:</strong> AI Suspected analysis represents algorithmic probability estimation. Not a certified scientific laboratory diagnosis.
              </span>
            </div>
          </div>

          {/* Grid Layout: Left Column (Ranked Conditions & Explainability) | Right Column (Image, Spatial & History) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Ranked Conditions + Explainability + Recommendations */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Ranked Possible Conditions */}
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>Ranked Possible Conditions</span>
                </h3>

                <div className="space-y-3">
                  {analysisResult.possible_conditions.map((cond, idx) => (
                    <div
                      key={cond.condition_name}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/40 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          {cond.condition_name}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                          {Math.round(cond.probability * 100)}% Probability
                        </span>
                      </div>

                      {/* Probability Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500"
                          style={{ width: `${cond.probability * 100}%` }}
                        />
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {cond.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Explainability: Why was this flagged? */}
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Why was this flagged?</span>
                </h3>

                <div className="space-y-2">
                  {analysisResult.reasoning_points.map((pt, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5"
                    >
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="leading-relaxed">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. What should you do next? (Integrated Pest Management) */}
              <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>What should you do next? (IPM Action Plan)</span>
                </h3>

                <div className="space-y-3">
                  {analysisResult.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 dark:text-slate-100">{rec.title}</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {rec.action_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Visual Image Analysis, Zone Health, Neighbor Risk & Validation */}
            <div className="space-y-6">
              {/* 1. Analyzed Image Preview */}
              {analysisResult.analyzed_images.length > 0 && (
                <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Visual Foliar Image Inspection
                  </span>
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
                    <img
                      src={analysisResult.analyzed_images[0].url}
                      alt="Analyzed Crop"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white">
                      🔴 Abnormality Detected
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Image analysis detected foliar chlorosis and necrotic clusters in submitted sample.
                  </p>
                </div>
              )}

              {/* 2. Current Zone Status Snapshot */}
              <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Zone {analysisResult.zone_status.zone_code} Health Snapshot
                  </span>
                  <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5">
                    <TrendingDown className="w-3 h-3" /> DECLINING
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Health Score</span>
                    <strong className="text-slate-900 dark:text-white text-sm">
                      {Math.round(analysisResult.zone_status.current_health_score * 100)}%
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                    <span className="text-[10px] block">Disease Risk</span>
                    <strong className="text-sm">
                      {Math.round(analysisResult.zone_status.disease_risk * 100)}%
                    </strong>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-mono text-center">
                  Last Drone Multispectral Scan: {analysisResult.zone_status.last_drone_scan}
                </p>
              </div>

              {/* 3. Historical Comparison */}
              <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Historical Health & Disease Trend
                </span>
                <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Health Trend</span>
                    <span className="font-bold text-rose-500">
                      {analysisResult.historical_comparison.health_change_pct}% in 14 days
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Disease Indicator</span>
                    <span className="font-bold text-rose-500">
                      {Math.round(analysisResult.historical_comparison.previous_disease_indicator * 100)}% → {Math.round(analysisResult.historical_comparison.current_disease_indicator * 100)}% (RISING)
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Neighboring Zone Risk */}
              <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Surrounding Zone Risk
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                    Spread Risk: {analysisResult.regional_spread_risk}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {analysisResult.neighboring_zones.map((nz) => (
                    <div
                      key={nz.zone_code}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Zone {nz.zone_code}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          nz.risk_level.includes('High') ? 'text-rose-500' : 'text-amber-500'
                        }`}
                      >
                        {nz.risk_level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Expert Validation Trigger Action */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <FileCheck className="w-5 h-5" />
                  <span className="font-bold text-xs">Extension Officer Validation</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Request an agronomist to conduct ground-truth review or field inspection on this report.
                </p>

                {validationRequested || analysisResult.validation_status === 'PENDING' ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Validation Request Pending Review</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestValidation}
                    className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    <span>Request Expert Validation</span>
                  </button>
                )}
              </div>

              {/* Follow-up Drone Mission Prompt */}
              {analysisResult.follow_up_monitoring.is_recommended && (
                <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-2.5 shadow-lg border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Plane className="w-4 h-4" />
                    <span className="font-bold text-xs">Recommended Drone Mission</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {analysisResult.follow_up_monitoring.reason}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/missions/new')}
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <span>Schedule Targeted Drone Scan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Input Form Screen ── */
        <div className="space-y-6">
          {/* Validation Error Alert */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium animate-in fade-in">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Field, Zone & Crop Context */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>1. Select Farm, Zone & Crop Type</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Farm Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Farm
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => handleFarmChange(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.total_area_hectares} Ha)
                    </option>
                  ))}
                </select>
              </div>

              {/* Zone Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Zone
                </label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      Zone {z.zone_code} — {z.health_status.toUpperCase()} ({z.area_hectares} Ha)
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Crop Species
                </label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CROP_TYPES.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Growth Stage Selector */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Plant Growth Stage
              </label>
              <div className="flex flex-wrap gap-2">
                {GROWTH_STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setGrowthStage(stage)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      growthStage === stage
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Affected Plant Parts & Observed Symptoms */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-500" />
              <span>2. Plant Part & Observed Symptoms</span>
            </h2>

            {/* Plant Parts Multiple Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Affected Plant Part(s) (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {PLANT_PARTS.map((part) => {
                  const isSelected = selectedPlantParts.includes(part);
                  return (
                    <button
                      key={part}
                      type="button"
                      onClick={() => togglePlantPart(part)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      <span>{part}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categorized Symptom Selection Chips */}
            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Observed Symptoms by Category
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(SYMPTOM_TAXONOMY).map(([category, items]) => (
                  <div
                    key={category}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      {category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((symptom) => {
                        const isSelected = selectedSymptoms.includes(symptom);
                        return (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => toggleSymptom(symptom)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            <span>{symptom}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Severity, Distribution & Duration */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>3. Severity, Distribution & Symptom Onset</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Severity Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  How severe is the problem?
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['LOW', 'MEDIUM', 'HIGH', 'SEVERE'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        severity === sev
                          ? sev === 'SEVERE'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : sev === 'HIGH'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                            : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distribution Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Where are you seeing the problem?
                </label>
                <select
                  value={distribution}
                  onChange={(e) => setDistribution(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Single plant">Single plant</option>
                  <option value="Small group of plants">Small group of plants</option>
                  <option value="One section of the zone">One section of the zone</option>
                  <option value="Most of the zone">Most of the zone</option>
                  <option value="Entire farm">Entire farm</option>
                </select>
              </div>

              {/* Duration Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  When did you first notice symptoms?
                </label>
                <select
                  value={symptomDuration}
                  onChange={(e) => setSymptomDuration(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Today">Today</option>
                  <option value="1–3 days ago">1–3 days ago</option>
                  <option value="4–7 days ago">4–7 days ago</option>
                  <option value="1–2 weeks ago">1–2 weeks ago</option>
                  <option value="More than 2 weeks ago">More than 2 weeks ago</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Image Upload */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-500" />
              <span>4. Plant Photo Evidence</span>
            </h2>

            {/* Drag & Drop Upload Zone */}
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/40 transition text-center space-y-3 relative group">
              <input
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleImageFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click or drag and drop plant photos here
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports JPEG, PNG (Max 5 photos)</p>
              </div>
            </div>

            {/* Photography Guidance Tips */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-[11px] space-y-1">
              <strong className="block font-bold">For optimal AI & Agronomist accuracy:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-600 dark:text-slate-300">
                <li>Capture the affected leaf or stem clearly in sharp focus.</li>
                <li>Avoid dark or blurry photos; take shots in daylight.</li>
                <li>Include both healthy and affected foliage areas when possible.</li>
              </ul>
            </div>

            {/* Uploaded Thumbnails */}
            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group shadow-sm"
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Optional Agricultural Context (Expandable) */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <button
              type="button"
              onClick={() => setShowOptionalContext(!showOptionalContext)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-500" />
                <span>5. Optional Agricultural Field Context</span>
              </h2>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                {showOptionalContext ? 'Hide Options ▲' : 'Show Options ▼'}
              </span>
            </button>

            {showOptionalContext && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Recent Pesticide / Fungicide
                  </label>
                  <input
                    type="text"
                    value={recentPesticide}
                    onChange={(e) => setRecentPesticide(e.target.value)}
                    placeholder="e.g. Copper oxychloride 10 days ago"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Recent Fertilizer Application
                  </label>
                  <input
                    type="text"
                    value={recentFertilizer}
                    onChange={(e) => setRecentFertilizer(e.target.value)}
                    placeholder="e.g. Urea / NPK application"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Recent Irrigation
                  </label>
                  <input
                    type="text"
                    value={recentIrrigation}
                    onChange={(e) => setRecentIrrigation(e.target.value)}
                    placeholder="e.g. Drip irrigation 2 days ago"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Recent Rainfall
                  </label>
                  <input
                    type="text"
                    value={recentRainfall}
                    onChange={(e) => setRecentRainfall(e.target.value)}
                    placeholder="e.g. Moderate rain 3 days ago (14mm)"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Visible Insects / Pests
                  </label>
                  <input
                    type="text"
                    value={visibleInsects}
                    onChange={(e) => setVisibleInsects(e.target.value)}
                    placeholder="e.g. Small white flies spotted under leaves"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Recent Unusual Weather
                  </label>
                  <input
                    type="text"
                    value={unusualWeather}
                    onChange={(e) => setUnusualWeather(e.target.value)}
                    placeholder="e.g. High morning humidity (>85%)"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Farmer Notes / Observations
                  </label>
                  <textarea
                    rows={2}
                    value={farmerNotes}
                    onChange={(e) => setFarmerNotes(e.target.value)}
                    placeholder="Describe any other visual patterns, leaf odor, soil condition..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedSymptoms(['Spots', 'Yellowing', 'Browning']);
                setSeverity('HIGH');
              }}
              className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
            >
              Reset Form
            </button>

            <button
              type="button"
              onClick={handleAnalyze}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-extrabold transition shadow-lg shadow-emerald-600/25 flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Analyze Crop Health</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
