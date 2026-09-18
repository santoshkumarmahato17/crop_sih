/**
 * AGRI SHIELD — Crop Pathology Vision Prediction & Advisory Service.
 * Connects client application components to the FastAPI Vision AI backend.
 */

import { apiClient } from './apiClient';
import {
  CropPredictionResponse,
  CropPredictionContext,
  SupportedClassesResponse,
} from '@/types/cropPrediction';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Enhanced implementation of connectToService(data):
 * - Seamlessly handles both JSON payloads and Multipart FormData (image uploads).
 * - Dynamically resolves the API base URL from the application environment.
 * - Automatically attaches the Authorization Bearer token from localStorage.
 * - Checks response.ok for robust error handling.
 */
export async function connectToService<T = CropPredictionResponse>(
  data: FormData | Record<string, any>,
  endpoint: string = '/predict'
): Promise<T | null> {
  try {
    // Normalize URL
    const rootBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '') || '';
    const url = endpoint.startsWith('http') ? endpoint : `${rootBase}${endpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // Attach authentication token if logged in
    const token = localStorage.getItem('agrishield_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let body: BodyInit;
    if (data instanceof FormData) {
      // Browser automatically sets Content-Type with boundary for FormData
      body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status} (${response.statusText}): ${errorText}`);
    }

    const result: T = await response.json();
    console.log('Success:', result);
    return result;
  } catch (error) {
    console.error('Error in connectToService:', error);
    throw error;
  }
}

/**
 * Typed client methods for Crop Disease Prediction
 */
export const cropPredictService = {
  /**
   * Upload an image file for disease/pest diagnosis and multi-factor advisory.
   */
  predictCropDisease: async (
    file: File | Blob,
    context?: CropPredictionContext
  ): Promise<CropPredictionResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    if (context?.crop_stage) formData.append('crop_stage', context.crop_stage);
    if (context?.temperature_c !== undefined) formData.append('temperature_c', String(context.temperature_c));
    if (context?.humidity_percent !== undefined) formData.append('humidity_percent', String(context.humidity_percent));
    if (context?.rainfall_mm !== undefined) formData.append('rainfall_mm', String(context.rainfall_mm));
    if (context?.latitude !== undefined) formData.append('latitude', String(context.latitude));
    if (context?.longitude !== undefined) formData.append('longitude', String(context.longitude));
    if (context?.include_explanation) formData.append('include_explanation', 'true');

    const result = await connectToService<CropPredictionResponse>(formData, '/predict');
    if (!result) {
      throw new Error('No prediction returned from backend');
    }
    return result;
  },

  /**
   * Predict disease with Grad-CAM heatmap visualization overlay.
   */
  predictWithExplanation: async (
    file: File | Blob,
    context?: CropPredictionContext
  ): Promise<CropPredictionResponse> => {
    return cropPredictService.predictCropDisease(file, {
      ...context,
      include_explanation: true,
    });
  },

  /**
   * Retrieve list of all supported crops, condition categories, and classes.
   */
  getSupportedClasses: async (): Promise<SupportedClassesResponse> => {
    const response = await apiClient.get<SupportedClassesResponse>('/predict/classes');
    return response.data;
  },
};
