export type HealthTrendClassification = 'STABLE' | 'IMPROVING' | 'DECLINING' | 'RAPIDLY_DECLINING';

export interface ZoneScanRecord {
  scan_id: string;
  observation_date: string;
  health_score: number; // 0-100
  mean_ndvi?: number;
  mean_ndre?: number;
  disease_probability: number; // 0-100
  disease_count: number;
  max_disease_severity: string;
  pest_probability: number; // 0-100
  pest_count: number;
  water_stress_cwsi: number; // 0.0 - 1.0
  water_stress_category: string;
  anomaly_score: number; // 0-100
}

export interface ZoneHistoryResponse {
  zone_id: string;
  zone_code: string;
  farm_id: string;
  total_scans: number;
  history: ZoneScanRecord[];
}

export interface ZoneTrendResponse {
  zone_id: string;
  zone_code: string;
  farm_id: string;
  total_scans: number;
  health_trend: HealthTrendClassification;
  disease_trend: string;
  pest_trend: string;
  water_stress_trend: string;
  anomaly_trend: string;
  classification: HealthTrendClassification;
  delta_last_scan_percent: number;
  delta_total_percent: number;
  velocity_per_day: number;
  baseline_health: number;
  current_health: number;
  recent_scans: ZoneScanRecord[];
}

export interface FarmHealthTimelineSnapshot {
  date: string;
  mean_health_score: number;
  mean_ndvi?: number;
  total_observations: number;
  zones_monitored: number;
  dominant_trend: string;
}

export interface FarmHealthTimelineResponse {
  farm_id: string;
  farm_name: string;
  total_zones: number;
  history_by_date: FarmHealthTimelineSnapshot[];
}
