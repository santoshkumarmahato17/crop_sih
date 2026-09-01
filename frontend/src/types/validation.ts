export type ValidationRequestStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'UNCERTAIN'
  | 'LAB_REFERRAL';

export type ValidationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type LabReferralStatus =
  | 'REQUESTED'
  | 'SAMPLE_COLLECTED'
  | 'IN_LAB'
  | 'RESULT_AVAILABLE'
  | 'CLOSED';

export interface ExpertValidationRecord {
  id: string;
  validation_request_id: string;
  expert_user_id: string;
  expert_name?: string;
  status: ValidationRequestStatus;
  confirmed_condition?: string;
  expert_notes?: string;
  farmer_guidance?: string;
  rejection_reason?: string;
  uncertain_recommendation?: string;
  validation_version: string;
  validated_at: string;
}

export interface LabReferral {
  id: string;
  referral_code: string;
  validation_request_id: string;
  farm_id: string;
  zone_id?: string;
  sample_type: string;
  suspected_condition: string;
  reason: string;
  status: LabReferralStatus;
  requested_at: string;
  result_summary?: string;
  result_date?: string;
}

export interface ExpertValidationRequest {
  id: string;
  case_number: string;
  analysis_id?: string;
  farm_id: string;
  farm_name?: string;
  zone_id?: string;
  zone_name?: string;
  crop_id?: string;
  crop_name?: string;
  requested_by: string;
  requester_name?: string;
  assigned_expert_id?: string;
  assigned_expert_name?: string;
  priority: ValidationPriority;
  status: ValidationRequestStatus;
  reason: string;
  suspected_condition: string;
  ai_confidence: number;
  crop_growth_stage?: string;
  symptoms: string[];
  image_urls: string[];
  weather_summary?: {
    temperature_c?: number;
    humidity_pct?: number;
    rainfall_mm?: number;
    disease_risk_level?: string;
  };
  hotspot_id?: string;
  drone_observation_id?: string;
  due_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
  decisions?: ExpertValidationRecord[];
  lab_referrals?: LabReferral[];
}

export interface ValidationStats {
  total_pending: number;
  high_priority: number;
  critical: number;
  my_assigned: number;
  recently_validated: number;
  lab_referrals: number;
}
