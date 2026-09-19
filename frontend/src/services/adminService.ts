import { apiClient as api } from '@/services/apiClient';

export interface PendingGovernmentUser {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  organization_name?: string;
  department?: string;
  assigned_region?: string;
  created_at: string;
}

export const adminService = {
  getPendingGovernmentRequests: async (): Promise<PendingGovernmentUser[]> => {
    const response = await api.get('/admin/government-requests');
    return response.data;
  },

  approveGovernmentAccount: async (userId: string): Promise<void> => {
    await api.post(`/admin/government-requests/${userId}/approve`);
  },

  rejectGovernmentAccount: async (userId: string): Promise<void> => {
    await api.post(`/admin/government-requests/${userId}/reject`);
  },

  suspendUserAccount: async (userId: string): Promise<void> => {
    await api.post(`/admin/users/${userId}/suspend`);
  }
};
