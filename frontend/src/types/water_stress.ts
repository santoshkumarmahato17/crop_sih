export type WaterStressCategory =
  | 'ADEQUATE'
  | 'MODERATE_STRESS'
  | 'HIGH_STRESS'
  | 'POSSIBLE_WATERLOGGING';

export type IrrigationPriorityTier =
  | 'NONE'
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL'
  | 'DRAINAGE_ATTENTION';

export interface ZoneWaterStressRecord {
  zone_id: string;
  zone_code: string;
  status: WaterStressCategory;
  water_stress_score: number; // 0-100
  cwsi_index: number; // 0.0 - 1.0
  canopy_air_temp_diff_c: number;
  soil_moisture_pct?: number;
  irrigation_priority: IrrigationPriorityTier;
  decision_support_guidance: string;
  decision_factors: Record<string, any>;
}

export interface FarmWaterRequirementResponse {
  farm_id: string;
  farm_name: string;
  total_zones: number;
  adequate_count: number;
  moderate_count: number;
  high_stress_count: number;
  waterlogged_count: number;
  highest_priority: string;
  evaluated_at: string;
  zones: ZoneWaterStressRecord[];
  disclaimer: string;
}
