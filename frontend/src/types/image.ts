import { GeoJSONGeometry } from './index';

export type ImageProcessingStatus = 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DroneImage {
  id: string;
  mission_id: string;
  farm_id?: string;
  zone_id?: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  sensor_type: string;
  image_type: string;
  processing_status: ImageProcessingStatus;
  capture_time: string;
  altitude_agl_meters: number;
  location?: GeoJSONGeometry;
  footprint?: GeoJSONGeometry;
  created_at: string;
}

export interface DroneImageListResponse {
  images: DroneImage[];
  total: number;
}

export interface ImageUploadResponse {
  image_id: string;
  filename: string;
  file_size_bytes: number;
  sensor_type: string;
  processing_status: ImageProcessingStatus;
  job_id: string;
  message: string;
}

export interface ImageProcessingJob {
  id: string;
  mission_id: string;
  job_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress_percent: number;
  celery_task_id?: string;
  output_artifacts?: Record<string, any>;
  error_message?: string;
  created_at: string;
}
