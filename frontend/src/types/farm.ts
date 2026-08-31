import { GeoJSONGeometry } from './index';

export interface CropCycleSummary {
  id: string;
  crop_name: string;
  scientific_name?: string;
  variety?: string;
  planting_date: string;
  expected_harvest_date?: string;
  status: string;
  target_yield?: number;
}

export interface Farm {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  owner_name?: string;
  boundary?: GeoJSONGeometry;
  center_point?: GeoJSONGeometry;
  total_area_hectares: number;
  soil_type?: string;
  irrigation_type?: string;
  farming_method?: string;
  address?: string;
  city?: string;
  region?: string;
  country: string;
  is_active: boolean;
  created_at: string;
  active_crop?: CropCycleSummary;
  zones_count: number;
}

export interface CropInfoInput {
  common_name: string;
  scientific_name?: string;
  variety?: string;
  planting_date: string;
  expected_harvest_date?: string;
  growth_stage?: string;
  target_yield_tonnes_per_hectare?: number;
}

export interface CreateFarmPayload {
  name: string;
  description?: string;
  boundary: GeoJSONGeometry | any;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  soil_type?: string;
  soil_ph?: number;
  irrigation_type?: string;
  farming_method?: string;
  crop_info?: CropInfoInput;
}

export interface UpdateFarmPayload {
  name?: string;
  description?: string;
  boundary?: GeoJSONGeometry | any;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  soil_type?: string;
  soil_ph?: number;
  irrigation_type?: string;
  farming_method?: string;
  is_active?: boolean;
}

export interface FarmListResponse {
  farms: Farm[];
  total: number;
  total_hectares: number;
}
