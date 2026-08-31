import { apiClient } from './apiClient';
import { FarmerDashboardSummary } from '@/types';

export const dashboardService = {
  getFarmerSummary: async (farmId?: string): Promise<FarmerDashboardSummary> => {
    const response = await apiClient.get<FarmerDashboardSummary>(
      '/dashboard/farmer-summary',
      {
        params: farmId ? { farm_id: farmId } : {},
      }
    );
    return response.data;
  },
};
