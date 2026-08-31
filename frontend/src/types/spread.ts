export interface NeighborFarmDetail {
  farm_id: string;
  farm_name: string;
  distance_km: number;
  crop_type: string;
  growth_stage: string;
  latitude: number;
  longitude: number;
  is_downwind: boolean;
  active_threat_level: string;
}

export interface NeighborsResponse {
  target_farm_id: string;
  target_farm_name: string;
  search_radius_km: number;
  total_neighbors: number;
  neighbors: NeighborFarmDetail[];
}

export interface SpreadRiskEdgeDetail {
  source_farm_id: string;
  source_farm_name: string;
  target_farm_id: string;
  target_farm_name: string;
  distance_km: number;
  wind_alignment_factor: number;
  crop_similarity_score: number;
  estimated_spread_risk: number; // 0-100
  spread_risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source_pathogen: string;
  estimated_arrival_days?: number;
  explanation: string;
}

export interface SpreadRiskGraphResponse {
  farm_id: string;
  farm_name: string;
  overall_spread_threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  max_estimated_spread_risk: number;
  incoming_risk_edges: SpreadRiskEdgeDetail[];
  wind_parameters: {
    direction_degrees: number;
    speed_kmh: number;
    compass_heading: string;
  };
  disclaimer: string;
}

export interface RegionalHotspotDetail {
  hotspot_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  active_outbreaks_count: number;
  dominant_pathogen: string;
  hotspot_severity_level: 'MODERATE' | 'HIGH' | 'CRITICAL';
  affected_farms_count: number;
}

export interface RegionalHotspotsResponse {
  total_hotspots: number;
  evaluated_at: string;
  hotspots: RegionalHotspotDetail[];
}
