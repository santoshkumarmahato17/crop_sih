import { apiClient } from './apiClient';
import { CropHealthAnalysisResponse } from '@/types';

export interface DatasetSummary {
  dataset_name: string;
  dataset_root: string;
  is_available: boolean;
  total_classes: number;
  crops: string[];
  class_counts: Record<string, number>;
  supported_crops_breakdown: Record<string, string[]>;
}

export interface ClassTaxonomy {
  class_key: string;
  crop: string;
  condition: string;
  pathogen_type: string;
  scientific_name: string;
  is_healthy: boolean;
  is_pest: boolean;
  is_disease: boolean;
  urgency: string;
  description: string;
  ipm_recommendations: Array<{
    action?: string;
    action_type?: string;
    title: string;
    detail?: string;
    description?: string;
    priority?: string;
  }>;
}

export interface SampleImageInfo {
  class_key: string;
  crop: string;
  condition: string;
  file_name: string;
  relative_path: string;
  full_path: string;
}

export interface AnalyzeSamplePayload {
  class_key: string;
  sample_index?: number;
  farm_id?: string;
  zone_id?: string;
}

export const datasetService = {
  getSummary: async (): Promise<DatasetSummary> => {
    const response = await apiClient.get<DatasetSummary>('/dataset/summary');
    return response.data;
  },

  getClasses: async (crop?: string): Promise<ClassTaxonomy[]> => {
    const response = await apiClient.get<ClassTaxonomy[]>('/dataset/classes', {
      params: crop ? { crop } : {},
    });
    return response.data;
  },

  getSampleImages: async (crop?: string, limitPerClass = 1): Promise<SampleImageInfo[]> => {
    const response = await apiClient.get<SampleImageInfo[]>('/dataset/sample-images', {
      params: { crop, limit_per_class: limitPerClass },
    });
    return response.data;
  },

  getImageStreamUrl: (relativePath: string): string => {
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000/api/v1';
    return `${baseURL}/dataset/image-file?path=${encodeURIComponent(relativePath)}`;
  },

  analyzeSample: async (payload: AnalyzeSamplePayload): Promise<CropHealthAnalysisResponse> => {
    const response = await apiClient.post<CropHealthAnalysisResponse>(
      '/dataset/analyze-sample',
      payload
    );
    return response.data;
  },
};
