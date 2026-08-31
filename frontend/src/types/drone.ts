import { GeoJSONGeometry } from './index';

export type DroneOperationalStatus = 'AVAILABLE' | 'IN_MISSION' | 'MAINTENANCE' | 'CHARGING' | 'RETIRED';
export type MissionStatusType = 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type MissionPriorityType = 'NORMAL' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Drone {
  id: string;
  name: string;
  serial_number: string;
  manufacturer: string;
  model_name: string;
  camera_type: string;
  sensor_capabilities?: string[];
  battery_percentage: number;
  battery_cycle_count: number;
  operational_status: DroneOperationalStatus;
  status: string;
  created_at: string;
}

export interface DroneMission {
  id: string;
  farm_id: string;
  farm_name?: string;
  drone_id?: string;
  drone_name?: string;
  flight_boundary?: GeoJSONGeometry;
  target_zones?: string[];
  mission_date: string;
  start_time?: string;
  end_time?: string;
  altitude_meters: number;
  flight_speed_mps: number;
  overlap_percentage: number;
  coverage_percentage: number;
  priority: MissionPriorityType;
  status: MissionStatusType;
  created_at: string;
}

export interface CreateDronePayload {
  name: string;
  serial_number: string;
  manufacturer?: string;
  model_name: string;
  camera_type?: string;
  sensor_capabilities?: string[];
  battery_percentage?: number;
  operational_status?: DroneOperationalStatus;
}

export interface CreateMissionPayload {
  farm_id: string;
  drone_id?: string;
  target_zones?: string[];
  flight_boundary?: GeoJSONGeometry;
  mission_date: string;
  priority?: MissionPriorityType;
  altitude_meters?: number;
  flight_speed_mps?: number;
  overlap_percentage?: number;
}

export interface DroneListResponse {
  drones: Drone[];
  total: number;
}

export interface DroneMissionListResponse {
  missions: DroneMission[];
  total: number;
}
