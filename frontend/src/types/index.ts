/**
 * AGRI SHIELD — Shared Domain TypeScript Definitions.
 */

export * from './auth';
export * from './farm';
export * from './zone';
export * from './drone';
export * from './image';
export * from './ai';
export * from './temporal';
export * from './risk';
export * from './spread';
export * from './water_stress';
export * from './dashboard';
export * from './officer';
export * from './adaptive';
export * from './alert';
export * from './assistant';
export * from './community';

export type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';

export type AnomalyType = 'disease' | 'pest' | 'water_stress' | 'nutrient_deficiency' | 'weed_cluster';

export type HealthTrend = 'improving' | 'stable' | 'deteriorating';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon' | 'Point';
  coordinates: any;
}

export interface SubsystemHealthRecord {
  status: 'operational' | 'degraded' | 'unavailable' | 'configured';
  latency_ms?: number;
  details?: string;
}

export interface SystemHealthReport {
  system: string;
  version: string;
  environment: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  subsystems: Record<string, SubsystemHealthRecord>;
}
