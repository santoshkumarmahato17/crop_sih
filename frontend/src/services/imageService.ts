import { apiClient } from './apiClient';
import {
  DroneImage,
  DroneImageListResponse,
  ImageProcessingJob,
  ImageUploadResponse,
} from '@/types';

export const imageService = {
  uploadImage: async (
    missionId: string,
    file: File,
    sensorType: string = 'RGB',
    zoneId?: string,
    gpsLatitude?: number,
    gpsLongitude?: number
  ): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sensor_type', sensorType);
    if (zoneId) formData.append('zone_id', zoneId);
    if (gpsLatitude !== undefined) formData.append('gps_latitude', gpsLatitude.toString());
    if (gpsLongitude !== undefined) formData.append('gps_longitude', gpsLongitude.toString());

    const response = await apiClient.post<ImageUploadResponse>(
      `/drone-missions/${missionId}/images/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  listMissionImages: async (
    missionId: string,
    skip: number = 0,
    limit: number = 100
  ): Promise<DroneImageListResponse> => {
    const response = await apiClient.get<DroneImageListResponse>(
      `/drone-missions/${missionId}/images`,
      {
        params: { skip, limit },
      }
    );
    return response.data;
  },

  getImage: async (imageId: string): Promise<DroneImage> => {
    const response = await apiClient.get<DroneImage>(`/drone-images/${imageId}`);
    return response.data;
  },

  getJobStatus: async (jobId: string): Promise<ImageProcessingJob> => {
    const response = await apiClient.get<ImageProcessingJob>(`/image-jobs/${jobId}`);
    return response.data;
  },
};
