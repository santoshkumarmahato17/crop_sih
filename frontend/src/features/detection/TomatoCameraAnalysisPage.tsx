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
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  prediction: string;
  predicted_class_raw?: string;
  confidence: number;
  reliable: boolean;
  status: string;
  threshold_used?: number;
  probabilities: {
    Healthy?: number;
    'Leaf Blight'?: number;
    'Leaf Curl'?: number;
    'Septoria Leaf Spot'?: number;
    'Verticillium Wilt'?: number;
    [key: string]: number | undefined;
  };
  explanation?: string;
  disease_details?: DiseaseDetails;
  quality_assessment?: QualityAssessment;
}

const ORDERED_CLASSES = [
  'Healthy',
  'Leaf Blight',
  'Leaf Curl',
  'Septoria Leaf Spot',
  'Verticillium Wilt',
];

export const TomatoCameraAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Inference state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setCameraError('Unable to access phone camera. You can also upload a photo below.');
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
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
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

  // Submit to ML Inference API
  const analyzeImageBlob = async (blob: Blob) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', blob, 'tomato_leaf.jpg');

    // Try standalone ML API (port 8001 or standard /api/predict)
    const endpoints = [
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
      } catch (e) {
        // Try next endpoint
      }
    }

    if (!success) {
      setErrorMsg(
        'Could not connect to Tomato Leaf ML Inference server. Ensure the ML service is running on port 8001 or backend on port 8000.'
      );
    }

    setIsAnalyzing(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setResult(null);
    setErrorMsg(null);
    startCamera();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8">
      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Navigation */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-emerald-400">
              <Leaf className="w-6 h-6 text-emerald-500" />
              Tomato Leaf Analysis
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              High-accuracy AI mobile diagnostic system for 5 foliar diseases
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-3.5 h-3.5" /> MobileNetV3 AI
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Camera Viewfinder / Preview */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Leaf"
                className="w-full h-full object-cover"
              />
            ) : cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Camera className="w-16 h-16 mb-3 text-slate-600 animate-pulse" />
                <p className="text-sm font-medium">{cameraError || 'Initializing Camera...'}</p>
                <button
                  onClick={() => startCamera()}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-4 h-4" /> Retry Camera
                </button>
              </div>
            )}

            {/* Viewfinder Target Framing Reticle */}
            {!capturedImage && cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-3/4 border-2 border-dashed border-emerald-400/60 rounded-2xl relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Align leaf inside frame
                  </span>
                </div>
              </div>
            )}

            {/* Camera switch button */}
            {!capturedImage && cameraActive && (
              <button
                onClick={toggleCameraFacing}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition border border-white/10"
                title="Flip Camera"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            {/* Analyzing Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-emerald-400">
                <RefreshCw className="w-10 h-10 animate-spin mb-3 text-emerald-500" />
                <p className="text-sm font-semibold tracking-wide">Analyzing Foliar Pathology...</p>
                <p className="text-xs text-slate-400 mt-1">Evaluating 5 classes via MobileNetV3</p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-3">
            {!capturedImage ? (
              <>
                <button
                  onClick={capturePhoto}
                  disabled={!cameraActive || isAnalyzing}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition active:scale-[0.98]"
                >
                  <Camera className="w-5 h-5" />
                  Capture Leaf Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition border border-slate-700"
                  title="Upload from gallery"
                >
                  <UploadCloud className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleRetake}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
                Take New Photo / Retake
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Right Column: Diagnostic Results Dashboard */}
        <div className="flex flex-col gap-4">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold">Connection Notice</p>
                <p className="text-xs text-rose-300/80 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}

          {result ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
              {/* Prediction & Confidence Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Prediction
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      result.status === 'High Confidence'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {result.status === 'High Confidence' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    Status: {result.status}
                  </span>
                </div>

                <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {result.prediction}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-slate-400">Confidence Score:</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {result.confidence}%
                  </span>
                </div>
              </div>

              {/* Probabilities Breakdown */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                  Class Probability Breakdown
                </h3>
                <div className="flex flex-col gap-2.5">
                  {ORDERED_CLASSES.map((cls) => {
                    const prob = result.probabilities[cls] ?? 0;
                    const pct = Math.round(prob * 1000) / 10;
                    const isTop = result.prediction === cls;

                    return (
                      <div key={cls} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span
                            className={isTop ? 'text-emerald-400 font-bold' : 'text-slate-300'}
                          >
                            {cls}
                          </span>
                          <span
                            className={isTop ? 'text-emerald-400 font-bold' : 'text-slate-400'}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop ? 'bg-emerald-500' : 'bg-slate-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agronomic Explanation & IPM Advice */}
              {result.explanation && (
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1.5 text-sm">
                    <Info className="w-4 h-4 text-emerald-400" />
                    Agronomic Assessment & Guidance
                  </div>
                  <p>{result.explanation}</p>
                </div>
              )}

              {/* Quality Assessment Alerts */}
              {result.quality_assessment && !result.quality_assessment.is_acceptable && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold">Image Quality Notice: </span>
                    {result.quality_assessment.advisory_notes.join(' ')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[340px]">
              <Leaf className="w-12 h-12 text-slate-700 mb-3" />
              <h2 className="text-base font-semibold text-slate-300 mb-1">
                Ready for Analysis
              </h2>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Aim phone camera squarely at an affected tomato leaf and press "Capture Leaf Photo".
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {ORDERED_CLASSES.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-slate-800/80 text-slate-400 border border-slate-800"
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
