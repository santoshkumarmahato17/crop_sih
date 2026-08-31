import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  UploadCloud,
  FileText,
} from 'lucide-react';

interface AnalysisState {
  mediaName?: string;
  mediaType?: 'image' | 'video';
  previewUrl?: string;
  zoneCode?: string;
  farmId?: string;
}

export const AIDiseaseAnalysisPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as AnalysisState) || {};

  const mediaName = state.mediaName || 'Wheat_Leaf_Rust_Scan_01.jpg';
  const mediaType = state.mediaType || 'image';
  const previewUrl =
    state.previewUrl ||
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80';
  const zoneCode = state.zoneCode || 'Z03';

  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [activeOverlay, setActiveOverlay] = useState<'rgb' | 'lesions' | 'ndvi' | 'thermal'>('lesions');
  const [reportExported, setReportExported] = useState<boolean>(false);

  useEffect(() => {
    // Simulate AI inference pipeline
    setIsProcessing(true);
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [mediaName]);

  // Video Frame Timestamp Detections
  const videoKeyframes = [
    { time: '00:03', zone: 'Z03', label: 'Yellow Rust Pustules', confidence: 94.2, severity: 'HIGH' },
    { time: '00:08', zone: 'Z03', label: 'Foliar Chlorosis Margin', confidence: 89.5, severity: 'MODERATE' },
    { time: '00:14', zone: 'Z04', label: 'Canopy Transpiration Deficit', confidence: 92.1, severity: 'HIGH' },
    { time: '00:22', zone: 'Z01', label: 'Vegetative Foliage Nominal', confidence: 96.8, severity: 'LOW' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/upload')}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Back to Upload"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="p-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI & ML Disease Diagnosis Studio
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Computer vision deep learning model inspecting foliar chlorosis, pathogen lesions, and crop health indices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload New Media</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Media Viewer & Visual Heatmap Overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Target Inspection Media:
                </span>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-sm">
                  {mediaName}
                </h3>
              </div>

              {/* Overlay Modes Dock */}
              <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-1 text-[11px]">
                {[
                  { key: 'rgb', label: 'RGB Original' },
                  { key: 'lesions', label: '🔴 AI Lesion Boxes' },
                  { key: 'ndvi', label: '🌿 NDVI Heatmap' },
                  { key: 'thermal', label: '🌡️ Thermal Radiance' },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => setActiveOverlay(mode.key as any)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                      activeOverlay === mode.key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Display Window */}
            <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {isProcessing ? (
                <div className="text-center space-y-3 p-8">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono text-emerald-400 animate-pulse">
                    Executing ResNet-50 Vision Feature Extraction & Lesion Segmentation...
                  </p>
                </div>
              ) : (
                <>
                  <img
                    src={previewUrl}
                    alt={mediaName}
                    className={`w-full h-full object-cover transition duration-300 ${
                      activeOverlay === 'ndvi'
                        ? 'filter hue-rotate-90 saturate-200'
                        : activeOverlay === 'thermal'
                        ? 'filter invert hue-rotate-180 contrast-125'
                        : ''
                    }`}
                  />

                  {/* AI Bounding Box Overlays */}
                  {activeOverlay === 'lesions' && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-[28%] left-[34%] w-[26%] h-[32%] border-2 border-rose-500 rounded-lg bg-rose-500/20 shadow-lg flex flex-col justify-between p-1.5 animate-pulse">
                        <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded w-max">
                          Yellow Rust Pustule (94.2%)
                        </span>
                        <span className="text-[9px] text-rose-200 font-mono font-bold">
                          Area: 14.8%
                        </span>
                      </div>

                      <div className="absolute top-[55%] left-[62%] w-[20%] h-[24%] border-2 border-orange-400 rounded-lg bg-orange-400/20 shadow-lg p-1.5">
                        <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded w-max">
                          Foliar Chlorosis (89.5%)
                        </span>
                      </div>
                    </div>
                  )}

                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 text-emerald-400 text-xs font-mono font-bold border border-slate-800">
                    Zone {zoneCode} • AI Vision Active
                  </span>
                </>
              )}
            </div>

            {/* Video Timeline Frame Extraction if media is video */}
            {mediaType === 'video' && !isProcessing && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Extracted Video Keyframes & Disease Timestamp Markers:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {videoKeyframes.map((kf, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className="text-purple-600 dark:text-purple-400">{kf.time}</span>
                        <span
                          className={
                            kf.severity === 'HIGH'
                              ? 'text-rose-500'
                              : kf.severity === 'MODERATE'
                              ? 'text-orange-400'
                              : 'text-emerald-400'
                          }
                        >
                          {kf.confidence}%
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {kf.label}
                      </p>
                      <span className="text-[10px] text-slate-500">Zone {kf.zone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: AI Diagnosis Results & Treatment Prescription */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>AI Vision Diagnosis Verdict</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ground-truth neural network classification results.
              </p>
            </div>

            {/* Disease Primary Finding */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 font-mono">
                  Pathogen Identified
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono">
                  HIGH SEVERITY
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Yellow Rust (Puccinia striiformis)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Foliar chlorotic stripes and active uredinial pustules observed on target canopy surface.
              </p>
            </div>

            {/* Micro Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                  AI Confidence
                </span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  94.2%
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                  Canopy Affected
                </span>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                  14.8%
                </p>
              </div>
            </div>

            {/* Prescribed Agricultural Treatment Action */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Prescribed Action Plan</span>
              </span>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Apply targeted systemic triazole/strobilurin fungicide within 48h.</li>
                <li>Halt overhead irrigation to reduce foliar leaf moisture duration.</li>
                <li>Conduct physical field ground-scouting on NW quadrant of Zone {zoneCode}.</li>
              </ul>
            </div>

            {/* Export Diagnostic Report Button */}
            <button
              type="button"
              onClick={() => {
                setReportExported(true);
                setTimeout(() => setReportExported(false), 3000);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>{reportExported ? '✓ Report PDF Downloaded' : 'Export AI Diagnostic Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
