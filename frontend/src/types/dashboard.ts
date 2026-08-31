export interface FarmerDashboardSummary {
  farm_id: string;
  farm_name: string;
  location_name: string;
  area_hectares: number;
  crop_type: string;
  growth_stage: string;

  // 1. Is my farm healthy?
  overall_health_score: number;
  health_verdict: string;
  health_trend: string;

  // 2. Where is the problem?
  flagged_zones_count: number;
  problem_zones: Array<{
    zone_code: string;
    issue: string;
    status: string;
  }>;

  // 3. What problem is occurring?
  primary_threat_type: string;
  disease_alert_summary?: string;
  pest_alert_summary?: string;

  // 4. Is it getting worse?
  temporal_velocity: string;

  // 5. Could it spread?
  potential_spread_risk_score: number;
  spread_risk_verdict: string;
  incoming_spread_corridors_count: number;

  // 6. Which area needs water?
  water_stress_priority_zones: string[];
  water_stress_summary: string;

  // 7. What should I do?
  actionable_recommendations: Array<{
    id: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    action: string;
    category: string;
  }>;

  // 8. When is the next monitoring mission?
  next_mission: {
    mission_code: string;
    drone_name: string;
    scheduled_time: string;
    target_zones: string[];
    sensor_payload: string;
    status: string;
  };

  active_layers: string[];
  evaluated_at: string;
}
