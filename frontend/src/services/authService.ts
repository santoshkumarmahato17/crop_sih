import { apiClient } from './apiClient';
import {
  AuthTokenResponse,
  UserProfile,
  UserRegisterPayload,
  UserProfileUpdatePayload,
  UserPasswordUpdatePayload,
} from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<AuthTokenResponse> {
    const response = await apiClient.post<AuthTokenResponse>('/auth/login', { email, password });
    return response.data;
  },

  async register(payload: UserRegisterPayload): Promise<UserProfile> {
    const response = await apiClient.post<UserProfile>('/auth/register', payload);
    return response.data;
  },

  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/auth/me');
    return response.data;
  },

  async updateProfile(payload: UserProfileUpdatePayload): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile>('/auth/profile', payload);
    return response.data;
  },

  async updatePassword(payload: UserPasswordUpdatePayload): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>('/auth/password', payload);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
  },
};
