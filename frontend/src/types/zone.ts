import { GeoJSONGeometry } from './index';

export type ZoneHealthStatus = 'healthy' | 'moderate_concern' | 'high_concern' | 'critical';
export type ZoneRiskStatus = 'low' | 'moderate' | 'elevated' | 'severe';
export type ZoneMonitoringStatus = 'active' | 'paused' | 'under_inspection';

export interface Zone {
  id: string;
  farm_id: string;
  zone_code: string;
  name: string;
  crop_cycle_id?: string;
  boundary?: GeoJSONGeometry;
  centroid?: GeoJSONGeometry;
  area_hectares: number;
  monitoring_status: ZoneMonitoringStatus;
  health_status: ZoneHealthStatus;
  risk_status: ZoneRiskStatus;
  is_active: boolean;
  created_at: string;
}

export interface ZoneGeneratePayload {
  target_zone_count?: number;
  grid_size_meters?: number;
  link_active_crop?: boolean;
}

export interface ZoneListResponse {
  farm_id: string;
  farm_name: string;
  total: number;
  total_area_hectares: number;
  zones: Zone[];
}
