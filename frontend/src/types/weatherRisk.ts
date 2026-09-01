export interface WeatherObservationData {
  timestamp: string;
  temperature_c: number;
  min_temperature_c?: number;
  max_temperature_c?: number;
  relative_humidity_percent: number;
  rainfall_mm: number;
  rainfall_probability_percent: number;
  rainfall_duration_hours?: number;
  wind_speed_mps: number;
  wind_direction_deg: number;
  solar_radiation_w_m2?: number;
  cloud_cover_percent?: number;
  soil_moisture_percent?: number;
  condition_text: string;
  source: string;
  is_forecast: boolean;
}

export interface RiskFactorData {
  factor_name: string;
  impact_level: 'HIGH' | 'MODERATE' | 'LOW';
  points_delta: number;
  description: string;
}

export interface SingleRiskVectorData {
  risk_type: 'DISEASE' | 'PEST' | 'WATER_STRESS' | 'OVERALL';
  score: number;
  tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'ADEQUATE' | 'MODERATE';
  confidence_pct: number;
  plain_explanation: string;
  technical_explanation: string;
  contributing_factors?: RiskFactorData[];
  rule_version: string;
}

export interface DailyForecastRiskData {
  day_offset: number;
  forecast_date: string;
  weather_summary: string;
  temperature_c: number;
  relative_humidity_pct: number;
  expected_rainfall_mm: number;
  disease_risk_score: number;
  disease_tier: string;
  pest_risk_score: number;
  pest_tier: string;
  water_stress_score: number;
  water_stress_tier: string;
  overall_risk_score: number;
  overall_tier: string;
  confidence_pct: number;
  primary_explanation: string;
}

export interface FarmWeatherRiskResponse {
  farm_id: string;
  farm_name: string;
  zone_id?: string;
  evaluated_at: string;
  horizon_days: number;
  current_weather: WeatherObservationData;
  current_disease_risk: SingleRiskVectorData;
  current_pest_risk: SingleRiskVectorData;
  current_water_stress: SingleRiskVectorData;
  current_overall_risk: SingleRiskVectorData;
  risk_trend: 'STABLE' | 'RISING' | 'FALLING' | 'RAPIDLY_RISING' | 'RAPIDLY_FALLING';
  forecast_timeline: DailyForecastRiskData[];
  adaptive_monitoring_recommendation: string;
  recommended_inspection_interval_days: number;
  rule_version: string;
}

export interface RegionalHotspotItem {
  farm_id: string;
  farm_name: string;
  location_name: string;
  crop_type: string;
  overall_risk_score: number;
  risk_tier: string;
  disease_risk_score: number;
  pest_risk_score: number;
  water_stress_score: number;
  risk_trend: string;
  recommended_action: string;
}

export interface RegionalRiskResponse {
  jurisdiction: string;
  evaluated_at: string;
  total_monitored_farms: number;
  critical_hotspots_count: number;
  high_risk_hotspots_count: number;
  moderate_risk_count: number;
  dominant_weather_pattern: string;
  hotspots: RegionalHotspotItem[];
}
