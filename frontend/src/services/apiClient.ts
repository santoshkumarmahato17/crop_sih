import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { SystemHealthReport } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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
    const token = localStorage.getItem('kisansathi_token');
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
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        const token = localStorage.getItem('kisansathi_token');
        const isLoginUrl = error.config?.url?.includes('/auth/login');
        const isRegisterUrl = error.config?.url?.includes('/auth/register');
        const isDemoToken = token?.startsWith('demo-token') || token?.startsWith('token-');
        
        if (!isLoginUrl && !isRegisterUrl && token && !isDemoToken) {
          // Token is invalid/expired — clear session and send to login
          localStorage.removeItem('kisansathi_token');
          localStorage.removeItem('kisansathi_user');
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        return Promise.reject(error);
      }
      
      if (status === 403) {
        return Promise.reject(error);
      }
      
      if (status >= 500) {
        return Promise.reject(error);
      }
    } else if (error.request) {
      return Promise.reject(error);
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

export const satelliteService = {
  getFarmImagery: async (farmId: string, layer: string = 'true_color', date?: string) => {
    const params = new URLSearchParams();
    params.append('layer', layer);
    if (date) params.append('date', date);
    
    const response = await apiClient.get(`/satellite/farm/${farmId}/image?${params.toString()}`);
    return response.data;
  },
  
  getFarmStats: async (farmId: string, days: number = 30) => {
    const response = await apiClient.get(`/satellite/farm/${farmId}/stats?days=${days}`);
    return response.data;
  }
};
