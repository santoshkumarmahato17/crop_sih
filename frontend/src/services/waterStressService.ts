import { apiClient } from './apiClient';
import {
  FarmWaterRequirementResponse,
  ZoneWaterStressRecord,
} from '@/types';

export const waterStressService = {
  getFarmWaterStress: async (farmId: string): Promise<FarmWaterRequirementResponse> => {
    const response = await apiClient.get<FarmWaterRequirementResponse>(
      `/farms/${farmId}/water-stress`
    );
    return response.data;
  },

  getZoneWaterStress: async (zoneId: string): Promise<ZoneWaterStressRecord> => {
    const response = await apiClient.get<ZoneWaterStressRecord>(
      `/zones/${zoneId}/water-stress`
    );
    return response.data;
  },

  evaluateFarmWaterStress: async (farmId: string): Promise<FarmWaterRequirementResponse> => {
    const response = await apiClient.post<FarmWaterRequirementResponse>(
      `/farms/${farmId}/water-stress/evaluate`
    );
    return response.data;
  },
};
