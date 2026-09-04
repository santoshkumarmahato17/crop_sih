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

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Log or handle network/auth failures
    return Promise.reject(error);
  }
);

export const systemService = {
  getHealth: async (): Promise<SystemHealthReport> => {
    const response = await apiClient.get<SystemHealthReport>('/health');
    return response.data;
  },
};
