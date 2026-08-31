export interface CropHealthAnalysisResponse {
  health_score: number;
  vegetation_stress_score: number;
  anomaly_score: number;
  disease_probability: number;
  pest_probability: number;
  confidence: number;
  model_name: string;
  model_version: string;
  inference_timestamp: string;
  prediction_metadata: Record<string, any>;
  health_observation_id?: string;
  disease_observation_id?: string;
  pest_observation_id?: string;
  water_stress_observation_id?: string;
  prototype_disclaimer: string;
}

export interface AnalyzeImagePayload {
  image_id?: string;
  file?: File;
  farm_id?: string;
  zone_id?: string;
  mission_id?: string;
}
