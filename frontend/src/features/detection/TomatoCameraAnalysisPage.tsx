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
  Crosshair,
  Layers,
  SlidersHorizontal,
  Flame,
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

interface YOLODetectionItem {
  id: number;
  label: string;
  confidence: number;
  box: [number, number, number, number];
  width: number;
  height: number;
  area_px: number;
}

interface YOLOResponse {
  success: boolean;
  image_dimensions: { width: number; height: number };
  lesion_count: number;
  severity_percentage: number;
  healthy_area_pct: number;
  severity_level: string;
  urgency: string;
  status_tag: string;
  total_leaf_area_px: number;
  infected_area_px: number;
  detections: YOLODetectionItem[];
  treatment_recommendation: string;
  layers: {
    original: string;
    yolo_bbox: string;
    segmentation: string;
    spectral_heatmap: string;
  };
}

interface SampleImageItem {
  class_name: string;
  filename: string;
  relative_path: string;
}

interface YOLOSampleItem {
  filename: string;
  title: string;
  description: string;
  category: string;
  relative_path: string;
}

type DiagnosticMode = 'maize' | 'tomato' | 'yolo';
type VisualLayer = 'original' | 'yolo_bbox' | 'segmentation' | 'spectral_heatmap';

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

  // Diagnostic mode: Maize (Corn), Tomato, or YOLO Lesion Detection
  const [selectedCrop, setSelectedCrop] = useState<DiagnosticMode>('yolo');

  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'samples'>('samples');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Inference state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [yoloResult, setYoloResult] = useState<YOLOResponse | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<VisualLayer>('yolo_bbox');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sample items
  const [selectedSample, setSelectedSample] = useState<SampleImageItem | null>(null);
  const [sampleImages, setSampleImages] = useState<SampleImageItem[]>([]);
  const [yoloSamples, setYoloSamples] = useState<YOLOSampleItem[]>([]);
  const [selectedYoloSample, setSelectedYoloSample] = useState<YOLOSampleItem | null>(null);

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
      setSelectedYoloSample(null);

      if (selectedCrop === 'yolo') {
        const endpoints = [
          'http://localhost:8001/api/yolo/sample-images',
          '/api/yolo/sample-images',
          'http://localhost:8000/api/yolo/sample-images',
        ];
        for (const url of endpoints) {
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              const data = await resp.json();
              if (data.samples && data.samples.length > 0) {
                setYoloSamples(data.samples);
                break;
              }
            }
          } catch {
            // try next
          }
        }
      } else {
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
      }
    };
    fetchSamples();
  }, [selectedCrop]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Switch crop mode
  const handleCropChange = (newMode: DiagnosticMode) => {
    if (newMode === selectedCrop) return;
    setSelectedCrop(newMode);
    setCapturedImage(null);
    setResult(null);
    setYoloResult(null);
    setErrorMsg(null);
    setSelectedSample(null);
    setSelectedYoloSample(null);
    setSelectedLayer('yolo_bbox');
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

  // Select sample image for Maize / Tomato
  const handleSelectSample = async (sample: SampleImageItem) => {
    setSelectedSample(sample);
    setErrorMsg(null);
    setIsAnalyzing(true);
    setResult(null);
    setYoloResult(null);

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

  // Select sample image for YOLO mode
  const handleSelectYoloSample = async (sample: YOLOSampleItem) => {
    setSelectedYoloSample(sample);
    setErrorMsg(null);
    setIsAnalyzing(true);
    setResult(null);
    setYoloResult(null);

    const relParam = encodeURIComponent(sample.relative_path);
    const streamUrls = [
      `http://localhost:8001/api/yolo/sample-image-file?rel_path=${relParam}`,
      `/api/yolo/sample-image-file?rel_path=${relParam}`,
      `http://localhost:8000/api/yolo/sample-image-file?rel_path=${relParam}`,
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
    setYoloResult(null);

    const formData = new FormData();
    formData.append('image', blob, `${selectedCrop}_leaf.jpg`);

    if (selectedCrop === 'yolo') {
      const endpoints = [
        'http://localhost:8001/api/yolo/analyze-disease',
        '/api/yolo/analyze-disease',
        'http://localhost:8000/api/yolo/analyze-disease',
      ];

      let success = false;
      for (const url of endpoints) {
        try {
          const resp = await fetch(url, { method: 'POST', body: formData });
          if (resp.ok) {
            const data: YOLOResponse = await resp.json();
            setYoloResult(data);
            setSelectedLayer('yolo_bbox');
            success = true;
            break;
          }
        } catch {
          // try next
        }
      }

      if (!success) {
        setErrorMsg('Could not connect to YOLO Disease Analysis service. Ensure port 8001 or 8000 is active.');
      }
    } else {
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
          const resp = await fetch(url, { method: 'POST', body: formData });
          if (resp.ok) {
            const data: PredictionResponse = await resp.json();
            setResult(data);
            success = true;
            break;
          }
        } catch {
          // try next
        }
      }

      if (!success) {
        setErrorMsg(
          `Could not connect to ${selectedCrop === 'maize' ? 'Maize' : 'Tomato'} ML Inference service.`
        );
      }
    }

    setIsAnalyzing(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setResult(null);
    setYoloResult(null);
    setErrorMsg(null);
    setSelectedSample(null);
    setSelectedYoloSample(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  // Active image to display in viewport
  const displayImageSrc = () => {
    if (selectedCrop === 'yolo' && yoloResult) {
      if (selectedLayer === 'yolo_bbox') return yoloResult.layers.yolo_bbox;
      if (selectedLayer === 'segmentation') return yoloResult.layers.segmentation;
      if (selectedLayer === 'spectral_heatmap') return yoloResult.layers.spectral_heatmap;
      return yoloResult.layers.original;
    }
    return capturedImage;
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
        };
      }
      if (MAIZE_PESTS.includes(predClass)) {
        return {
          type: 'Pest Detected',
          label: 'Pest Infestation Detected',
          icon: <Bug className="w-4 h-4 text-amber-400" />,
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      }
      return {
        type: 'Disease Detected',
        label: 'Pathogenic Disease Detected',
        icon: <Activity className="w-4 h-4 text-rose-400" />,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      };
    } else {
      if (predClass === 'Healthy') {
        return {
          type: 'Healthy',
          label: 'Healthy Foliage',
          icon: <Leaf className="w-4 h-4 text-emerald-400" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      }
      return {
        type: 'Disease Detected',
        label: 'Foliar Disease Detected',
        icon: <Activity className="w-4 h-4 text-rose-400" />,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
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
            AI Disease Analysis · YOLO Object Detection & Multi-Region Segmentation
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            {selectedCrop === 'yolo' ? (
              <>
                <Crosshair className="w-7 h-7 text-rose-500" />
                YOLO Foliar Lesion Detection & Severity
              </>
            ) : selectedCrop === 'maize' ? (
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
            {selectedCrop === 'yolo'
              ? 'YOLO deep learning engine localizing disease lesions with bounding boxes, multi-region semantic segmentation, and quantitative canopy severity scoring.'
              : selectedCrop === 'maize'
              ? 'Real-time diagnostic AI for 7 maize classes across foliage pests (Fall armyworm, Grasshopper, Leaf Beetle) and diseases (Leaf Blight, Leaf Spot, Streak Virus).'
              : 'Real-time deep learning diagnostic pipeline powered by MobileNetV3. Capture foliage via phone camera, upload photos, or evaluate verified dataset samples.'}
          </p>
        </div>

        {/* Diagnostic Mode Selector Switch */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
            <button
              onClick={() => handleCropChange('yolo')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCrop === 'yolo'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>YOLO Lesions (New)</span>
            </button>
            <button
              onClick={() => handleCropChange('maize')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
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
            <span>{selectedCrop === 'yolo' ? 'YOLOv8 + CV' : 'MobileNetV3'}</span>
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
                    setYoloResult(null);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'camera'
                      ? selectedCrop === 'yolo'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : selectedCrop === 'maize'
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
                      ? selectedCrop === 'yolo'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : selectedCrop === 'maize'
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
                      ? selectedCrop === 'yolo'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : selectedCrop === 'maize'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Dataset Samples ({selectedCrop === 'yolo' ? yoloSamples.length : activeClasses.length})
                </button>
              </div>

              {capturedImage && (
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* YOLO Visual Layer Switcher Bar (Available when YOLO result is ready) */}
            {selectedCrop === 'yolo' && yoloResult && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 pl-1">
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  Visual Analysis Layer:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedLayer('yolo_bbox')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      selectedLayer === 'yolo_bbox'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-900'
                    }`}
                    title="Figure 3: YOLO red bounding boxes on lesions"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>🎯 YOLO BBoxes</span>
                  </button>
                  <button
                    onClick={() => setSelectedLayer('segmentation')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      selectedLayer === 'segmentation'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-900'
                    }`}
                    title="Figure 2: Multi-region color-coded semantic segmentation"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>🎨 Segmentation</span>
                  </button>
                  <button
                    onClick={() => setSelectedLayer('spectral_heatmap')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      selectedLayer === 'spectral_heatmap'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-900'
                    }`}
                    title="Figure 1: Spectral pseudo-color thermal heatmap"
                  >
                    <Flame className="w-3 h-3" />
                    <span>🌈 Spectral Heatmap</span>
                  </button>
                  <button
                    onClick={() => setSelectedLayer('original')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      selectedLayer === 'original'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white bg-slate-900'
                    }`}
                    title="Original untouched leaf image"
                  >
                    <span>📸 Original</span>
                  </button>
                </div>
              </div>
            )}

            {/* Viewport Box */}
            <div className="relative aspect-video sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
              {displayImageSrc() ? (
                <img
                  src={displayImageSrc()!}
                  alt="Target Foliage Analysis"
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
                        selectedCrop === 'yolo'
                          ? 'bg-rose-600 hover:bg-rose-500'
                          : selectedCrop === 'maize'
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
                  <UploadCloud className="w-14 h-14 text-rose-400 mb-3" />
                  <p className="text-sm font-bold text-slate-200">
                    Click to browse or drop leaf photograph for YOLO analysis
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports high-resolution JPG, JPEG, and PNG images
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <FlaskConical className="w-12 h-12 text-rose-400/80 mb-2" />
                  <p className="text-sm font-bold text-slate-200">
                    Pick a Dataset Sample Below
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Select any real sample (including the user reference blight and spot images) to execute instant YOLO lesion detection and multi-region segmentation.
                  </p>
                </div>
              )}

              {/* Viewfinder Target Framing Reticle */}
              {!capturedImage && activeTab === 'camera' && cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className={`w-3/4 h-3/4 border-2 border-dashed rounded-2xl relative ${
                      selectedCrop === 'yolo'
                        ? 'border-rose-400/80'
                        : selectedCrop === 'maize'
                        ? 'border-amber-400/80'
                        : 'border-emerald-400/80'
                    }`}
                  >
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-slate-700">
                      Center Foliage In Reticle
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
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-rose-400 z-20">
                  <RefreshCw className="w-10 h-10 animate-spin mb-3 text-rose-400" />
                  <p className="text-sm font-bold tracking-wide">
                    {selectedCrop === 'yolo'
                      ? 'Executing YOLO Lesion Extraction & Segmentation...'
                      : `Running ${selectedCrop === 'maize' ? 'Maize' : 'Tomato'} Neural Inference...`}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedCrop === 'yolo'
                      ? 'Computing bounding boxes, spectral heatmap, and severity ratio'
                      : `Classifying across ${activeClasses.length} foliar pathology classes`}
                  </p>
                </div>
              )}
            </div>

            {/* Segmentation Color Legend (Shown when segmentation layer is active) */}
            {selectedCrop === 'yolo' && yoloResult && selectedLayer === 'segmentation' && (
              <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
                <span className="text-slate-400 text-[11px] font-mono uppercase">Legend:</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-[#22a038] inline-block border border-white/20"></span>
                  Healthy Lamina
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-3 rounded-full bg-[#f5c31e] inline-block border border-white/20"></span>
                  Chlorotic Halo
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-3 h-3 rounded-full bg-[#b42828] inline-block border border-white/20"></span>
                  Necrotic Core
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-[#201c1c] inline-block border border-white/20"></span>
                  Background
                </span>
              </div>
            )}

            {/* Viewport Action Bar */}
            <div className="flex items-center gap-3">
              {activeTab === 'camera' && !capturedImage ? (
                <button
                  onClick={capturePhoto}
                  disabled={!cameraActive || isAnalyzing}
                  className={`flex-1 py-3 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-600 ${
                    selectedCrop === 'yolo'
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                      : selectedCrop === 'maize'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Capture Foliage Photo
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
                  Select {selectedCrop === 'yolo' ? 'YOLO Benchmark' : selectedCrop === 'maize' ? 'Maize' : 'Tomato'} Samples (Click to Analyze)
                </span>
                <span
                  className={`text-xs font-bold ${
                    selectedCrop === 'yolo'
                      ? 'text-rose-500'
                      : selectedCrop === 'maize'
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {selectedCrop === 'yolo' ? yoloSamples.length : activeClasses.length} Items Available
                </span>
              </div>

              {selectedCrop === 'yolo' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {yoloSamples.map((s) => {
                    const isSelected = selectedYoloSample?.filename === s.filename;
                    return (
                      <button
                        key={s.filename}
                        onClick={() => handleSelectYoloSample(s)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Crosshair className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                            {s.category}
                          </span>
                        </div>
                        <div className="font-bold text-xs leading-tight text-slate-900 dark:text-slate-100">
                          {s.title}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {s.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
                  {activeClasses.map((clsName) => {
                    const sample = sampleImages.find((s) => s.class_name.toLowerCase() === clsName.toLowerCase()) || {
                      class_name: clsName,
                      filename: 'sample.jpg',
                      relative_path: `${clsName.toLowerCase()}/sample.jpg`,
                    };
                    const isSelected = selectedSample?.class_name === sample.class_name;
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
              )}
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

          {/* YOLO Mode Result Card */}
          {selectedCrop === 'yolo' && yoloResult ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-5">
              {/* Verdict Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    YOLO Foliar Pathology Diagnosis
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                      yoloResult.severity_percentage < 5.0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : yoloResult.severity_percentage < 20.0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    {yoloResult.status_tag}
                  </span>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {yoloResult.severity_level}
                </div>

                {/* Quantitative Severity Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400">Canopy Tissue Damage Ratio:</span>
                    <span
                      className={
                        yoloResult.severity_percentage > 20
                          ? 'text-rose-500 font-black'
                          : 'text-amber-500 font-black'
                      }
                    >
                      {yoloResult.severity_percentage}% Infected
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        yoloResult.severity_percentage < 5.0
                          ? 'bg-emerald-500'
                          : yoloResult.severity_percentage < 20.0
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, yoloResult.severity_percentage))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0% (Healthy)</span>
                    <span>5% (Mild)</span>
                    <span>20% (Moderate)</span>
                    <span>40%+ (Critical)</span>
                  </div>
                </div>

                {/* Pathology Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Lesions</span>
                    <div className="text-lg font-black text-rose-500 mt-0.5">
                      {yoloResult.lesion_count}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Healthy Leaf</span>
                    <div className="text-lg font-black text-emerald-500 mt-0.5">
                      {yoloResult.healthy_area_pct}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Urgency</span>
                    <div className="text-lg font-black text-amber-500 mt-0.5">
                      {yoloResult.urgency}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected Lesion Instances List */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-2 flex items-center justify-between">
                  <span>Detected Lesion Bounding Boxes ({yoloResult.detections.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Figure 3 YOLO Instances</span>
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {yoloResult.detections.slice(0, 10).map((det) => (
                    <div
                      key={det.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-500 font-black text-[10px] flex items-center justify-center">
                          #{det.id}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {det.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-emerald-500 font-bold">{det.confidence}%</span>
                        <span className="text-slate-400">({det.area_px} px²)</span>
                      </div>
                    </div>
                  ))}
                  {yoloResult.detections.length > 10 && (
                    <p className="text-[10px] text-center text-slate-400 pt-1">
                      + {yoloResult.detections.length - 10} additional smaller lesion clusters detected
                    </p>
                  )}
                </div>
              </div>

              {/* Agronomic IPM Action Protocol */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">
                  <Info className="w-4 h-4 text-rose-500 shrink-0" />
                  Targeted Agronomic IPM Treatment Plan
                </div>
                <p>{yoloResult.treatment_recommendation}</p>
              </div>

              {/* Quick Retake Action */}
              <button
                onClick={handleRetake}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Analyze Another Leaf Sample
              </button>
            </div>
          ) : result ? (
            /* Maize / Tomato Classification Result Card */
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

              {/* Agronomic Advisory */}
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
            /* Awaiting Scan Placeholder */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[380px] shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
                {selectedCrop === 'yolo' ? (
                  <Crosshair className="w-8 h-8" />
                ) : selectedCrop === 'maize' ? (
                  <span className="text-3xl">🌽</span>
                ) : (
                  <Leaf className="w-8 h-8" />
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Awaiting {selectedCrop === 'yolo' ? 'YOLO Lesion' : selectedCrop === 'maize' ? 'Maize' : 'Tomato'} Foliage Scan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                {selectedCrop === 'yolo'
                  ? 'Capture a plant leaf with camera, upload a photo, or choose any reference benchmark sample to isolate disease lesions, compute severity ratio, and generate visual layers.'
                  : 'Aim phone camera directly at the affected leaf, upload a photo, or choose any dataset sample to trigger real-time AI classification.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
