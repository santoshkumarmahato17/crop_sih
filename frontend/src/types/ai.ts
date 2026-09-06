export interface CropHealthAnalysisResponse {
  id?: string;
  analysis_id?: string;
  crop?: string;
  crop_confidence?: number;
  crop_status?: string;
  crop_origin?: string;
  condition?: string;
  condition_category?: string;
  specific_class?: string;
  confidence: number;
  health_score: number;
  vegetation_stress_score: number;
  anomaly_score: number;
  disease_probability: number;
  pest_probability: number;
  model_name: string;
  model_version: string;
  inference_timestamp: string;
  prediction_metadata: Record<string, any>;
  image_quality?: {
    score: number;
    status: 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNUSABLE';
    is_usable: boolean;
    blur_variance: number;
    mean_luminance: number;
    contrast_std: number;
    resolution_status: string;
    image_dimensions: { width: number; height: number };
    foliar_ratio: number;
    warning_message?: string;
    diagnostic_warnings: string[];
  };
  causal_agent?: {
    scientific_name: string;
    pathogen_type: string;
    description: string;
  };
  severity?: string;
  severity_percentage?: number;
  severity_detail?: {
    level: string;
    score: number;
    confidence: number;
    affected_area_pct: number;
    lesion_count: number;
    summary: string;
    damage_index?: number;
    symptom_breakdown?: {
      necrosis_pct: number;
      chlorosis_pct: number;
    };
  };
  risk_detail?: {
    level: string;
    score?: number | null;
    confidence: number;
    status: string;
    summary: string;
    factors: Array<{ name: string; contribution: number; description?: string }>;
  };
  detected_patches?: any[];
  detected_regions?: any[];
  localization_available?: boolean;
  localization_message?: string;
  recommendations?: Array<{
    action_type: string;
    title: string;
    detail: string;
    source: string;
  }>;
  video_resource?: {
    title: string;
    channel: string;
    watch_url: string;
    url?: string;
    publisher?: string;
    language: string;
    relevance_score: number;
    video_id?: string;
  };
  wiki_resource?: {
    title: string;
    url: string;
    source: string;
  };
  needs_expert_review?: boolean;
  health_observation_id?: string;
  disease_observation_id?: string;
  pest_observation_id?: string;
  water_stress_observation_id?: string;
  prototype_disclaimer?: string;
}

export interface AnalyzeImagePayload {
  image_id?: string;
  file?: File;
  farm_id?: string;
  zone_id?: string;
  mission_id?: string;
}
