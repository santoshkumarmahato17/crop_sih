import { apiClient } from './apiClient';
import { CreateFarmPayload, Farm, FarmListResponse, UpdateFarmPayload } from '@/types';

export const farmService = {
  listFarms: async (skip: number = 0, limit: number = 50): Promise<FarmListResponse> => {
    const response = await apiClient.get<FarmListResponse>('/farms', {
      params: { skip, limit },
    });
    return response.data;
  },

  getFarm: async (farmId: string): Promise<Farm> => {
    const response = await apiClient.get<Farm>(`/farms/${farmId}`);
    return response.data;
  },

  createFarm: async (payload: CreateFarmPayload): Promise<Farm> => {
    const response = await apiClient.post<Farm>('/farms', payload);
    return response.data;
  },

  updateFarm: async (farmId: string, payload: UpdateFarmPayload): Promise<Farm> => {
    const response = await apiClient.put<Farm>(`/farms/${farmId}`, payload);
    return response.data;
  },

  deleteFarm: async (farmId: string): Promise<{ status: string; detail: string }> => {
    const response = await apiClient.delete<{ status: string; detail: string }>(`/farms/${farmId}`);
    return response.data;
  },
};
