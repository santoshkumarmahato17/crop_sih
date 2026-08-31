import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Image as ImageIcon,
  Video,
  FileCheck,
  Sparkles,
  X,
  Play,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface UploadedMediaItem {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'video';
  previewUrl: string;
  file?: File;
  zone: string;
  progress: number;
  status: 'ready' | 'uploading' | 'analyzed';
}

export const PhotoVideoUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [selectedFarm, setSelectedFarm] = useState<string>('farm-101');
  const [selectedZone, setSelectedZone] = useState<string>('Z03');
  const [mediaList, setMediaList] = useState<UploadedMediaItem[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [batchAnalyzing, setBatchAnalyzing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sample quick test media presets
  const samplePresets: Array<{
    name: string;
    type: 'image' | 'video';
    size: string;
    previewUrl: string;
    description: string;
    zone: string;
  }> = [
    {
      name: 'Wheat_Yellow_Rust_Scan_01.jpg',
      type: 'image',
      size: '2.4 MB',
      previewUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80',
      description: 'Suspected Yellow Rust foliar chlorosis pustules on wheat canopy.',
      zone: 'Z03',
    },
    {
      name: 'Drone_Survey_Flight_Canopy.mp4',
      type: 'video',
      size: '18.6 MB',
      previewUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
      description: '4K low-altitude multi-rotor drone video over field perimeter.',
      zone: 'Z04',
    },
    {
      name: 'Corn_Blight_Lesions_Closeup.png',
      type: 'image',
      size: '3.1 MB',
      previewUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
      description: 'Macro crop leaf scan for fungal pathogen lesion screening.',
      zone: 'Z01',
    },
    {
      name: 'Paddy_Bacterial_Blight_Survey.jpg',
      type: 'image',
      size: '1.9 MB',
      previewUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80',
      description: 'Rice leaf tip marginal wilting and streak symptoms.',
      zone: 'Z02',
    },
  ];

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: UploadedMediaItem[] = [];

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.avi');
      const isImage = file.type.startsWith('image/') || file.name.endsWith('.jpg') || file.name.endsWith('.png') || file.name.endsWith('.tiff') || file.name.endsWith('.jpeg');

      if (isImage || isVideo) {
        const item: UploadedMediaItem = {
          id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: isVideo ? 'video' : 'image',
          previewUrl: URL.createObjectURL(file),
          file,
          zone: selectedZone,
          progress: 100,
          status: 'ready',
        };
        newItems.push(item);
      }
    });

    if (newItems.length > 0) {
      setMediaList((prev) => [...prev, ...newItems]);
      const photoCount = newItems.filter((i) => i.type === 'image').length;
      const videoCount = newItems.filter((i) => i.type === 'video').length;
      setToastMsg(`Added ${newItems.length} items (${photoCount} Photos, ${videoCount} Videos) to batch queue!`);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeMedia = (id: string) => {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
  };

  const loadAllSamples = () => {
    const samples: UploadedMediaItem[] = samplePresets.map((preset) => ({
      id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: preset.name,
      size: preset.size,
      type: preset.type,
      previewUrl: preset.previewUrl,
      zone: preset.zone,
      progress: 100,
      status: 'ready',
    }));
    setMediaList((prev) => [...prev, ...samples]);
    setToastMsg(`Loaded ${samples.length} sample field photos and drone flight survey videos!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleAnalyzeSingleItem = (item: UploadedMediaItem) => {
    navigate('/analysis', {
      state: {
        mediaName: item.name,
        mediaType: item.type,
        previewUrl: item.previewUrl,
        zoneCode: item.zone || selectedZone,
        farmId: selectedFarm,
      },
    });
  };

  const handleBatchAnalyze = () => {
    if (mediaList.length === 0) return;
    setBatchAnalyzing(true);
    setTimeout(() => {
      setBatchAnalyzing(false);
      navigate('/analysis', {
        state: {
          mediaName: mediaList[0].name,
          mediaType: mediaList[0].type,
          previewUrl: mediaList[0].previewUrl,
          zoneCode: mediaList[0].zone || selectedZone,
          farmId: selectedFarm,
          batchCount: mediaList.length,
          batchItems: mediaList.map((m) => ({ name: m.name, type: m.type, previewUrl: m.previewUrl, zone: m.zone })),
        },
      });
    }, 1200);
  };

  const photoCount = mediaList.filter((m) => m.type === 'image').length;
  const videoCount = mediaList.filter((m) => m.type === 'video').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 transition-colors duration-200">
      {/* 1. Page Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Multi-Photo & Video Upload Studio
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Upload multiple high-res leaf images and drone video survey recordings in one batch for parallel AI disease detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllSamples}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Sample Multi-Media</span>
          </button>
        </div>
      </div>

      {/* Action Toast */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xl sticky top-20 z-30">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. Target Field & Monitored Zone Association */}
      <div className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-xl space-y-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Default Farm & Zone Association for Ingestion:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Select Farm Holding:
            </label>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="farm-101">West Valley Holdings (Wheat)</option>
              <option value="farm-102">Green Ridge Agro-Park (Rice)</option>
              <option value="farm-103">Sunrise Plantation (Corn)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Default Target Zone:
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="Z01">Zone Z01 — North-West Quadrant (Healthy)</option>
              <option value="Z02">Zone Z02 — North-East Section</option>
              <option value="Z03">Zone Z03 — Central Fallow Buffer (Suspected Rust)</option>
              <option value="Z04">Zone Z04 — South-East Section (Moisture Stress)</option>
              <option value="Z05">Zone Z05 — Perimeter Edge</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Multi-File Drag-and-Drop Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-10 sm:p-12 rounded-3xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer space-y-4 ${
          isDragging
            ? 'bg-emerald-50/70 dark:bg-emerald-500/15 border-emerald-500 scale-[0.99] shadow-xl'
            : 'bg-white/90 dark:bg-slate-900/85 border-emerald-500/40 dark:border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-400 shadow-md backdrop-blur-xl'
        }`}
      >
        {/* Hidden Multi-file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <input
          ref={photoInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <input
          ref={videoInputRef}
          type="file"
          multiple
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md">
          <UploadCloud className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-1.5 max-w-lg">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            Click to upload or drag & drop crop photos / videos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Select <strong className="text-emerald-600 dark:text-emerald-400">multiple photos and multiple videos</strong> simultaneously. Supports High-Res JPG, PNG, TIFF, and MP4/MOV drone survey recordings (up to 500MB per file).
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              photoInputRef.current?.click();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
          >
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span>+ Select Multiple Photos</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              videoInputRef.current?.click();
            }}
            className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
          >
            <Video className="w-4 h-4 text-purple-600" />
            <span>+ Select Multiple Drone Videos</span>
          </button>
        </div>
      </div>

      {/* 4. Uploaded Multi-Media Queue & Batch Actions */}
      {mediaList.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl space-y-5 animate-in fade-in">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Uploaded Multi-Media Batch ({mediaList.length} items)</span>
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">📷 {photoCount} Photos</span>
                <span>•</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">🎥 {videoCount} Videos</span>
                <span>•</span>
                <span>Target: {selectedFarm}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add More</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaList([])}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>

              <button
                type="button"
                onClick={handleBatchAnalyze}
                disabled={batchAnalyzing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{batchAnalyzing ? 'Batch Ingesting...' : `Run AI on All (${mediaList.length})`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 relative group hover:border-emerald-500 transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => removeMedia(item.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white transition z-10"
                  title="Remove this item"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                  {item.type === 'image' ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                      <video src={item.previewUrl} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute p-3 rounded-full bg-purple-600 text-white shadow-lg">
                        <Play className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                  )}

                  <span
                    className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-white text-[10px] font-mono font-bold ${
                      item.type === 'image' ? 'bg-emerald-900/90' : 'bg-purple-900/90'
                    }`}
                  >
                    {item.type === 'image' ? '📷 PHOTO' : '🎥 DRONE VIDEO'} • {item.size}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Zone: <strong className="text-emerald-600 dark:text-emerald-400">{item.zone}</strong></span>
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      Ready for AI
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAnalyzeSingleItem(item)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze This File</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Preset Sample Media Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 shadow-md backdrop-blur-xl space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Sample Multi-Media Library (Try Multi-Upload Instantly)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click individual cards to add them to your batch queue, or test AI disease classification.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {samplePresets.map((preset, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-emerald-500 transition-all duration-200"
            >
              <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-950 relative">
                <img
                  src={preset.previewUrl}
                  alt={preset.name}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-white text-[10px] font-mono font-bold ${
                    preset.type === 'image' ? 'bg-emerald-900/90' : 'bg-purple-900/90'
                  }`}
                >
                  {preset.type === 'image' ? '📷 PHOTO' : '🎥 VIDEO'} • {preset.size}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate" title={preset.name}>
                  {preset.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const item: UploadedMediaItem = {
                    id: `sample-${Date.now()}-${idx}`,
                    name: preset.name,
                    size: preset.size,
                    type: preset.type,
                    previewUrl: preset.previewUrl,
                    zone: preset.zone,
                    progress: 100,
                    status: 'ready',
                  };
                  setMediaList((prev) => [...prev, item]);
                  setToastMsg(`Added "${preset.name}" to batch queue!`);
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                className="w-full py-2 rounded-xl bg-slate-200 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Batch Queue</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
