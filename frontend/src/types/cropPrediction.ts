/**
 * KISAN SATHI — Crop Pathology Prediction & Risk Advisory Types.
 */

export interface TopPredictionItem {
  class: string;
  crop: string;
  condition: string;
  confidence: number;
  scientific_name?: string;
}

export interface IPMRecommendationItem {
  action: string;
  detail: string;
}

export interface AgronomicRiskAdvisory {
  composite_risk_score: number;
  risk_level: 'Low' | 'Moderate' | 'High' | 'Critical';
  advisory_summary: string;
  environmental_favorability: string;
  weather_context?: {
    temperature_c?: number;
    humidity_percent?: number;
    rainfall_mm?: number;
  };
  crop_stage?: string;
  recommended_actions: string[];
}

export interface CropPredictionResponse {
  crop: string;
  condition: string;
  class: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  severity_score?: number;
  needs_expert_review: boolean;
  scientific_name?: string;
  urgency?: string;
  description?: string;
  explanation_heatmap_base64?: string;
  top_predictions?: TopPredictionItem[];
  ipm_recommendations?: IPMRecommendationItem[];
  agronomic_advisory?: AgronomicRiskAdvisory;
}

export interface CropPredictionContext {
  crop_stage?: 'seedling' | 'vegetative' | 'tillering' | 'booting' | 'flowering' | 'grain_filling' | 'maturity';
  temperature_c?: number;
  humidity_percent?: number;
  rainfall_mm?: number;
  latitude?: number;
  longitude?: number;
  include_explanation?: boolean;
}

export interface SupportedClassesResponse {
  total_classes: number;
  crops: string[];
  condition_categories: string[];
  classes: Array<{
    class: string;
    crop: string;
    condition: string;
    category: string;
    scientific_name: string;
    urgency: string;
  }>;
}
