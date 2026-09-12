import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { SystemHealthReport } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agrishield_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting and 401 auto-redirect
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('agrishield_token');
      // Only clear & redirect if it's NOT a demo-token (those are handled by backend now)
      // and NOT the login endpoint itself (to avoid redirect loops)
      const isLoginUrl = error.config?.url?.includes('/auth/login');
      const isRegisterUrl = error.config?.url?.includes('/auth/register');
      const isDemoToken = token?.startsWith('demo-token') || token?.startsWith('token-');
      
      if (!isLoginUrl && !isRegisterUrl && token && !isDemoToken) {
        // Token is invalid/expired — clear session and send to login
        localStorage.removeItem('agrishield_token');
        localStorage.removeItem('agrishield_user');
        // Use a small delay to allow current render to finish
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export const systemService = {
  getHealth: async (): Promise<SystemHealthReport> => {
    const response = await apiClient.get<SystemHealthReport>('/health');
    return response.data;
  },
};
