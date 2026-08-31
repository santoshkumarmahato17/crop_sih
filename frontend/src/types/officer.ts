export type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface OfficerFarmSummary {
  farm_id: string;
  farm_name: string;
  owner_name: string;
  location_name: string;
  area_hectares: number;
  crop_type: string;
  growth_stage: string;
  priority_tier: PriorityTier;
  risk_score: number;
  critical_zones_count: number;
  pest_hotspots_count: number;
  spread_risk_score: number;
  unresolved_alerts_count: number;
  pending_validations_count: number;
  recommended_visit: boolean;
  last_visit_date?: string;
}

export interface OfficerDashboardResponse {
  officer_id: string;
  officer_name: string;
  total_assigned_farms: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  unresolved_alerts_total: number;
  pending_validations_total: number;
  recommended_visits_total: number;
  farms: OfficerFarmSummary[];
  evaluated_at: string;
}

export interface OfficerValidationRequest {
  observation_id: string;
  observation_type: 'HEALTH' | 'DISEASE' | 'PEST' | 'WATER';
  validation_status: 'VALIDATED' | 'REJECTED' | 'UNCERTAIN' | 'LAB_CONFIRMATION_REQUESTED';
  notes?: string;
  override_pathogen?: string;
  create_field_visit?: boolean;
  visit_scheduled_date?: string;
}

export interface OfficerValidationResponse {
  validation_id: string;
  officer_id: string;
  observation_id: string;
  validation_status: string;
  audit_log_id: string;
  audit_action: string;
  notes?: string;
  created_at: string;
  message: string;
}
