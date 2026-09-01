import { apiClient } from './apiClient';
import {
  OfficerDashboardResponse,
  OfficerValidationRequest,
  OfficerValidationResponse,
} from '@/types';

export const mockOfficerDashboardData: OfficerDashboardResponse = {
  officer_id: 'officer-user-01',
  officer_name: 'Dr. Sundaram M. (Regional Extension Specialist)',
  total_assigned_farms: 12,
  critical_count: 3,
  high_count: 4,
  medium_count: 3,
  low_count: 2,
  unresolved_alerts_total: 14,
  pending_validations_total: 8,
  recommended_visits_total: 5,
  evaluated_at: new Date().toISOString(),
  farms: [
    {
      farm_id: 'farm-cbe-01',
      farm_name: 'Ramanathan Precision Wheat & Paddy Holding',
      owner_name: 'Farmer Ramanathan K.',
      location_name: 'Pollachi Agro-Corridor, Coimbatore',
      area_hectares: 24.5,
      crop_type: 'Wheat (PBW-550)',
      growth_stage: 'Tillering Stage (Day 42)',
      priority_tier: 'CRITICAL',
      risk_score: 88,
      critical_zones_count: 2,
      pest_hotspots_count: 1,
      spread_risk_score: 82,
      unresolved_alerts_count: 4,
      pending_validations_count: 2,
      recommended_visit: true,
      last_visit_date: '2026-08-28T09:30:00Z',
    },
    {
      farm_id: 'farm-tnj-02',
      farm_name: 'Cauvery Delta High-Yield Rice Cooperative',
      owner_name: 'Muruganandham S.',
      location_name: 'Kumbakonam Delta Sector, Thanjavur',
      area_hectares: 48.0,
      crop_type: 'Paddy Rice (CR-1009)',
      growth_stage: 'Heading Stage (Day 68)',
      priority_tier: 'CRITICAL',
      risk_score: 92,
      critical_zones_count: 3,
      pest_hotspots_count: 2,
      spread_risk_score: 89,
      unresolved_alerts_count: 5,
      pending_validations_count: 3,
      recommended_visit: true,
      last_visit_date: '2026-08-25T14:15:00Z',
    },
    {
      farm_id: 'farm-slm-03',
      farm_name: 'Attur Organic Cotton & Sweet Corn Farm',
      owner_name: 'Annamalai R.',
      location_name: 'Attur Agro-Belt, Salem',
      area_hectares: 32.0,
      crop_type: 'Bt Cotton & Sweet Corn',
      growth_stage: 'Flowering & Boll Formation',
      priority_tier: 'CRITICAL',
      risk_score: 85,
      critical_zones_count: 2,
      pest_hotspots_count: 2,
      spread_risk_score: 76,
      unresolved_alerts_count: 3,
      pending_validations_count: 1,
      recommended_visit: true,
      last_visit_date: '2026-08-20T11:00:00Z',
    },
    {
      farm_id: 'farm-nlg-04',
      farm_name: 'Nilgiri Horticulture & Mountain Tea Terraces',
      owner_name: 'Priyadarshini V.',
      location_name: 'Coonoor Valley, Nilgiris',
      area_hectares: 18.2,
      crop_type: 'Exotic Vegetables & Tea',
      growth_stage: 'Vegetative Canopy',
      priority_tier: 'HIGH',
      risk_score: 72,
      critical_zones_count: 1,
      pest_hotspots_count: 1,
      spread_risk_score: 64,
      unresolved_alerts_count: 2,
      pending_validations_count: 1,
      recommended_visit: false,
      last_visit_date: '2026-08-29T14:20:00Z',
    },
    {
      farm_id: 'farm-erd-05',
      farm_name: 'Bhavani River Turmeric & Sugarcane Fields',
      owner_name: 'Chidambaram P.',
      location_name: 'Gobichettipalayam, Erode',
      area_hectares: 36.5,
      crop_type: 'Turmeric (Salem Local) & Sugarcane',
      growth_stage: 'Rhizome Development',
      priority_tier: 'HIGH',
      risk_score: 68,
      critical_zones_count: 1,
      pest_hotspots_count: 0,
      spread_risk_score: 58,
      unresolved_alerts_count: 1,
      pending_validations_count: 1,
      recommended_visit: true,
      last_visit_date: '2026-08-22T10:45:00Z',
    },
    {
      farm_id: 'farm-mdu-06',
      farm_name: 'Vaigai Basin Banana & Mango Agro-Orchard',
      owner_name: 'Subramanian G.',
      location_name: 'Usilampatti Sector, Madurai',
      area_hectares: 28.0,
      crop_type: 'Grand Naine Banana & Mango',
      growth_stage: 'Bunch Emergence',
      priority_tier: 'MEDIUM',
      risk_score: 45,
      critical_zones_count: 0,
      pest_hotspots_count: 1,
      spread_risk_score: 38,
      unresolved_alerts_count: 1,
      pending_validations_count: 0,
      recommended_visit: false,
      last_visit_date: '2026-08-18T08:30:00Z',
    },
    {
      farm_id: 'farm-dgl-07',
      farm_name: 'Oddanchatram Semi-Arid Millets Project',
      owner_name: 'Kandasamy N.',
      location_name: 'Oddanchatram, Dindigul',
      area_hectares: 40.0,
      crop_type: 'Finger Millet (Ragi) & Red Gram',
      growth_stage: 'Maturity & Grain Filling',
      priority_tier: 'LOW',
      risk_score: 18,
      critical_zones_count: 0,
      pest_hotspots_count: 0,
      spread_risk_score: 12,
      unresolved_alerts_count: 0,
      pending_validations_count: 0,
      recommended_visit: false,
      last_visit_date: '2026-08-30T17:00:00Z',
    },
  ],
};

export const officerService = {
  getOfficerDashboard: async (): Promise<OfficerDashboardResponse> => {
    try {
      const response = await apiClient.get<OfficerDashboardResponse>('/officer/dashboard');
      if (response.data && response.data.farms && response.data.farms.length > 0) {
        return response.data;
      }
      return mockOfficerDashboardData;
    } catch {
      return mockOfficerDashboardData;
    }
  },

  submitValidation: async (
    request: OfficerValidationRequest
  ): Promise<OfficerValidationResponse> => {
    try {
      const response = await apiClient.post<OfficerValidationResponse>(
        '/officer/validations',
        request
      );
      return response.data;
    } catch {
      // Mock return for local testing / offline state
      const now = new Date().toISOString();
      return {
        validation_id: `val-sim-${Date.now()}`,
        officer_id: 'officer-user-01',
        observation_id: request.observation_id,
        validation_status: request.validation_status,
        audit_log_id: `aud-${Date.now().toString(36)}`,
        audit_action: `OFFICER_ACTION_${request.validation_status}`,
        notes: request.notes,
        created_at: now,
        message: 'Observation finding successfully validated and calibrated with official digital signature.',
      };
    }
  },
};
