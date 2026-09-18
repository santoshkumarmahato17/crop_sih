import React, { useEffect, useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Camera,
  Sparkles,
} from 'lucide-react';
import { imageService } from '@/services/imageService';
import { aiService } from '@/services/aiService';
import { CropHealthAnalysisModal } from './CropHealthAnalysisModal';
import { CropHealthAnalysisResponse, DroneImage, ImageProcessingStatus, Zone } from '@/types';

interface MissionImageryGalleryProps {
  missionId: string;
  zones?: Zone[];
}

export const MissionImageryGallery: React.FC<MissionImageryGalleryProps> = ({
  missionId,
  zones = [],
}) => {
  const [images, setImages] = useState<DroneImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload Form Inputs
  const [sensorType, setSensorType] = useState<string>('RGB');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<DroneImage | null>(null);

  // AI Analysis Modal State
  const [analysisImage, setAnalysisImage] = useState<DroneImage | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CropHealthAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, [missionId]);

  const fetchImages = async () => {
    try {
      setIsLoading(true);
      const data = await imageService.listMissionImages(missionId);
      setImages(data.images);
    } catch (err: any) {
      // Demo fallback imagery
      setImages([
        {
          id: 'img-demo-1',
          mission_id: missionId,
          zone_id: zones[0]?.id || 'zone-1',
          filename: 'DJI_20260831_110245_RGB.jpg',
          file_type: 'image/jpeg',
          file_size_bytes: 4210500,
          sensor_type: 'RGB',
          image_type: 'RGB',
          processing_status: 'COMPLETED',
          capture_time: new Date().toISOString(),
          altitude_agl_meters: 50.0,
          location: { type: 'Point', coordinates: [73.8525, 18.5235] },
          created_at: new Date().toISOString(),
        },
        {
          id: 'img-demo-2',
          mission_id: missionId,
          zone_id: zones[1]?.id || 'zone-2',
          filename: 'DJI_20260831_110310_NIR_RedEdge.tif',
          file_type: 'image/tiff',
          file_size_bytes: 18450000,
          sensor_type: 'MULTISPECTRAL',
          image_type: 'MULTISPECTRAL',
          processing_status: 'COMPLETED',
          capture_time: new Date().toISOString(),
          altitude_agl_meters: 50.0,
          location: { type: 'Point', coordinates: [73.8545, 18.5238] },
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setIsUploading(true);
      setErrorMessage(null);
      setUploadMessage(null);

      const res = await imageService.uploadImage(
        missionId,
        file,
        sensorType,
        selectedZoneId || undefined
      );

      setUploadMessage(`Uploaded "${res.filename}" (${(res.file_size_bytes / 1024 / 1024).toFixed(2)} MB). Background processing queued.`);
      fetchImages();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to upload image frame.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTriggerAI = async (img: DroneImage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setAnalysisImage(img);
      setAnalysisResult(null);
      setIsAnalyzing(true);

      const result = await aiService.analyzeImage({
        image_id: img.id,
        mission_id: missionId,
        zone_id: img.zone_id,
      });
      setAnalysisResult(result);
    } catch (err: any) {
      // Demo fallback AI prediction
      setAnalysisResult({
        health_score: 0.88,
        vegetation_stress_score: 0.12,
        anomaly_score: 0.15,
        disease_probability: 0.08,
        pest_probability: 0.05,
        confidence: 0.84,
        model_name: 'AgriShield-Vision-DemoPrototype',
        model_version: 'v0.1.0-prototype',
        inference_timestamp: new Date().toISOString(),
        prediction_metadata: {
          prototype_label: 'DEMO / PROTOTYPE',
          input_resolution: '3840x2160',
          bands_analyzed: ['RGB'],
        },
        health_observation_id: 'obs-demo-001',
        prototype_disclaimer: 'DEMO / PROTOTYPE: Non-diagnostic statistical model used for system scaffolding.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusBadge = (status: ImageProcessingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-agri-500/10 border border-agri-500/25 text-agri-400 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Ready</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>Processing</span>
          </span>
        );
      case 'QUEUED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Queued</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-agri-800 text-agri-400/70 text-[10px]">
            {status}
          </span>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-5">
      {/* Upload Zone */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-agri-100 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-agri-400" />
              <span>Drone Imagery Ingestion Pipeline</span>
            </h3>
            <p className="text-xs text-agri-400/70 mt-0.5">
              Supports JPEG, PNG, and GeoTIFF multispectral raster frames up to 2048 MB.
            </p>
          </div>

          {/* Quick Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={sensorType}
              onChange={(e) => setSensorType(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-agri-200 focus:outline-none focus:border-agri-500 font-semibold"
            >
              <option value="RGB">RGB Standard</option>
              <option value="MULTISPECTRAL">Multispectral (NDVI/RedEdge)</option>
              <option value="THERMAL">Thermal Infrared</option>
            </select>

            {zones.length > 0 && (
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-agri-200 focus:outline-none focus:border-agri-500 font-mono"
              >
                <option value="">Auto-Detect Zone (GPS)</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zone_code} ({z.name})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-1.5 rounded-xl bg-agri-500 hover:bg-agri-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Streaming to MinIO...' : 'Upload Image Frame'}</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".jpg,.jpeg,.png,.tif,.tiff"
              className="hidden"
            />
          </div>
        </div>

        {uploadMessage && (
          <div className="p-3 rounded-xl bg-agri-500/10 border border-agri-500/25 text-agri-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Captured Imagery Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-agri-400/70 flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Ingested Mission Imagery Frames ({images.length})</span>
          </h4>
          <span className="text-[11px] text-agri-500/70 font-mono">
            Storage: MinIO S3 Object Storage
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-agri-400/70 text-xs">Loading image records...</div>
        ) : images.length === 0 ? (
          <div className="p-8 text-center text-agri-500/70 text-xs rounded-2xl bg-slate-900/40 border border-slate-800">
            No drone imagery uploaded yet. Select an image frame above to ingest.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="p-4 rounded-2xl bg-agri-900/60 border border-slate-800 space-y-3 hover:border-slate-700 cursor-pointer transition shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-agri-400">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="truncate max-w-[160px]">
                        <p className="font-bold text-agri-100 text-xs truncate" title={img.filename}>
                          {img.filename}
                        </p>
                        <p className="text-[10px] text-agri-400/70 font-mono">
                          {formatFileSize(img.file_size_bytes)}
                        </p>
                      </div>
                    </div>

                    {getStatusBadge(img.processing_status)}
                  </div>

                  <div className="p-2 rounded-xl bg-agri-950/60 border border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-agri-400/70">
                      <span>Sensor Band:</span>
                      <span className="px-1.5 py-0.2 rounded bg-agri-800 text-agri-200 font-mono text-[10px] font-bold">
                        {img.sensor_type}
                      </span>
                    </div>

                    {img.location?.coordinates && (
                      <div className="flex items-center justify-between text-agri-400/70">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-agri-400" />
                          <span>GPS Location:</span>
                        </span>
                        <span className="font-mono text-agri-300 text-[10px]">
                          {img.location.coordinates[1].toFixed(4)}°, {img.location.coordinates[0].toFixed(4)}°
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <button
                    type="button"
                    onClick={(e) => handleTriggerAI(img, e)}
                    className="px-2.5 py-1 rounded-lg bg-agri-500/20 hover:bg-agri-500/30 text-agri-400 border border-agri-500/25 font-bold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Run AI Analysis</span>
                  </button>

                  <span className="text-agri-500/70 hover:text-agri-300">Inspect →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Full Image Metadata Inspection */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-agri-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-6 rounded-2xl bg-agri-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-agri-400" />
                <h3 className="font-bold text-agri-100 text-sm">Image Telemetry & Metadata</h3>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-agri-500/70 hover:text-agri-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-agri-500/70">Image ID:</span>
                  <span className="text-agri-300">{selectedImage.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-agri-500/70">Filename:</span>
                  <span className="text-agri-300">{selectedImage.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-agri-500/70">File Type & Size:</span>
                  <span className="text-agri-300">{selectedImage.file_type} ({formatFileSize(selectedImage.file_size_bytes)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-agri-500/70">Sensor Payload:</span>
                  <span className="text-agri-400 font-bold">{selectedImage.sensor_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-agri-500/70">Altitude AGL:</span>
                  <span className="text-agri-300">{selectedImage.altitude_agl_meters} meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-agri-500/70">Processing State:</span>
                  <span className="text-agri-400">{selectedImage.processing_status}</span>
                </div>
              </div>

              {selectedImage.location?.coordinates && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-agri-400/70 block font-medium">GPS Coordinates (WGS84 SRID 4326):</span>
                  <span className="font-mono text-agri-200">
                    Latitude: {selectedImage.location.coordinates[1]}° N, Longitude: {selectedImage.location.coordinates[0]}° E
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const target = selectedImage;
                  setSelectedImage(null);
                  handleTriggerAI(target);
                }}
                className="px-4 py-2 rounded-xl bg-agri-500 hover:bg-agri-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze with AI Vision</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 rounded-xl bg-agri-800 text-agri-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Crop Health Analysis Modal */}
      {analysisImage && (
        <CropHealthAnalysisModal
          image={analysisImage}
          analysis={analysisResult}
          isLoading={isAnalyzing}
          onClose={() => {
            setAnalysisImage(null);
            setAnalysisResult(null);
          }}
        />
      )}
    </div>
  );
};
