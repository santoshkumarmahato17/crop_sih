import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Zap,
  Info,
  RotateCcw,
  Sparkles,
  FlaskConical,
  Check,
  Bug,
  Activity,
} from 'lucide-react';

interface QualityAssessment {
  is_acceptable: boolean;
  quality_status: string;
  blur_score: number;
  is_blurry: boolean;
  brightness: number;
  is_too_dark: boolean;
  is_too_bright: boolean;
  contrast: number;
  advisory_notes: string[];
}

interface DiseaseDetails {
  scientific_name?: string;
  condition_type?: string;
  description?: string;
  urgency?: string;
  recommendation?: string;
}

interface PredictionResponse {
  success: boolean;
  crop_type?: string;
  prediction: string;
  predicted_class_raw?: string;
  category?: 'Pest' | 'Disease' | 'Healthy' | string;
  confidence: number;
  reliable: boolean;
  status: string;
  threshold_used?: number;
  probabilities: Record<string, number>;
  explanation?: string;
  disease_details?: DiseaseDetails;
  quality_assessment?: QualityAssessment;
}

interface SampleImageItem {
  class_name: string;
  filename: string;
  relative_path: string;
}

type CropMode = 'maize' | 'tomato';

const MAIZE_CLASSES = [
  'Fall army worm',
  'Grasshopper',
  'Healthy',
  'Leaf Beetle',
  'Leaf Blight',
  'Leaf Spot',
  'Streak Virus',
];

const TOMATO_CLASSES = [
  'Healthy',
  'Leaf Blight',
  'Leaf Curl',
  'Septoria Leaf Spot',
  'Verticillium Wilt',
];

const MAIZE_PESTS = ['Fall army worm', 'Grasshopper', 'Leaf Beetle'];
const MAIZE_DISEASES = ['Leaf Blight', 'Leaf Spot', 'Streak Virus'];

export const TomatoCameraAnalysisPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active crop selection: Maize (Corn) or Tomato
  const [selectedCrop, setSelectedCrop] = useState<CropMode>('maize');

  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'samples'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Inference state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleImageItem | null>(null);
  const [sampleImages, setSampleImages] = useState<SampleImageItem[]>([]);

  const activeClasses = selectedCrop === 'maize' ? MAIZE_CLASSES : TOMATO_CLASSES;

  // Start Camera Stream
  const startCamera = async (mode = facingMode) => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access not available. You can also upload a leaf photo or pick a sample below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [facingMode, activeTab, capturedImage]);

  // Load sample images whenever selectedCrop changes
  useEffect(() => {
    const fetchSamples = async () => {
      setSampleImages([]);
      setSelectedSample(null);

      const endpoints =
        selectedCrop === 'maize'
          ? [
              'http://localhost:8001/api/maize/sample-images',
              '/api/maize/sample-images',
              'http://localhost:8000/api/maize/sample-images',
            ]
          : [
              'http://localhost:8001/api/sample-images',
              '/api/sample-images',
              'http://localhost:8000/api/sample-images',
            ];

      for (const url of endpoints) {
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const data = await resp.json();
            if (data.samples && data.samples.length > 0) {
              setSampleImages(data.samples);
              break;
            }
          }
        } catch {
          // try next
        }
      }
    };
    fetchSamples();
  }, [selectedCrop]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Switch crop mode
  const handleCropChange = (newCrop: CropMode) => {
    if (newCrop === selectedCrop) return;
    setSelectedCrop(newCrop);
    setCapturedImage(null);
    setResult(null);
    setErrorMsg(null);
    setSelectedSample(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  // Capture frame from video stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          analyzeImageBlob(blob);
        }
      },
      'image/jpeg',
      0.92
    );

    stopCamera();
  };

  // Handle gallery file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    stopCamera();
    analyzeImageBlob(file);
  };

  // Select sample image from dataset
  const handleSelectSample = async (sample: SampleImageItem) => {
    setSelectedSample(sample);
    setErrorMsg(null);
    setIsAnalyzing(true);
    setResult(null);

    const relParam = encodeURIComponent(sample.relative_path);
    const streamUrls =
      selectedCrop === 'maize'
        ? [
            `http://localhost:8001/api/maize/sample-image-file?rel_path=${relParam}`,
            `/api/maize/sample-image-file?rel_path=${relParam}`,
            `http://localhost:8000/api/maize/sample-image-file?rel_path=${relParam}`,
          ]
        : [
            `http://localhost:8001/api/sample-image-file?rel_path=${relParam}`,
            `/api/sample-image-file?rel_path=${relParam}`,
            `http://localhost:8000/api/sample-image-file?rel_path=${relParam}`,
          ];

    let imageBlob: Blob | null = null;

    for (const u of streamUrls) {
      try {
        const resp = await fetch(u);
        if (resp.ok) {
          imageBlob = await resp.blob();
          break;
        }
      } catch {
        // try next
      }
    }

    if (imageBlob) {
      setCapturedImage(URL.createObjectURL(imageBlob));
      stopCamera();
      analyzeImageBlob(imageBlob);
    } else {
      setIsAnalyzing(false);
      setErrorMsg('Could not fetch sample image. Please try live camera or file upload.');
    }
  };

  // Submit to ML Inference API
  const analyzeImageBlob = async (blob: Blob) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', blob, `${selectedCrop}_leaf.jpg`);

    const endpoints =
      selectedCrop === 'maize'
        ? [
            'http://localhost:8001/api/maize/predict',
            '/api/maize/predict',
            'http://localhost:8000/api/maize/predict',
          ]
        : [
            'http://localhost:8001/api/predict',
            '/api/predict',
            'http://localhost:8000/api/predict',
          ];

    let success = false;
    for (const url of endpoints) {
      try {
        const resp = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (resp.ok) {
          const data: PredictionResponse = await resp.json();
          setResult(data);
          success = true;
          break;
        }
      } catch {
        // Try next endpoint
      }
    }

    if (!success) {
      setErrorMsg(
        `Could not connect to ${
          selectedCrop === 'maize' ? 'Maize' : 'Tomato'
        } ML Inference service. Verify port 8001 or backend on port 8000 is active.`
      );
    }

    setIsAnalyzing(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setResult(null);
    setErrorMsg(null);
    setSelectedSample(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  // Category determination helper
  const getCategoryInfo = (predClass: string) => {
    if (selectedCrop === 'maize') {
      if (predClass === 'Healthy') {
        return {
          type: 'Healthy',
          label: 'Optimal Foliage Health',
          icon: <Leaf className="w-4 h-4 text-emerald-400" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          accentColor: 'emerald',
        };
      }
      if (MAIZE_PESTS.includes(predClass)) {
        return {
          type: 'Pest Detected',
          label: 'Pest Infestation Detected',
          icon: <Bug className="w-4 h-4 text-amber-400" />,
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          accentColor: 'amber',
        };
      }
      return {
        type: 'Disease Detected',
        label: 'Pathogenic Disease Detected',
        icon: <Activity className="w-4 h-4 text-rose-400" />,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        accentColor: 'rose',
      };
    } else {
      if (predClass === 'Healthy') {
        return {
          type: 'Healthy',
          label: 'Healthy Foliage',
          icon: <Leaf className="w-4 h-4 text-emerald-400" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          accentColor: 'emerald',
        };
      }
      return {
        type: 'Disease Detected',
        label: 'Foliar Disease Detected',
        icon: <Activity className="w-4 h-4 text-rose-400" />,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        accentColor: 'rose',
      };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Leaf Diagnostics · Edge-Optimized MobileNetV3 Pipeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            {selectedCrop === 'maize' ? (
              <>
                <span className="text-amber-500 text-2xl">🌽</span>
                Maize Leaf Pest & Disease Analysis
              </>
            ) : (
              <>
                <Leaf className="w-7 h-7 text-emerald-500" />
                Tomato Leaf Disease Analysis
              </>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {selectedCrop === 'maize'
              ? 'Real-time diagnostic AI for 7 maize classes across foliage pests (Fall armyworm, Grasshopper, Leaf Beetle) and diseases (Leaf Blight, Leaf Spot, Streak Virus).'
              : 'Real-time deep learning diagnostic pipeline powered by MobileNetV3. Capture foliage via phone camera, upload photos, or evaluate verified dataset samples.'}
          </p>
        </div>

        {/* Crop Selector Switch */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
            <button
              onClick={() => handleCropChange('maize')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                selectedCrop === 'maize'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🌽</span>
              <span>Maize (7 Classes)</span>
            </button>
            <button
              onClick={() => handleCropChange('tomato')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                selectedCrop === 'tomato'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🍅</span>
              <span>Tomato (5 Classes)</span>
            </button>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>MobileNetV3 (6.5 MB)</span>
          </div>
        </div>
      </div>

      {/* Main Diagnostic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Side: Viewport / Camera / Upload / Samples (7 Cols) ── */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setActiveTab('camera');
                    setCapturedImage(null);
                    setResult(null);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'camera'
                      ? selectedCrop === 'maize'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Phone Camera
                </button>
                <button
                  onClick={() => {
                    setActiveTab('upload');
                    stopCamera();
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'upload'
                      ? selectedCrop === 'maize'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Photo
                </button>
                <button
                  onClick={() => {
                    setActiveTab('samples');
                    stopCamera();
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'samples'
                      ? selectedCrop === 'maize'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Dataset Samples ({activeClasses.length})
                </button>
              </div>

              {capturedImage && (
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset View
                </button>
              )}
            </div>

            {/* Viewport Box */}
            <div className="relative aspect-video sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Target Foliage"
                  className="w-full h-full object-contain bg-slate-950"
                />
              ) : activeTab === 'camera' ? (
                cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                    <Camera className="w-14 h-14 mb-3 text-slate-600 animate-pulse" />
                    <p className="text-sm font-medium text-slate-300">
                      {cameraError || 'Initializing Camera Feed...'}
                    </p>
                    <button
                      onClick={() => startCamera()}
                      className={`mt-4 px-4 py-2 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                        selectedCrop === 'maize'
                          ? 'bg-amber-600 hover:bg-amber-500'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" /> Start Camera
                    </button>
                  </div>
                )
              ) : activeTab === 'upload' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl cursor-pointer transition bg-slate-900/40 hover:bg-slate-900/60"
                >
                  <UploadCloud className="w-14 h-14 text-emerald-400 mb-3" />
                  <p className="text-sm font-bold text-slate-200">
                    Click to browse or drop {selectedCrop === 'maize' ? 'maize' : 'tomato'} leaf photograph
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports high-resolution JPG, JPEG, and PNG images
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <FlaskConical className="w-12 h-12 text-emerald-400/80 mb-2" />
                  <p className="text-sm font-bold text-slate-200">
                    Pick a {selectedCrop === 'maize' ? 'Maize' : 'Tomato'} Dataset Sample Below
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Select any real test image from the dataset to run instant neural diagnosis with full confidence scoring.
                  </p>
                </div>
              )}

              {/* Viewfinder Target Framing Reticle */}
              {!capturedImage && activeTab === 'camera' && cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-3/4 h-3/4 border-2 border-dashed rounded-2xl relative ${
                      selectedCrop === 'maize' ? 'border-amber-400/80' : 'border-emerald-400/80'
                    }`}
                  >
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-slate-700">
                      Align {selectedCrop === 'maize' ? 'Maize' : 'Tomato'} Leaf in Frame
                    </span>
                  </div>
                </div>
              )}

              {/* Camera switch button */}
              {!capturedImage && activeTab === 'camera' && cameraActive && (
                <button
                  onClick={toggleCameraFacing}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition border border-white/10"
                  title="Flip Camera (Front/Rear)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Analyzing Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-emerald-400 z-20">
                  <RefreshCw className="w-10 h-10 animate-spin mb-3 text-emerald-400" />
                  <p className="text-sm font-bold tracking-wide">
                    Running {selectedCrop === 'maize' ? 'Maize' : 'Tomato'} Neural Inference...
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Analyzing across {activeClasses.length} distinct classes
                  </p>
                </div>
              )}
            </div>

            {/* Viewport Action Bar */}
            <div className="flex items-center gap-3">
              {activeTab === 'camera' && !capturedImage ? (
                <button
                  onClick={capturePhoto}
                  disabled={!cameraActive || isAnalyzing}
                  className={`flex-1 py-3 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-600 ${
                    selectedCrop === 'maize'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Capture Leaf Photo
                </button>
              ) : capturedImage ? (
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake / New Photo
                </button>
              ) : null}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold flex items-center gap-2 transition"
                title="Browse Image File"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Quick Dataset Samples Drawer */}
          {activeTab === 'samples' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select {selectedCrop === 'maize' ? 'Maize' : 'Tomato'} Dataset Samples
                </span>
                <span
                  className={`text-xs font-bold ${
                    selectedCrop === 'maize' ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                >
                  {activeClasses.length} Classes Available
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
                {activeClasses.map((clsName) => {
                  const sample = sampleImages.find((s) => s.class_name.toLowerCase() === clsName.toLowerCase()) || {
                    class_name: clsName,
                    filename: 'sample.jpg',
                    relative_path: `${clsName.toLowerCase()}/sample.jpg`,
                  };
                  const isSelected = selectedSample?.class_name === sample.class_name;

                  // Category tag for maize samples
                  const isPest = MAIZE_PESTS.includes(clsName);
                  const isDisease = MAIZE_DISEASES.includes(clsName);

                  return (
                    <button
                      key={clsName}
                      onClick={() => handleSelectSample(sample)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                        isSelected
                          ? selectedCrop === 'maize'
                            ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {selectedCrop === 'maize' ? (
                          isPest ? (
                            <Bug className="w-3.5 h-3.5 text-amber-500" />
                          ) : isDisease ? (
                            <Activity className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                          )
                        ) : (
                          <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      <div className="font-bold text-xs leading-tight text-slate-800 dark:text-slate-200">
                        {clsName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedCrop === 'maize'
                          ? isPest
                            ? 'Pest'
                            : isDisease
                            ? 'Disease'
                            : 'Healthy'
                          : 'Foliar Sample'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Side: Diagnostic Verdict & Agronomic Guidance (5 Cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-bold text-sm">Connection Notice</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {result ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-5">
              {/* Verdict Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Pathology & Agronomic Verdict
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                      result.status === 'High Confidence'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {result.status === 'High Confidence' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {result.status}
                  </span>
                </div>

                {/* Primary Category Badge */}
                {(() => {
                  const cat = getCategoryInfo(result.prediction);
                  return (
                    <div className="mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black border uppercase tracking-wider ${cat.badgeClass}`}
                      >
                        {cat.icon}
                        {cat.type}
                      </span>
                    </div>
                  );
                })()}

                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {result.prediction}
                </div>

                <div className="flex items-center justify-between mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Confidence Level:
                  </span>
                  <span
                    className={`text-lg font-black ${
                      result.confidence >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {result.confidence}%
                  </span>
                </div>
              </div>

              {/* Class Probability Distribution */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-3 flex items-center justify-between">
                  <span>Class Probability Breakdown ({activeClasses.length} Classes)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Softmax Distribution</span>
                </h3>
                <div className="flex flex-col gap-2.5">
                  {activeClasses.map((cls) => {
                    const prob = result.probabilities[cls] ?? 0;
                    const pct = Math.round(prob * 1000) / 10;
                    const isTop = result.prediction.toLowerCase() === cls.toLowerCase();

                    // Distinctive badge color for top prediction
                    const barColor = isTop
                      ? selectedCrop === 'maize'
                        ? MAIZE_PESTS.includes(cls)
                          ? 'bg-amber-500'
                          : MAIZE_DISEASES.includes(cls)
                          ? 'bg-rose-500'
                          : 'bg-emerald-500'
                        : 'bg-emerald-500'
                      : 'bg-slate-400 dark:bg-slate-600';

                    return (
                      <div key={cls} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span
                            className={
                              isTop
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5'
                                : 'text-slate-700 dark:text-slate-300 flex items-center gap-1.5'
                            }
                          >
                            {selectedCrop === 'maize' && (
                              <span className="text-[10px] opacity-70">
                                {MAIZE_PESTS.includes(cls)
                                  ? '🐛'
                                  : MAIZE_DISEASES.includes(cls)
                                  ? '🔬'
                                  : '🌿'}
                              </span>
                            )}
                            {cls}
                          </span>
                          <span
                            className={
                              isTop
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'text-slate-500 dark:text-slate-400'
                            }
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agronomic Advisory & Integrated Pest Management Guidance */}
              {result.explanation && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">
                    <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                    Integrated Pest & Disease Management (IPM) Advisory
                  </div>
                  <p>{result.explanation}</p>
                </div>
              )}

              {/* Quality Assessment Alerts */}
              {result.quality_assessment && !result.quality_assessment.is_acceptable && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <span className="font-bold">Image Quality Notice: </span>
                    {result.quality_assessment.advisory_notes.join(' ')}
                  </div>
                </div>
              )}

              {/* Quick Retake Action */}
              <button
                onClick={handleRetake}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scan Another Leaf
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[380px] shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-500">
                {selectedCrop === 'maize' ? (
                  <span className="text-3xl">🌽</span>
                ) : (
                  <Leaf className="w-8 h-8" />
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Awaiting {selectedCrop === 'maize' ? 'Maize' : 'Tomato'} Foliage Scan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Aim phone camera directly at the affected leaf, upload a photo, or choose any dataset sample to trigger real-time AI classification.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-1.5 max-w-sm">
                {activeClasses.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
