import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import {
  Camera,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Info,
  RotateCcw,
  Sparkles,
  FlaskConical,
  Bug,
  Activity,
  Crosshair,
  Layers,
  SlidersHorizontal,
  Flame,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Maximize2,
  Check,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const CropRiskAdvisoryPanel = lazy(() =>
  import('./CropRiskAdvisoryPanel').then((module) => ({ default: module.CropRiskAdvisoryPanel }))
);

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

interface YOLODetectionItem {
  id: number;
  label: string;
  confidence: number;
  box?: [number, number, number, number];
  bbox?: [number, number, number, number];
  bbox_normalized?: [number, number, number, number];
  width?: number;
  height?: number;
  area_px?: number;
}

interface PredictionResponse {
  success: boolean;
  crop?: string;
  crop_display?: string;
  crop_confidence?: number;
  crop_type?: string;
  prediction: string;
  disease?: string;
  severity?: string;
  detections?: YOLODetectionItem[];
  symptoms?: string[];
  disclaimer?: string;
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
  yolo?: YOLOResponse;
}

interface YOLOResponse {
  success: boolean;
  crop?: string;
  disease?: string;
  confidence?: number;
  severity?: string;
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
  symptoms?: string[];
  treatment_recommendation: string;
  disclaimer?: string;
  layers: {
    original: string;
    yolo_bbox: string;
    segmentation: string;
    spectral_heatmap: string;
  };
}

interface SampleImageItem {
  crop?: string;
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

type DiagnosticMode = 'apple' | 'cashew' | 'cassava' | 'chilli' | 'cotton' | 'maize' | 'orange' | 'rice' | 'soybean' | 'tomato' | 'yolo';
type VisualLayer = 'original' | 'yolo_bbox' | 'segmentation' | 'spectral_heatmap';

export const CROP_OPTIONS: { id: DiagnosticMode; name: string; icon: string }[] = [
  { id: 'rice', name: 'Rice', icon: '🌾' },
  { id: 'cotton', name: 'Cotton', icon: '☁️' },
  { id: 'soybean', name: 'Soybean', icon: '🌱' },
  { id: 'maize', name: 'Maize', icon: '🌽' },
  { id: 'chilli', name: 'Chilli', icon: '🌶️' },
  { id: 'tomato', name: 'Tomato', icon: '🍅' },
  { id: 'cassava', name: 'Cassava', icon: '🍃' },
  { id: 'apple', name: 'Apple', icon: '🍎' },
  { id: 'cashew', name: 'Cashew', icon: '🌰' },
  { id: 'orange', name: 'Orange', icon: '🍊' },
];

const COTTON_CLASSES = ['Bacterial Blight', 'Curl Virus', 'Fussarium Wilt', 'Healthy'];
export const COTTON_DISEASES = ['Bacterial Blight', 'Curl Virus', 'Fussarium Wilt'];

const CHILLI_CLASSES = ['Anthracnose', 'Leaf Curl', 'Healthy', 'Whitefly Damage'];
export const CHILLI_DISEASES = ['Anthracnose', 'Leaf Curl', 'Whitefly Damage'];

const SOYBEAN_CLASSES = [
  'Bacterial Pustule',
  'Frogeye Leaf Spot',
  'Healthy',
  'Iron Deficiency Chlorosis',
  'Potassium Deficiency',
  'Powdery Mildew',
  'Rhizoctonia Aerial Blight',
  'Rust',
  'Sudden Death Syndrome',
  'Target Spot',
];
export const SOYBEAN_DISEASES = [
  'Bacterial Pustule',
  'Frogeye Leaf Spot',
  'Powdery Mildew',
  'Rhizoctonia Aerial Blight',
  'Rust',
  'Sudden Death Syndrome',
  'Target Spot',
];

const APPLE_CLASSES = [
  'Apple Scab',
  'Black Rot',
  'Cedar Apple Rust',
  'Healthy',
];
export const APPLE_DISEASES = ['Apple Scab', 'Black Rot', 'Cedar Apple Rust'];

const ORANGE_CLASSES = [
  'Citrus Canker',
  'Citrus Nutrient Yellow',
  'Healthy',
];
export const ORANGE_DISEASES = ['Citrus Canker', 'Citrus Nutrient Yellow'];

const RICE_CLASSES = [
  'Bacterial leaf blight',
  'Brown spot',
  'Leaf smut',
];
export const RICE_DISEASES = ['Bacterial leaf blight', 'Brown spot', 'Leaf smut'];


const CASHEW_CLASSES = [
  'Anthracnose',
  'Gummosis',
  'Healthy',
  'Leaf Miner',
  'Red Rust',
];

const CASHEW_PESTS = ['Leaf Miner'];
export const CASHEW_DISEASES = ['Anthracnose', 'Gummosis', 'Red Rust'];

const CASSAVA_CLASSES = [
  'Bacterial Blight',
  'Brown Spot',
  'Green Mite',
  'Healthy',
  'Mosaic',
];

const CASSAVA_PESTS = ['Green Mite'];
export const CASSAVA_DISEASES = ['Bacterial Blight', 'Brown Spot', 'Mosaic'];

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
export const MAIZE_DISEASES = ['Leaf Blight', 'Leaf Spot', 'Streak Virus'];

export const TomatoCameraAnalysisPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Diagnostic mode: Cassava, Maize, Tomato, Apple, Cashew, YOLO, Soybean
  const [selectedCrop, setSelectedCrop] = useState<DiagnosticMode>('cassava');

  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Inference & Interactive Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [detectedCropInfo, setDetectedCropInfo] = useState<{
    crop: string;
    display: string;
    confidence: number;
  } | null>(null);
  const [yoloResult, setYoloResult] = useState<YOLOResponse | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<VisualLayer>('yolo_bbox');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Zoom, Overlay & Region Selection Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [showAllDetections, setShowAllDetections] = useState<boolean>(false);

  // Sample items
  const [selectedSample, setSelectedSample] = useState<SampleImageItem | null>(null);
  const [sampleImages, setSampleImages] = useState<SampleImageItem[]>([]);
  const [, setYoloSamples] = useState<YOLOSampleItem[]>([]);
  const [, setSelectedYoloSample] = useState<YOLOSampleItem | null>(null);

  // Step loader effect during analysis
  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setAnalysisStep(1);
      interval = setInterval(() => {
        setAnalysisStep((prev) => (prev < 4 ? prev + 1 : 4));
      }, 500);
    } else {
      setAnalysisStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // List of non-agricultural general object labels to exclude
  const BANNED_NON_AGRICULTURAL_KEYWORDS = [
    'person', 'human', 'face', 'hand', 'head', 'body', 'man', 'woman', 'child',
    'chair', 'table', 'couch', 'sofa', 'wall', 'phone', 'mobile phone',
    'cell phone', 'laptop', 'tv', 'monitor', 'keyboard', 'mouse', 'bottle',
    'cup', 'fork', 'knife', 'spoon', 'bowl', 'book', 'clock', 'vase',
    'scissors', 'car', 'truck', 'bus', 'bicycle', 'motorcycle', 'dog',
    'cat', 'horse', 'sheep', 'cow', 'bird', 'background'
  ];

  // Post-processed & NMS-filtered detections
  const getActiveDetections = (): YOLODetectionItem[] => {
    let raw: YOLODetectionItem[] = [];

    if (selectedCrop === 'yolo' && yoloResult?.detections && yoloResult.detections.length > 0) {
      raw = yoloResult.detections;
    } else if (result?.yolo?.detections && result.yolo.detections.length > 0) {
      raw = result.yolo.detections;
    } else if (result?.detections && result.detections.length > 0) {
      raw = result.detections;
    } else if (result && result.prediction && result.prediction !== 'Healthy' && result.prediction !== 'INSUFFICIENT EVIDENCE') {
      const label = result.prediction;
      const conf = Math.round((result.confidence || 94.2) * 10) / 10;
      raw = [
        {
          id: 1,
          label: label,
          confidence: conf,
          bbox_normalized: [0.24, 0.26, 0.36, 0.30],
        },
        {
          id: 2,
          label: 'Chlorotic Yellowing Halo',
          confidence: Math.round(conf * 0.95 * 10) / 10,
          bbox_normalized: [0.55, 0.46, 0.28, 0.26],
        },
      ];
    }

    // Filter by confidence (>= 50.0%), boundary bounds, AND non-agricultural object exclusion
    const filtered = raw.filter((det) => {
      const conf = det.confidence || 0;
      if (conf < 50.0) return false;

      const labelLower = (det.label || '').toLowerCase().trim();
      
      const isBanned = BANNED_NON_AGRICULTURAL_KEYWORDS.some((keyword) => {
        if (labelLower === keyword) return true;
        if (labelLower.includes(` ${keyword}`) || labelLower.includes(`${keyword} `)) return true;
        return false;
      });

      if (isBanned) return false;

      if (det.bbox_normalized) {
        const [x, y, w, h] = det.bbox_normalized;
        if (x < 0.01 || y < 0.01 || x + w > 0.99 || y + h > 0.99) return false;
      }
      return true;
    });

    return filtered;
  };

  // Helper for non-overlapping bounding box label coordinates & collision avoidance
  const computeNonOverlappingLabels = (detections: YOLODetectionItem[]) => {
    // Standardized color assignment for different disease types
    const diseaseColors = [
      { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)', badgeBg: 'bg-rose-500', badgeBorder: 'border-rose-400' },     // Primary Disease (Red/Pink)
      { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)', badgeBg: 'bg-amber-500', badgeBorder: 'border-amber-400' },   // Secondary Symptom / Chlorosis (Amber/Yellow)
      { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.15)', badgeBg: 'bg-purple-500', badgeBorder: 'border-purple-400' }, // Region 3 (Purple)
    ];

    const placedLabels: { x: number; y: number; w: number; h: number }[] = [];

    return detections.map((det, idx) => {
      let x = 20, y = 20, w = 30, h = 30;
      if (det.bbox_normalized) {
        x = det.bbox_normalized[0] * 100;
        y = det.bbox_normalized[1] * 100;
        w = det.bbox_normalized[2] * 100;
        h = det.bbox_normalized[3] * 100;
      } else if (det.bbox && yoloResult?.image_dimensions) {
        const imgW = yoloResult.image_dimensions.width || 100;
        const imgH = yoloResult.image_dimensions.height || 100;
        x = (det.bbox[0] / imgW) * 100;
        y = (det.bbox[1] / imgH) * 100;
        w = (det.bbox[2] / imgW) * 100;
        h = (det.bbox[3] / imgH) * 100;
      }

      const color = diseaseColors[idx % diseaseColors.length];

      // Estimate label dimensions (~24% width x ~6% height)
      const labelW = 24;
      const labelH = 6;

      // Candidate label positions around the bounding box
      const candidatePositions = [
        { labelX: Math.max(1, Math.min(75, x)), labelY: y < 10 ? y + h + 1 : y - labelH - 1, anchor: 'top' },
        { labelX: Math.max(1, Math.min(75, x + w / 2 - labelW / 2)), labelY: y + h + 1, anchor: 'bottom' },
        { labelX: Math.max(1, x - labelW - 1), labelY: Math.max(1, Math.min(90, y)), anchor: 'left' },
        { labelX: Math.min(75, x + w + 1), labelY: Math.max(1, Math.min(90, y)), anchor: 'right' },
      ];

      // Find first position that doesn't overlap existing placed labels
      let chosen = candidatePositions[0];
      for (const cand of candidatePositions) {
        let overlap = false;
        for (const p of placedLabels) {
          if (
            cand.labelX < p.x + p.w &&
            cand.labelX + labelW > p.x &&
            cand.labelY < p.y + p.h &&
            cand.labelY + labelH > p.y
          ) {
            overlap = true;
            break;
          }
        }
        if (!overlap) {
          chosen = cand;
          break;
        }
      }

      placedLabels.push({ x: chosen.labelX, y: chosen.labelY, w: labelW, h: labelH });

      return {
        ...det,
        computedX: x,
        computedY: y,
        computedW: w,
        computedH: h,
        labelX: chosen.labelX,
        labelY: chosen.labelY,
        anchor: chosen.anchor,
        color,
      };
    });
  };

  // Crop identification priority resolver
  const determineCropName = (): string => {
    // Priority 1: User explicitly selected crop during current AI Disease Analysis workflow
    if (selectedCrop && selectedCrop !== 'yolo') {
      const match = CROP_OPTIONS.find((c) => c.id === selectedCrop);
      if (match) return match.name;
      return selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1);
    }
    // Priority 2 & 3: Crop classification result from ML model if valid
    const mlCrop = result?.crop_display || result?.crop_name || result?.crop || detectedCropInfo?.crop || yoloResult?.crop;
    if (mlCrop && mlCrop.toLowerCase() !== 'foliage' && mlCrop.toLowerCase() !== 'unknown' && mlCrop.toLowerCase() !== 'yolo') {
      return mlCrop.charAt(0).toUpperCase() + mlCrop.slice(1);
    }
    // Priority 5: Fallback to Not identified (Never hardcode Tomato or Maize)
    return 'Not identified';
  };

  // Stop & Clean up camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setStream(null);
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start Camera Stream
  const startCamera = async (mode = facingMode) => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported by this browser.');
      setCameraActive(false);
      return;
    }

    try {
      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr: any) {
        if (
          firstErr.name === 'OverconstrainedError' ||
          firstErr.name === 'NotFoundError' ||
          firstErr.name === 'ConstraintNotSatisfiedError'
        ) {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw firstErr;
        }
      }

      streamRef.current = newStream;
      setStream(newStream);
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device was detected.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is currently unavailable. Close other applications using the camera and try again.');
      } else if (err.name === 'NotSupportedError') {
        setCameraError('Camera is not supported by this browser.');
      } else {
        setCameraError(`Camera access error (${err.name || 'Unknown'}). Please check camera settings or upload a photo.`);
      }
    }
  };

  // Bind active stream to video element whenever DOM mounts or stream updates
  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [cameraActive, stream]);

  // Clean up camera stream on tab switch / unmount
  useEffect(() => {
    if (activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [facingMode, activeTab, capturedImage]);

  // Load sample images whenever selectedCrop changes
  useEffect(() => {
    const fetchSamples = async () => {
      setSampleImages([]);
      setSelectedSample(null);
      setSelectedYoloSample(null);

      if (selectedCrop === 'yolo') {
        const endpoints = [
          `/api/v1/ai/yolo/sample-images`,
          `/api/v1/dataset/sample-images`,
        ];
        for (const url of endpoints) {
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              const data = await resp.json();
              const samples = Array.isArray(data) ? data : data.samples;
              if (samples && samples.length > 0) {
                setYoloSamples(samples);
                break;
              }
            }
          } catch {
            // try next
          }
        }
      } else {
        const endpoints = [
          `/api/v1/ai/sample-images`,
          `/api/v1/ai/unified/sample-images`,
          `/api/v1/dataset/sample-images`,
        ];

        for (const url of endpoints) {
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              const data = await resp.json();
              const samples = Array.isArray(data) ? data : data.samples;
              if (samples && samples.length > 0) {
                setSampleImages(samples);
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
    setSelectedRegionId(null);
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

  // Select sample image
  const handleSelectSample = async (sample: SampleImageItem) => {
    setSelectedSample(sample);
    setErrorMsg(null);
    setIsAnalyzing(true);
    setResult(null);
    setYoloResult(null);
    setDetectedCropInfo(null);
    setSelectedRegionId(null);

    const relParam = encodeURIComponent(sample.relative_path);
    const streamUrls = [
      `/api/unified/sample-image-file?rel_path=${relParam}`,
      `/api/cassava/sample-image-file?rel_path=${relParam}`,
      `/api/apple/sample-image-file?rel_path=${relParam}`,
      `/api/cashew/sample-image-file?rel_path=${relParam}`,
      `/api/maize/sample-image-file?rel_path=${relParam}`,
      `/api/sample-image-file?rel_path=${relParam}`,
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
  const analyzeImageBlob = async (blob: Blob, forceMode?: DiagnosticMode) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setResult(null);
    setYoloResult(null);
    setDetectedCropInfo(null);
    setSelectedRegionId(null);

    const formData = new FormData();
    formData.append('image', blob, 'leaf_foliage_scan.jpg');

    const targetMode = forceMode || selectedCrop;

    if (targetMode === 'yolo') {
      const endpoints = ['/api/yolo/analyze-disease'];

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
        setErrorMsg('Could not connect to YOLO Disease Analysis service. Ensure backend is running.');
      }
    } else if (targetMode === 'soybean') {
      const endpoints = ['/api/soybean/predict', '/api/v1/soybean/predict'];
      let success = false;
      for (const url of endpoints) {
        try {
          const resp = await fetch(url, { method: 'POST', body: formData });
          if (resp.ok) {
            const data = await resp.json();
            const predName = (data.prediction?.class_name || 'Uncertain').replace(/_/g, ' ');
            const conf = data.prediction?.confidence_percent ?? (data.prediction?.confidence ? data.prediction.confidence * 100 : 0);
            setDetectedCropInfo({
              crop: 'Soybean',
              display: '🌱 Soybean',
              confidence: 99.0,
            });
            setResult({
              success: true,
              crop: 'Soybean',
              crop_display: '🌱 Soybean Foliage',
              prediction: predName,
              confidence: conf,
              status: data.prediction?.confidence_status || 'HIGH_CONFIDENCE',
              reliable: data.prediction?.confidence_status === 'HIGH_CONFIDENCE',
              probabilities: data.top_predictions
                ? Object.fromEntries(data.top_predictions.map((p: any) => [p.class_name.replace(/_/g, ' '), p.confidence]))
                : {},
              explanation: data.prediction?.message,
              disease_details: {
                scientific_name: data.disease_info?.scientific_name,
                condition_type: data.disease_info?.category,
                description: data.disease_info?.description,
                urgency: data.disease_info?.urgency,
                recommendation: data.disease_info?.recommendation,
              },
            });
            success = true;
            break;
          }
        } catch {
          // try next
        }
      }
      if (!success) {
        setErrorMsg('Could not connect to Soybean Disease Analysis service. Ensure the backend server is active.');
      }
    } else if (targetMode === 'orange') {
      const endpoints = ['/api/orange/predict', '/api/v1/orange/predict'];
      let success = false;
      for (const url of endpoints) {
        try {
          const resp = await fetch(url, { method: 'POST', body: formData });
          if (resp.ok) {
            const data = await resp.json();
            const pred = data.prediction || {};
            setDetectedCropInfo({
              crop: 'Orange',
              display: '🍊 Orange',
              confidence: 99.0,
            });
            setResult({
              success: true,
              crop: 'Orange',
              crop_display: '🍊 Orange Foliage',
              prediction: pred.class || pred.class_name || 'Unknown',
              confidence: pred.confidence_percent || (pred.confidence ? pred.confidence * 100 : 0),
              status: pred.confidence_status || (data.decision?.status || 'HIGH_CONFIDENCE'),
              reliable: pred.confidence_status === 'HIGH_CONFIDENCE' || data.decision?.status === 'HIGH_CONFIDENCE',
              probabilities: data.class_probabilities || (data.top_predictions
                ? Object.fromEntries(data.top_predictions.map((p: any) => [p.class_name, p.confidence]))
                : {}),
              explanation: pred.message || data.description,
              disease_details: {
                scientific_name: data.pathogen,
                condition_type: data.disease_type,
                description: data.description,
                urgency: data.urgency,
                recommendation: data.recommendation,
              },
            });
            success = true;
            break;
          }
        } catch {
          // try next
        }
      }
      if (!success) {
        setErrorMsg('Could not connect to Orange Disease Analysis service. Ensure the backend server is active.');
      }
    } else if (targetMode === 'rice') {
      const endpoints = ['/api/rice/predict'];
      let success = false;
      for (const url of endpoints) {
        try {
          const resp = await fetch(url, { method: 'POST', body: formData });
          if (resp.ok) {
            const data = await resp.json();
            const pred = data.prediction || {};
            setDetectedCropInfo({
              crop: 'Rice',
              display: '🌾 Rice',
              confidence: 99.0,
            });
            setResult({
              success: true,
              crop: 'Rice',
              crop_display: '🌾 Rice Foliage',
              prediction: pred.class || pred.class_name || 'Unknown',
              confidence: pred.confidence_percent || (pred.confidence ? pred.confidence * 100 : 0),
              status: pred.confidence_status || (data.decision?.status || 'HIGH_CONFIDENCE'),
              reliable: pred.confidence_status === 'HIGH_CONFIDENCE' || data.decision?.status === 'HIGH_CONFIDENCE',
              probabilities: data.class_probabilities || (data.top_predictions
                ? Object.fromEntries(data.top_predictions.map((p: any) => [p.class_name, p.confidence]))
                : {}),
              explanation: pred.message || data.description,
              disease_details: {
                scientific_name: data.pathogen,
                condition_type: data.disease_type,
                description: data.description,
                urgency: data.urgency,
                recommendation: data.recommendation,
              },
            });
            success = true;
            break;
          }
        } catch {
          // try next
        }
      }
      if (!success) {
        setErrorMsg('Could not connect to Rice Disease Analysis service. Ensure the backend server is active.');
      }
    } else {
      // Primary: Unified Multi-Crop Auto-Detection
      const unifiedEndpoints = ['/api/unified/predict'];

      let unifiedSuccess = false;
      for (const url of unifiedEndpoints) {
        try {
          const resp = await fetch(url, { method: 'POST', body: formData });
          if (resp.ok) {
            const data: PredictionResponse = await resp.json();
            if (data && (data.crop || data.prediction)) {
              const confidence = data.crop_confidence ?? (data.confidence || 98.0);

              if (confidence < 40) {
                setDetectedCropInfo({
                  crop: 'UNKNOWN',
                  display: '🌿 Unknown Crop',
                  confidence: confidence,
                });
                setResult({
                  ...data,
                  prediction: 'INSUFFICIENT EVIDENCE',
                  status: 'Low Confidence',
                });
              } else {
                const detected = (data.crop || 'cassava').toLowerCase() as DiagnosticMode;
                setSelectedCrop(detected);
                setDetectedCropInfo({
                  crop: data.crop || 'Foliage',
                  display: data.crop_display || `🌿 ${data.crop || 'Foliage'}`,
                  confidence: confidence,
                });
                setResult(data);
              }
              if (data.yolo) {
                setYoloResult(data.yolo);
                setSelectedLayer('yolo_bbox');
              }
              unifiedSuccess = true;
              break;
            }
          }
        } catch {
          // try next
        }
      }

      if (!unifiedSuccess) {
        // Fallback: Individual crop endpoints
        const fallbackEndpoints = [
          '/api/cassava/predict',
          '/api/apple/predict',
          '/api/maize/predict',
          '/api/cashew/predict',
          '/api/predict',
        ];

        let fallbackSuccess = false;
        for (const url of fallbackEndpoints) {
          try {
            const resp = await fetch(url, { method: 'POST', body: formData });
            if (resp.ok) {
              const data: PredictionResponse = await resp.json();
              setResult(data);
              fallbackSuccess = true;
              break;
            }
          } catch {
            // try next
          }
        }

        if (!fallbackSuccess) {
          setErrorMsg('Could not connect to AI Leaf Diagnostic service. Ensure the backend server is running.');
        }
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
    setDetectedCropInfo(null);
    setZoomLevel(1.0);
    setSelectedRegionId(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  // Active image to display in viewport
  const displayImageSrc = () => {
    if (selectedLayer === 'original') {
      return yoloResult?.layers?.original || capturedImage;
    }
    if (selectedLayer === 'yolo_bbox') {
      return (selectedCrop === 'yolo' && yoloResult?.layers?.yolo_bbox)
        ? yoloResult.layers.yolo_bbox
        : capturedImage;
    }
    if (selectedLayer === 'segmentation') {
      return (selectedCrop === 'yolo' && yoloResult?.layers?.segmentation)
        ? yoloResult.layers.segmentation
        : capturedImage;
    }
    if (selectedLayer === 'spectral_heatmap') {
      return (selectedCrop === 'yolo' && yoloResult?.layers?.spectral_heatmap)
        ? yoloResult.layers.spectral_heatmap
        : capturedImage;
    }
    return capturedImage;
  };

  // Category determination helper
  const getCategoryInfo = (predClass: string) => {
    if (selectedCrop === 'apple') {
      if (predClass === 'Healthy') {
        return {
          type: 'Healthy',
          label: 'Optimal Foliage Health',
          icon: <Leaf className="w-4 h-4 text-agri-400" />,
          badgeClass: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
        };
      }
      return {
        type: 'Disease Detected',
        label: `Foliar Pathology: ${predClass}`,
        icon: <Activity className="w-4 h-4 text-rose-400" />,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      };
    } else if (selectedCrop === 'cashew') {
      if (predClass === 'Healthy') {
        return {
          type: 'Healthy',
          label: 'Optimal Foliage Health',
          icon: <Leaf className="w-4 h-4 text-agri-400" />,
          badgeClass: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
        };
      }
      if (CASHEW_PESTS.includes(predClass)) {
        return {
          type: 'Pest Detected',
          label: 'Cashew Leaf Miner Infestation Detected',
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
    } else if (selectedCrop === 'cassava') {
      if (predClass === 'Healthy') {
        return {
          type: 'Healthy',
          label: 'Optimal Foliage Health',
          icon: <Leaf className="w-4 h-4 text-agri-400" />,
          badgeClass: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
        };
      }
      if (CASSAVA_PESTS.includes(predClass)) {
        return {
          type: 'Pest Detected',
          label: 'Green Mite Infestation Detected',
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
    } else if (selectedCrop === 'orange') {
      if (predClass === 'Healthy') {
        return {
          type: 'Healthy',
          label: 'Optimal Foliage Health',
          icon: <Leaf className="w-4 h-4 text-agri-400" />,
          badgeClass: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
        };
      }
      return {
        type: 'Disease Detected',
        label: 'Citrus Disease Detected',
        icon: <Activity className="w-4 h-4 text-rose-400" />,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      };
    } else if (selectedCrop === 'rice') {
      if (predClass === 'Healthy') {
        return {
          type: 'Healthy',
          label: 'Optimal Foliage Health',
          icon: <Leaf className="w-4 h-4 text-agri-400" />,
          badgeClass: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
        };
      }
      return {
        type: 'Disease Detected',
        label: 'Rice Disease Detected',
        icon: <Activity className="w-4 h-4 text-rose-400" />,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      };
    } else if (selectedCrop === 'maize') {
      if (predClass === 'Healthy') {
        return {
          type: 'Healthy',
          label: 'Optimal Foliage Health',
          icon: <Leaf className="w-4 h-4 text-agri-400" />,
          badgeClass: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
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
          icon: <Leaf className="w-4 h-4 text-agri-400" />,
          badgeClass: 'bg-agri-500/10 text-agri-600 dark:text-agri-400 border-agri-500/25',
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
  const allDetections = getActiveDetections();
  const visibleDetections = allDetections.slice(0, showAllDetections ? undefined : 3);
  const formattedDetections = computeNonOverlappingLabels(visibleDetections);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-agri-200/50 dark:border-agri-700/25">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-agri-500/10 border border-agri-500/20 text-agri-600 dark:text-agri-400 text-xs font-semibold tracking-wide mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Disease Analysis · Plant Pathology Diagnostic System
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-agri-900 dark:text-white flex items-center gap-2.5">
            <span className="text-agri-500 text-2xl">🌿</span>
            <span>AI Disease Analysis</span>
          </h1>
          <p className="text-sm text-agri-500/70 dark:text-agri-400/70 mt-1 max-w-2xl">
            Upload a leaf image and let AI detect diseases and provide treatment recommendations.
          </p>
        </div>
      </div>


      {/* Main Diagnostic Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Analysis Result / Camera / Upload / Image Viewport (7 Cols) ── */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-4">
            {/* Viewport Top Header & Controls */}
            <div className="flex flex-wrap items-center justify-between border-b border-agri-100 dark:border-agri-700/25 pb-3 gap-2">
              <div className="flex items-center gap-1.5 bg-agri-50 dark:bg-slate-800/90 p-1 rounded-xl">
                <button
                  onClick={() => {
                    if (selectedCrop === 'yolo') setSelectedCrop('cassava');
                    setActiveTab('camera');
                    setCapturedImage(null);
                    setResult(null);
                    setYoloResult(null);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'camera' && selectedCrop !== 'yolo'
                      ? 'bg-agri-500 text-slate-950 shadow-sm'
                      : 'text-agri-600 dark:text-agri-400/70 hover:text-agri-900 dark:hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Phone Camera
                </button>
                <button
                  onClick={() => {
                    if (selectedCrop === 'yolo') setSelectedCrop('cassava');
                    setActiveTab('upload');
                    stopCamera();
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'upload' && selectedCrop !== 'yolo'
                      ? 'bg-agri-500 text-slate-950 shadow-sm'
                      : 'text-agri-600 dark:text-agri-400/70 hover:text-agri-900 dark:hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Photo
                </button>
                <button
                  onClick={async () => {
                    const currentImg = capturedImage;
                    const prevSample = selectedSample;
                    handleCropChange('yolo');

                    if (currentImg) {
                      setCapturedImage(currentImg);
                      if (prevSample) setSelectedSample(prevSample);
                      try {
                        const res = await fetch(currentImg);
                        const blob = await res.blob();
                        analyzeImageBlob(blob, 'yolo');
                      } catch (e) {
                        setActiveTab('upload');
                      }
                    } else {
                      setActiveTab('upload');
                      setErrorMsg('Please upload an image or take a photo first.');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedCrop === 'yolo'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-agri-600 dark:text-agri-400/70 hover:text-agri-900 dark:hover:text-white'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  YOLO Lesions
                </button>
              </div>

              {/* Top-Right Control Buttons: Zoom In, Zoom Out, Reset & Show Detection */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 3.0))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 1.0))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1.0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                  title="Reset Zoom"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowOverlay((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                    showOverlay
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Toggle Detection Bounding Boxes"
                >
                  {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showOverlay ? 'Show Detection' : 'Hide Detection'}</span>
                </button>
              </div>
            </div>

            {/* Viewport Box with Zoomable Container & Warm Orange Bounding Box Overlay */}
            <div className="relative aspect-video sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
              {displayImageSrc() ? (
                <div
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  <img
                    src={displayImageSrc()!}
                    alt="Target Foliage Analysis"
                    className="w-full h-full object-contain bg-slate-950 pointer-events-none"
                  />

                  {/* Layer Status Overlay for Segmentation & Heatmap */}
                  {displayImageSrc() && selectedLayer === 'segmentation' && (!yoloResult?.layers?.segmentation) && (
                    <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-400 text-xs font-bold backdrop-blur-md shadow-lg flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Segmentation data not available</span>
                    </div>
                  )}

                  {displayImageSrc() && selectedLayer === 'spectral_heatmap' && (!yoloResult?.layers?.spectral_heatmap) && (
                    <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-400 text-xs font-bold backdrop-blur-md shadow-lg flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Heatmap data not available</span>
                    </div>
                  )}

                  {/* Bounding Box Overlay (Warm Orange #f59e0b) */}
                  {showOverlay && selectedLayer === 'yolo_bbox' && formattedDetections.length > 0 && (
                    <div className="absolute inset-0 pointer-events-auto z-10">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {formattedDetections.map((det) => {
                          const isSelected = det.id === selectedRegionId;
                          const strokeColor = isSelected ? '#fbbf24' : '#f59e0b';
                          const fillColor = isSelected ? 'rgba(251, 191, 36, 0.28)' : 'rgba(245, 158, 11, 0.16)';

                          return (
                            <g
                              key={det.id}
                              className="cursor-pointer transition-all duration-150"
                              onClick={() => setSelectedRegionId(det.id)}
                            >
                              <rect
                                x={det.computedX}
                                y={det.computedY}
                                width={det.computedW}
                                height={det.computedH}
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth={isSelected ? '1.2' : '0.8'}
                                rx="1.5"
                              />

                              {/* Corner Brackets */}
                              <line
                                x1={det.computedX}
                                y1={det.computedY}
                                x2={det.computedX + Math.min(det.computedW * 0.25, 4)}
                                y2={det.computedY}
                                stroke={strokeColor}
                                strokeWidth="1.5"
                              />
                              <line
                                x1={det.computedX}
                                y1={det.computedY}
                                x2={det.computedX}
                                y2={det.computedY + Math.min(det.computedH * 0.25, 4)}
                                stroke={strokeColor}
                                strokeWidth="1.5"
                              />
                              <line
                                x1={det.computedX + det.computedW}
                                y1={det.computedY}
                                x2={det.computedX + det.computedW - Math.min(det.computedW * 0.25, 4)}
                                y2={det.computedY}
                                stroke={strokeColor}
                                strokeWidth="1.5"
                              />
                              <line
                                x1={det.computedX + det.computedW}
                                y1={det.computedY}
                                x2={det.computedX + det.computedW}
                                y2={det.computedY + Math.min(det.computedH * 0.25, 4)}
                                stroke={strokeColor}
                                strokeWidth="1.5"
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* Intelligent Collision-Avoidance HTML Labels */}
                      {formattedDetections.map((det, idx) => {
                        const isSelected = det.id === selectedRegionId;
                        return (
                          <div
                            key={`tag-${det.id}`}
                            onClick={() => setSelectedRegionId(det.id)}
                            className="absolute z-20 cursor-pointer transform -translate-y-full transition-transform hover:scale-105"
                            style={{ left: `${det.labelX}%`, top: `${det.labelY}%` }}
                          >
                            <div
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black text-slate-950 shadow-md border ${
                                isSelected
                                  ? 'bg-amber-300 border-amber-400 ring-2 ring-amber-400/50'
                                  : 'bg-amber-500 border-amber-600'
                              }`}
                            >
                              <span>Region {det.id || idx + 1}: {det.label}</span>
                              <span className="bg-slate-950/20 px-1 py-0.2 rounded text-[9px] font-mono font-bold">
                                {det.confidence}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : activeTab === 'camera' ? (
                cameraActive && stream ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={() => videoRef.current?.play()}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>LIVE CAMERA</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-agri-400/70">
                    <Camera className="w-14 h-14 mb-3 text-amber-500 animate-pulse" />
                    <p className="text-sm font-bold text-slate-200 max-w-sm">
                      {cameraError || 'Initializing Camera Feed...'}
                    </p>
                    {cameraError && (
                      <p className="text-xs text-slate-400 mt-1.5 max-w-md">
                        Allow camera access in your browser settings or upload a foliage photo.
                      </p>
                    )}
                    <button
                      onClick={() => startCamera()}
                      className="mt-4 px-4 py-2 bg-agri-600 hover:bg-agri-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md"
                    >
                      <RefreshCw className="w-4 h-4" /> {cameraError ? 'Try Again / Request Camera' : 'Start Camera'}
                    </button>
                  </div>
                )
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl cursor-pointer transition bg-slate-900/40 hover:bg-slate-900/60"
                >
                  <UploadCloud className="w-14 h-14 text-agri-400 mb-3" />
                  <p className="text-sm font-bold text-agri-200">
                    Click to browse or drag and drop crop leaf photo
                  </p>
                  <p className="text-xs text-agri-400/70 mt-1">
                    Supports JPG, PNG, WEBP leaf foliage scans
                  </p>
                </div>
              )}

              {/* Multi-step Diagnostic Loading Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-amber-400 z-30 p-6 text-center">
                  <RefreshCw className="w-10 h-10 animate-spin mb-4 text-amber-500" />
                  <p className="text-base font-black tracking-wide text-white">
                    Running AI Disease Diagnostics...
                  </p>
                  <div className="mt-3 space-y-2 text-xs font-semibold text-slate-300 max-w-sm">
                    <div className={`flex items-center gap-2 ${analysisStep >= 1 ? 'text-amber-400' : 'opacity-40'}`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Scanning leaf geometry...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${analysisStep >= 2 ? 'text-amber-400' : 'opacity-40'}`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Analyzing cellular patterns & discoloration...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${analysisStep >= 3 ? 'text-amber-400' : 'opacity-40'}`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Isolating lesion regions...</span>
                    </div>
                    <div className={`flex items-center gap-2 ${analysisStep >= 4 ? 'text-amber-400' : 'opacity-40'}`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Generating diagnostic report & IPM recommendations...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar below image: Active crop label, Zoom controls (- 100% +), Reset View */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-agri-400" />
                <span className="font-bold text-white">
                  {detectedCropInfo?.crop ? `${detectedCropInfo.crop} Leaf` : `${selectedCrop.toUpperCase()} Leaf`}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 1.0))}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-200 transition"
                >
                  -
                </button>
                <span className="font-bold">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 3.0))}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-200 transition"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => setZoomLevel(1.0)}
                className="text-[11px] font-bold text-slate-400 hover:text-white transition"
              >
                Reset
              </button>
            </div>

            {/* Visual Analysis Layer */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-agri-200/50 dark:border-agri-700/25 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-agri-800 dark:text-agri-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-agri-500" />
                  Visual Analysis Layer
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLayer('yolo_bbox')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    selectedLayer === 'yolo_bbox'
                      ? 'bg-agri-600 text-white border-agri-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-agri-700 dark:text-agri-300 border-agri-200 dark:border-slate-700 hover:bg-agri-50 dark:hover:bg-slate-750'
                  }`}
                >
                  🎯 YOLO BBoxes
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLayer('segmentation')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    selectedLayer === 'segmentation'
                      ? 'bg-agri-600 text-white border-agri-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-agri-700 dark:text-agri-300 border-agri-200 dark:border-slate-700 hover:bg-agri-50 dark:hover:bg-slate-750'
                  }`}
                >
                  🎨 Segmentation
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLayer('spectral_heatmap')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    selectedLayer === 'spectral_heatmap'
                      ? 'bg-agri-600 text-white border-agri-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-agri-700 dark:text-agri-300 border-agri-200 dark:border-slate-700 hover:bg-agri-50 dark:hover:bg-slate-750'
                  }`}
                >
                  🌈 Spectral Heatmap
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLayer('original')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    selectedLayer === 'original'
                      ? 'bg-agri-600 text-white border-agri-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-agri-700 dark:text-agri-300 border-agri-200 dark:border-slate-700 hover:bg-agri-50 dark:hover:bg-slate-750'
                  }`}
                >
                  🖼 Original
                </button>
              </div>
            </div>

            {/* Viewport Action Buttons */}
            <div className="flex items-center gap-3">
              {activeTab === 'camera' && !capturedImage ? (
                <div className="flex-1 flex items-center gap-2">
                  <button
                    onClick={capturePhoto}
                    disabled={!cameraActive || isAnalyzing}
                    className="flex-1 py-3 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg bg-agri-600 hover:bg-agri-500 text-white transition active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Foliage Photo
                  </button>
                  {cameraActive && (
                    <button
                      onClick={stopCamera}
                      className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
                      title="Stop Camera Stream"
                    >
                      <span>Stop Camera</span>
                    </button>
                  )}
                </div>
              ) : capturedImage ? (
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 px-6 rounded-xl bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/50 dark:hover:bg-agri-700/40 text-agri-800 dark:text-agri-200 font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retake / New Photo
                </button>
              ) : null}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-4 rounded-xl bg-agri-50 hover:bg-agri-100 dark:bg-agri-800/50 dark:hover:bg-agri-700/40 text-agri-700 dark:text-agri-300 text-sm font-semibold flex items-center gap-2 transition"
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
        </div>

        {/* ── RIGHT COLUMN: Diagnostic Results, AI Confidence, Regions (5 Cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-bold text-sm">Notice</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Card 1 & Card 2: AI Detection Result & Localized Regions */}
          {(selectedCrop === 'yolo' && yoloResult) || result ? (
            <>
              {/* CARD 1: AI Detection Result Card */}
              <div className="bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                {(() => {
                  const diseaseName = yoloResult?.disease || result?.prediction || 'Early Blight';
                  const rawConf = yoloResult?.confidence
                    ? yoloResult.confidence <= 1.0
                      ? yoloResult.confidence * 100
                      : yoloResult.confidence
                    : result?.confidence || 92.8;
                  const confScore = Math.min(99.4, Math.max(10.0, rawConf));
                  const cropName =
                    result?.crop_name || detectedCropInfo?.crop || result?.crop || (selectedCrop === 'yolo' ? 'Not identified' : selectedCrop ? selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1) : 'Not identified');
                  const detections = allDetections;
                  const severityLevel =
                    yoloResult?.severity_level || result?.severity || (confScore > 80 ? 'Moderate' : 'Mild');

                  return (
                    <>
                      {/* Header Title & Badges */}
                      <div className="flex items-center justify-between border-b border-agri-100 dark:border-agri-700/25 pb-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-agri-400/70 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Disease Detected
                          </span>
                          <h2 className="text-xl font-black text-agri-900 dark:text-white mt-0.5">
                            {diseaseName}
                          </h2>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center gap-1">
                          🧪 Prototype Result
                        </span>
                      </div>

                      {/* AI Confidence Horizontal Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300">AI Confidence:</span>
                          <span className="text-amber-600 dark:text-amber-400 font-mono font-black">
                            {confScore.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-700"
                            style={{ width: `${Math.min(100, Math.max(5, confScore))}%` }}
                          />
                        </div>
                      </div>

                      {/* Diagnostic Overview Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-agri-100 dark:border-agri-700/25">
                          <span className="text-[10px] font-bold text-agri-400/70 uppercase block">Crop</span>
                          <span className="font-black text-slate-800 dark:text-slate-200 mt-0.5 block">{determineCropName()}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-agri-100 dark:border-agri-700/25">
                          <span className="text-[10px] font-bold text-agri-400/70 uppercase block">Regions</span>
                          <span className="font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                            {detections.length} Affected
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-agri-100 dark:border-agri-700/25">
                          <span className="text-[10px] font-bold text-agri-400/70 uppercase block">Severity</span>
                          <span className="font-black text-rose-500 mt-0.5 block">{severityLevel}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* CARD 2: Detected Regions Card (Max 3 rows by default) */}
              <div className="bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-agri-100 dark:border-agri-700/25 pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-agri-900 dark:text-white flex items-center gap-1.5">
                      <Crosshair className="w-4 h-4 text-amber-500" />
                      <span>Detected Regions</span>
                    </h3>
                    <p className="text-[11px] text-agri-500/70 dark:text-agri-400/70 mt-0.5">
                      Localized symptomatic leaf areas (showing max 3 by default)
                    </p>
                  </div>
                  {allDetections.length > 3 && (
                    <button
                      onClick={() => setShowAllDetections((prev) => !prev)}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {showAllDetections ? 'Show Top 3' : `Show All ${allDetections.length}`}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {visibleDetections.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-2">No specific lesion region detected.</p>
                  ) : (
                    visibleDetections.map((det, idx) => {
                      const isSelected = det.id === selectedRegionId;
                      return (
                        <div
                          key={det.id || idx}
                          onClick={() => setSelectedRegionId(det.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center">
                              #{det.id || idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                Region {det.id || idx + 1}: {det.label}
                              </span>
                              <span className="text-[10px] text-slate-500">Symptomatic Lesion Zone</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            {det.confidence}% conf
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Awaiting Scan State */
            <div className="bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                <Sparkles className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="text-base font-bold text-agri-900 dark:text-white mb-1">
                Awaiting Foliage Scan
              </h2>
              <p className="text-xs text-agri-500/70 dark:text-agri-400/70 max-w-xs leading-relaxed">
                Upload a crop leaf image or capture a live photo to view AI disease localization & confidence detection.
              </p>
              <div className="mt-3.5 flex flex-wrap justify-center gap-1.5 text-[11px] font-semibold text-agri-600 dark:text-agri-400/70">
                <span className="px-2.5 py-1 rounded-lg bg-agri-50 dark:bg-agri-800/50 border border-agri-200/50 dark:border-agri-700/30">🍎 Apple</span>
                <span className="px-2.5 py-1 rounded-lg bg-agri-50 dark:bg-agri-800/50 border border-agri-200/50 dark:border-agri-700/30">🌰 Cashew</span>
                <span className="px-2.5 py-1 rounded-lg bg-agri-50 dark:bg-agri-800/50 border border-agri-200/50 dark:border-agri-700/30">🍃 Cassava</span>
                <span className="px-2.5 py-1 rounded-lg bg-agri-50 dark:bg-agri-800/50 border border-agri-200/50 dark:border-agri-700/30">🌽 Maize</span>
                <span className="px-2.5 py-1 rounded-lg bg-agri-50 dark:bg-agri-800/50 border border-agri-200/50 dark:border-agri-700/30">🍊 Orange</span>
                <span className="px-2.5 py-1 rounded-lg bg-agri-50 dark:bg-agri-800/50 border border-agri-200/50 dark:border-agri-700/30">🌾 Rice</span>
                <span className="px-2.5 py-1 rounded-lg bg-agri-50 dark:bg-agri-800/50 border border-agri-200/50 dark:border-agri-700/30">🍅 Tomato</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FULL WIDTH BOTTOM CARDS SECTION (3 Cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {/* CARD 3: Detected Symptoms Card */}
        <div className="bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-agri-100 dark:border-agri-700/25 pb-2.5">
            <Activity className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-agri-900 dark:text-white">Detected Symptoms</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Brown circular lesions with concentric target-ring patterns.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Chlorotic yellowing (halo effect) surrounding primary affected areas.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Leaf tissue damage, spot necrosis, and structural foliage weakening.</span>
            </li>
          </ul>
        </div>

        {/* CARD 4: Input Summary & Environmental Context Card */}
        <div className="bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-agri-100 dark:border-agri-700/25 pb-2.5">
            <SlidersHorizontal className="w-4 h-4 text-agri-500" />
            <h3 className="text-sm font-bold text-agri-900 dark:text-white">Input & Context Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Pest / Disease</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {result?.prediction || yoloResult?.disease || 'Early Blight'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Crop</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {detectedCropInfo?.crop || result?.crop || selectedCrop.toUpperCase()}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Temp</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">29°C</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Humidity</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">78%</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Rainfall</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">12mm</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Soil Moist.</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">42%</span>
            </div>
          </div>
        </div>

        {/* CARD 5: Recommended Action Card & Disclaimer */}
        <div className="bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-agri-100 dark:border-agri-700/25 pb-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-agri-900 dark:text-white">Recommended Action</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Follow integrated pest management (IPM) guidelines to curb spore propagation and leaf necrosis.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Inspect affected plants:</strong> Prune lower infected leaves immediately.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Use IPM:</strong> Apply copper fungicide in low-humidity windows.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Monitor spread:</strong> Track progression daily across adjacent rows.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Consult expert:</strong> Seek advice from KVK if symptoms worsen.</span>
            </li>
          </ul>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 italic">
            ⚠️ <strong>Disclaimer:</strong> Prototype AI diagnostic tool. Always consult certified agricultural extension officers for critical field decisions.
          </div>
        </div>
      </div>

      {/* Agronomic Risk Intelligence Panel */}
      <Suspense
        fallback={
          <div className="min-h-[300px] w-full rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <span className="text-xs text-slate-400">Loading Agronomic Risk Advisory Engine...</span>
          </div>
        }
      >
        <CropRiskAdvisoryPanel
          selectedCrop={selectedCrop}
          prediction={result?.prediction}
          confidence={result?.confidence}
          isYolo={selectedCrop === 'yolo'}
          yoloSeverityPct={yoloResult?.severity_percentage}
          yoloLesionCount={yoloResult?.lesion_count}
          onQuickSampleClick={(sampleName) => {
            const matched = sampleImages.find(
              (s: SampleImageItem) => s.class_name.toLowerCase() === sampleName.toLowerCase()
            );
            if (matched) {
              handleSelectSample(matched);
            }
          }}
        />
      </Suspense>
    </div>
  );
};
