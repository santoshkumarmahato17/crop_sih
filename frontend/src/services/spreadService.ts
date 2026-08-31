import { apiClient } from './apiClient';
import {
  NeighborsResponse,
  RegionalHotspotsResponse,
  SpreadRiskGraphResponse,
} from '@/types';

export const spreadService = {
  getNeighbors: async (farmId: string, radiusKm: number = 15.0): Promise<NeighborsResponse> => {
    const response = await apiClient.get<NeighborsResponse>(`/farms/${farmId}/neighbors`, {
      params: { radius_km: radiusKm },
    });
    return response.data;
  },

  getSpreadRisk: async (
    farmId: string,
    windDirection: number = 225.0,
    windSpeed: number = 18.0
  ): Promise<SpreadRiskGraphResponse> => {
    const response = await apiClient.get<SpreadRiskGraphResponse>(
      `/farms/${farmId}/spread-risk`,
      {
        params: { wind_direction: windDirection, wind_speed: windSpeed },
      }
    );
    return response.data;
  },

  getRegionalHotspots: async (): Promise<RegionalHotspotsResponse> => {
    const response = await apiClient.get<RegionalHotspotsResponse>('/regions/hotspots');
    return response.data;
  },
};
