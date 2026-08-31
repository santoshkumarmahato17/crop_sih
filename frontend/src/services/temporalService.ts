import { apiClient } from './apiClient';
import {
  FarmHealthTimelineResponse,
  ZoneHistoryResponse,
  ZoneTrendResponse,
} from '@/types';

export const temporalService = {
  getZoneHistory: async (zoneId: string, limit: number = 50): Promise<ZoneHistoryResponse> => {
    const response = await apiClient.get<ZoneHistoryResponse>(`/zones/${zoneId}/history`, {
      params: { limit },
    });
    return response.data;
  },

  getZoneTrend: async (zoneId: string): Promise<ZoneTrendResponse> => {
    const response = await apiClient.get<ZoneTrendResponse>(`/zones/${zoneId}/trend`);
    return response.data;
  },

  getFarmHealthHistory: async (farmId: string): Promise<FarmHealthTimelineResponse> => {
    const response = await apiClient.get<FarmHealthTimelineResponse>(
      `/farms/${farmId}/health-history`
    );
    return response.data;
  },
};
