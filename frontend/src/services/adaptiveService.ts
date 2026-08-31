import { apiClient } from './apiClient';
import {
  AdaptiveMonitoringRecommendation,
  AdaptivePolicyConfig,
  ScheduleMissionFromRecommendationRequest,
  ScheduleMissionFromRecommendationResponse,
} from '@/types';

export const adaptiveService = {
  getRecommendation: async (
    farmId: string
  ): Promise<AdaptiveMonitoringRecommendation> => {
    const response = await apiClient.get<AdaptiveMonitoringRecommendation>(
      `/farms/${farmId}/adaptive-monitoring`
    );
    return response.data;
  },

  scheduleMission: async (
    farmId: string,
    request: ScheduleMissionFromRecommendationRequest
  ): Promise<ScheduleMissionFromRecommendationResponse> => {
    const response = await apiClient.post<ScheduleMissionFromRecommendationResponse>(
      `/farms/${farmId}/adaptive-monitoring/schedule-mission`,
      request
    );
    return response.data;
  },

  getPolicy: async (): Promise<AdaptivePolicyConfig> => {
    const response = await apiClient.get<AdaptivePolicyConfig>(
      '/adaptive-monitoring/policy'
    );
    return response.data;
  },

  updatePolicy: async (
    policy: AdaptivePolicyConfig
  ): Promise<AdaptivePolicyConfig> => {
    const response = await apiClient.put<AdaptivePolicyConfig>(
      '/adaptive-monitoring/policy',
      policy
    );
    return response.data;
  },
};
