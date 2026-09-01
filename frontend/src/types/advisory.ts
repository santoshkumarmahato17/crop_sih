export type AdvisoryType =
  | 'DISEASE_ADVISORY'
  | 'PEST_ADVISORY'
  | 'WATER_STRESS_ADVISORY'
  | 'WEATHER_RISK_ADVISORY'
  | 'MONITORING_ADVISORY'
  | 'PREVENTIVE_ADVISORY'
  | 'EXPERT_VALIDATION_ADVISORY'
  | 'LAB_REFERRAL_ADVISORY';

export type AdvisoryPriority = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AdvisorySource = 'AI' | 'EXPERT' | 'SYSTEM_RULE' | 'LAB_RESULT';

export interface AdvisoryTranslation {
  id: string;
  advisory_id: string;
  language: string; // en, ta, hi, mr
  title: string;
  summary: string;
  why_this_matters: string;
  what_to_do_now: string[];
  what_to_monitor: string[];
  what_to_avoid: string[];
  when_to_seek_expert_help: string;
  safety_warnings: string[];
  technical_breakdown?: string;
  audio_text?: string;
}

export interface Advisory {
  id: string;
  farm_id: string;
  farm_name?: string;
  zone_id?: string;
  zone_name?: string;
  crop_id?: string;
  crop_name?: string;
  validation_request_id?: string;
  risk_assessment_id?: string;
  advisory_type: AdvisoryType;
  priority: AdvisoryPriority;
  source: AdvisorySource;
  trust_level: number; // 1=AI, 2=Multi-Signal, 3=Expert Validated, 4=Lab Confirmed
  condition_name: string;
  follow_up_date?: string;
  is_read: boolean;
  version: string;
  created_at: string;
  localized?: AdvisoryTranslation;
  all_translations?: AdvisoryTranslation[];
}

export interface AdvisoryGeneratePayload {
  farm_id: string;
  zone_id?: string;
  crop_id?: string;
  condition_name: string;
  risk_score?: number;
  advisory_type?: AdvisoryType;
  priority?: AdvisoryPriority;
  source?: AdvisorySource;
  trust_level?: number;
  validation_request_id?: string;
  risk_assessment_id?: string;
  growth_stage?: string;
  weather_context?: Record<string, any>;
}
