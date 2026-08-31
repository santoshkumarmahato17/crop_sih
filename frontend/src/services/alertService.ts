import { apiClient } from './apiClient';
import {
  AlertResponse,
  NotificationCenterSummary,
} from '@/types';

export const alertService = {
  listAlerts: async (
    isResolved?: boolean,
    severity?: string
  ): Promise<AlertResponse[]> => {
    const response = await apiClient.get<AlertResponse[]>('/alerts', {
      params: { is_resolved: isResolved, severity },
    });
    return response.data;
  },

  resolveAlert: async (alertId: string): Promise<AlertResponse> => {
    const response = await apiClient.put<AlertResponse>(
      `/alerts/${alertId}/resolve`
    );
    return response.data;
  },

  getNotifications: async (
    unreadOnly: boolean = false
  ): Promise<NotificationCenterSummary> => {
    const response = await apiClient.get<NotificationCenterSummary>(
      '/notifications',
      {
        params: { unread_only: unreadOnly },
      }
    );
    return response.data;
  },

  markRead: async (notificationIds: string[]): Promise<void> => {
    await apiClient.post('/notifications/mark-read', {
      notification_ids: notificationIds,
    });
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read');
  },
};
