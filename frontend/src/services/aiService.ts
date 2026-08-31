import { apiClient } from './apiClient';
import { AnalyzeImagePayload, CropHealthAnalysisResponse } from '@/types';

export const aiService = {
  analyzeImage: async (payload: AnalyzeImagePayload): Promise<CropHealthAnalysisResponse> => {
    const formData = new FormData();
    if (payload.image_id) formData.append('image_id', payload.image_id);
    if (payload.file) formData.append('file', payload.file);
    if (payload.farm_id) formData.append('farm_id', payload.farm_id);
    if (payload.zone_id) formData.append('zone_id', payload.zone_id);
    if (payload.mission_id) formData.append('mission_id', payload.mission_id);

    const response = await apiClient.post<CropHealthAnalysisResponse>(
      '/ai/analyze-image',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },
};
