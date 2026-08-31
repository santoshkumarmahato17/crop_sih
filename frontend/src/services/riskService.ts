import { apiClient } from './apiClient';
import { FarmRiskSummaryResponse, ZoneRiskResponse } from '@/types';

export const riskService = {
  getZoneRisk: async (zoneId: string): Promise<ZoneRiskResponse> => {
    const response = await apiClient.get<ZoneRiskResponse>(`/zones/${zoneId}/risk`);
    return response.data;
  },

  evaluateFarmRisk: async (farmId: string): Promise<FarmRiskSummaryResponse> => {
    const response = await apiClient.post<FarmRiskSummaryResponse>(
      `/farms/${farmId}/risk/evaluate`
    );
    return response.data;
  },

  getFarmRiskSummary: async (farmId: string): Promise<FarmRiskSummaryResponse> => {
    const response = await apiClient.get<FarmRiskSummaryResponse>(
      `/farms/${farmId}/risk-summary`
    );
    return response.data;
  },
};
