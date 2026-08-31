export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskContributingFactor {
  factor_name: string;
  category: 'weather' | 'temporal_trend' | 'agronomic' | 'biosecurity' | 'history';
  points: number;
  description: string;
}

export interface RiskAssessmentDetail {
  disease_risk_score: number;
  pest_risk_score: number;
  water_stress_risk: number;
  overall_crop_risk: number;
  risk_level: RiskTier;
  rule_version: string;
  assessment_timestamp: string;
  explanation_summary: string;
  contributing_factors: RiskContributingFactor[];
  raw_inputs: Record<string, any>;
}

export interface ZoneRiskResponse {
  zone_id: string;
  zone_code: string;
  farm_id: string;
  risk_assessment: RiskAssessmentDetail;
}

export interface FarmRiskSummaryResponse {
  farm_id: string;
  farm_name: string;
  mean_overall_risk: number;
  highest_risk_level: string;
  critical_zones_count: number;
  evaluated_at: string;
  zones_risk: ZoneRiskResponse[];
}
