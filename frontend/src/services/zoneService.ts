import { apiClient } from './apiClient';
import { Zone, ZoneGeneratePayload, ZoneListResponse } from '@/types';

export const zoneService = {
  listZones: async (farmId: string): Promise<ZoneListResponse> => {
    const response = await apiClient.get<ZoneListResponse>(`/farms/${farmId}/zones`);
    return response.data;
  },

  generateZones: async (farmId: string, payload: ZoneGeneratePayload): Promise<ZoneListResponse> => {
    const response = await apiClient.post<ZoneListResponse>(`/farms/${farmId}/zones/generate`, payload);
    return response.data;
  },

  getZone: async (farmId: string, zoneId: string): Promise<Zone> => {
    const response = await apiClient.get<Zone>(`/farms/${farmId}/zones/${zoneId}`);
    return response.data;
  },
};
