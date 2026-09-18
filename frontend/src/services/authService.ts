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

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; smtp_configured: boolean }> {
    const response = await apiClient.post<{ success: boolean; message: string; smtp_configured: boolean }>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string; reset_token: string }> {
    const response = await apiClient.post<{ success: boolean; message: string; reset_token: string }>(
      '/auth/verify-otp',
      { email, otp }
    );
    return response.data;
  },

  async resetPassword(payload: {
    email: string;
    reset_token: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', payload);
    return response.data;
  },
};
