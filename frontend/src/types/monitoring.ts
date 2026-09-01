export type MonitoringTriggerType =
  | 'DISEASE_RISK'
  | 'PEST_RISK'
  | 'WATER_STRESS'
  | 'HOTSPOT'
  | 'EXPERT_REQUEST'
  | 'FARMER_REQUEST'
  | 'DRONE_ALERT'
  | 'WEATHER_RISK'
  | 'LAB_FOLLOWUP';

export type MonitoringPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type MonitoringMethod =
  | 'DRONE'
  | 'FIELD_INSPECTION'
  | 'FARMER_IMAGE'
  | 'SENSOR'
  | 'SATELLITE'
  | 'EXPERT_VISIT';

export type MonitoringTaskStatus =
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'MISSED'
  | 'CANCELLED'
  | 'ESCALATED';

export type MonitoringTrend =
  | 'IMPROVING'
  | 'STABLE'
  | 'WORSENING'
  | 'SPREADING'
  | 'UNCERTAIN';

export type HotspotTrendStatus =
  | 'NEW'
  | 'STABLE'
  | 'EXPANDING'
  | 'CONTRACTING'
  | 'RESOLVED'
  | 'REACTIVATED';

export interface MonitoringComparison {
  id: string;
  monitoring_result_id: string;
  previous_observation_id?: string;
  current_observation_id?: string;
  previous_health_score: number;
  current_health_score: number;
  health_change: number; // e.g. -6.0
  previous_disease_risk: number;
  current_disease_risk: number;
  disease_risk_change: number; // e.g. +6.0
  previous_affected_area_ha: number;
  current_affected_area_ha: number;
  affected_area_change_ha: number; // e.g. +0.6 ha
  trend: MonitoringTrend;
  hotspot_status: HotspotTrendStatus;
  is_escalated: boolean;
  escalation_reason?: string;
  recommended_action?: string;
  created_at: string;
}

export interface MonitoringResult {
  id: string;
  monitoring_task_id: string;
  farm_id: string;
  zone_id?: string;
  observation_id?: string;
  health_score: number;
  disease_risk: number;
  pest_risk: number;
  water_stress: number;
  affected_area_ha?: number;
  severity: string;
  trend: MonitoringTrend;
  observed_symptoms?: string[];
  image_urls?: string[];
  notes?: string;
  observed_at: string;
  submitted_by?: string;
  created_at: string;
  comparisons?: MonitoringComparison[];
}

export interface MonitoringTask {
  id: string;
  task_code: string;
  farm_id: string;
  farm_name?: string;
  zone_id?: string;
  zone_name?: string;
  crop_id?: string;
  crop_name?: string;
  trigger_type: MonitoringTriggerType;
  trigger_entity_id?: string;
  suspected_condition?: string;
  priority: MonitoringPriority;
  monitoring_method: MonitoringMethod;
  status: MonitoringTaskStatus;
  scheduled_at: string;
  due_at?: string;
  started_at?: string;
  completed_at?: string;
  target_zone_ids?: string[];
  instructions?: string;
  assigned_to?: string;
  created_by?: string;
  baseline_health_score?: number;
  baseline_disease_risk?: number;
  baseline_affected_area_ha?: number;
  created_at: string;
  updated_at?: string;
  results?: MonitoringResult[];
}

export interface DroneMonitoringRecommendation {
  id: string;
  farm_id: string;
  farm_name?: string;
  zone_id?: string;
  zone_name?: string;
  target_area_description: string;
  targeted_zones: string[];
  priority: MonitoringPriority;
  reason: string;
  recommended_time_window: string;
  previous_health_score: number;
  current_risk_score: number;
  hotspot_status: HotspotTrendStatus;
  is_dispatched: boolean;
  created_at: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  health_score: number;
  disease_risk: number;
  pest_risk: number;
  water_stress: number;
  affected_area_ha: number;
}

export interface ZoneTrendData {
  zone_id: string;
  zone_name: string;
  crop_name?: string;
  current_health_score: number;
  current_disease_risk: number;
  overall_trend: MonitoringTrend;
  data_points: TimeSeriesPoint[];
}

export interface FarmHealthEvent {
  id: string;
  timestamp: string;
  event_type: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  zone_name?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringStats {
  scheduled: number;
  in_progress: number;
  completed: number;
  overdue: number;
  critical: number;
  hotspots_under_monitoring: number;
  monitoring_coverage_pct: number;
}
