import { apiClient } from './apiClient';
import {
  OfficerDashboardResponse,
  OfficerValidationRequest,
  OfficerValidationResponse,
} from '@/types';

export const officerService = {
  getOfficerDashboard: async (): Promise<OfficerDashboardResponse> => {
    const response = await apiClient.get<OfficerDashboardResponse>('/officer/dashboard');
    return response.data;
  },

  submitValidation: async (
    request: OfficerValidationRequest
  ): Promise<OfficerValidationResponse> => {
    const response = await apiClient.post<OfficerValidationResponse>(
      '/officer/validations',
      request
    );
    return response.data;
  },
};
