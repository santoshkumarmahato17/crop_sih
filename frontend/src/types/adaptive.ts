export interface AdaptivePolicyConfig {
  low_risk_days: number;
  medium_risk_days: number;
  high_risk_days: number;
  critical_risk_hours: number;
}

export interface AdaptiveMonitoringRecommendation {
  farm_id: string;
  farm_name: string;
  overall_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overall_risk_score: number;
  monitoring_priority: 'ROUTINE' | 'ELEVATED' | 'URGENT' | 'IMMEDIATE_TARGETED';
  recommended_monitoring_date: string;
  interval_days: number;
  target_zones: string[];
  reason_for_monitoring: string;
  recommended_sensor_payload: string[];
  recommended_flight_altitude_m: number;
  factors_evaluated: Record<string, any>;
  generated_at: string;
}

export interface ScheduleMissionFromRecommendationRequest {
  farm_id: string;
  target_zones: string[];
  scheduled_time?: string;
  drone_id?: string;
  flight_altitude_m?: number;
}

export interface ScheduleMissionFromRecommendationResponse {
  mission_id: string;
  mission_code: string;
  farm_id: string;
  status: string;
  target_zones: string[];
  scheduled_time: string;
  message: string;
}
