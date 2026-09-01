import { apiClient } from './apiClient';
import {
  ExpertValidationRequest,
  ValidationStats,
  LabReferral,
  ValidationPriority,
} from '@/types/validation';

export interface CreateValidationRequestPayload {
  analysis_id?: string;
  farm_id: string;
  zone_id?: string;
  crop_id?: string;
  priority?: ValidationPriority;
  reason: string;
  suspected_condition: string;
  ai_confidence?: number;
  crop_growth_stage?: string;
  symptoms?: string[];
  image_urls?: string[];
  weather_summary?: Record<string, any>;
  hotspot_id?: string;
  drone_observation_id?: string;
}

export interface SubmitDecisionPayload {
  decision: 'CONFIRMED' | 'REJECTED' | 'UNCERTAIN' | 'LAB_REFERRAL';
  confirmed_condition?: string;
  expert_notes?: string;
  farmer_guidance?: string;
  rejection_reason?: string;
  uncertain_recommendation?: string;
}

export interface CreateLabReferralPayload {
  sample_type?: string;
  suspected_condition: string;
  reason: string;
}

export const validationService = {
  /**
   * Fetch list of validation requests (scoped to farmer's cases or all government cases).
   */
  async getValidationRequests(params?: {
    status?: string;
    priority?: string;
    farm_id?: string;
    skip?: number;
    limit?: number;
  }): Promise<ExpertValidationRequest[]> {
    try {
      const response = await apiClient.get<ExpertValidationRequest[]>('/validation/requests', {
        params,
      });
      return response.data;
    } catch (err) {
      console.warn('API getValidationRequests failed, returning fallback mock cases', err);
      return getMockValidationRequests();
    }
  },

  /**
   * Fetch single validation request by ID with all evidence snapshots.
   */
  async getValidationRequestById(id: string): Promise<ExpertValidationRequest> {
    try {
      const response = await apiClient.get<ExpertValidationRequest>(`/validation/requests/${id}`);
      return response.data;
    } catch (err) {
      console.warn(`API getValidationRequestById failed for ${id}, using mock`, err);
      const mocks = getMockValidationRequests();
      return mocks.find((m) => m.id === id) || mocks[0];
    }
  },

  /**
   * Farmer or Officer requests human expert validation.
   */
  async createValidationRequest(
    payload: CreateValidationRequestPayload
  ): Promise<ExpertValidationRequest> {
    try {
      const response = await apiClient.post<ExpertValidationRequest>(
        '/validation/requests',
        payload
      );
      return response.data;
    } catch (err) {
      console.warn('API createValidationRequest failed, simulating creation', err);
      const mock: ExpertValidationRequest = {
        id: `val-${Date.now()}`,
        case_number: `EV-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
        farm_id: payload.farm_id,
        farm_name: 'Sahyadri Agro Estate (Plot A)',
        zone_id: payload.zone_id,
        zone_name: 'Zone Z17 (Tomato Crop Block)',
        priority: payload.priority || 'HIGH',
        status: 'PENDING',
        reason: payload.reason,
        suspected_condition: payload.suspected_condition,
        ai_confidence: payload.ai_confidence || 0.78,
        crop_growth_stage: payload.crop_growth_stage || 'Flowering & Fruiting Stage',
        symptoms: payload.symptoms || ['Leaf spots with concentric rings', 'Marginal chlorosis'],
        image_urls: payload.image_urls || [
          'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
        ],
        weather_summary: {
          temperature_c: 27.5,
          humidity_pct: 84,
          rainfall_mm: 12.0,
          disease_risk_level: 'HIGH',
        },
        hotspot_id: 'HS-001 (Nashik North Corridor)',
        requested_by: 'current-user-id',
        created_at: new Date().toISOString(),
      };
      return mock;
    }
  },

  /**
   * Extension Officer / Pathologist submits ground-truth decision.
   */
  async submitDecision(
    requestId: string,
    payload: SubmitDecisionPayload
  ): Promise<ExpertValidationRequest> {
    try {
      const response = await apiClient.post<ExpertValidationRequest>(
        `/validation/${requestId}/decision`,
        payload
      );
      return response.data;
    } catch (err) {
      console.warn('API submitDecision failed, updating mock', err);
      const mock = await this.getValidationRequestById(requestId);
      mock.status = payload.decision;
      mock.completed_at = new Date().toISOString();
      return mock;
    }
  },

  /**
   * Order Laboratory Referral Testing.
   */
  async createLabReferral(
    requestId: string,
    payload: CreateLabReferralPayload
  ): Promise<LabReferral> {
    try {
      const response = await apiClient.post<LabReferral>(
        `/validation/${requestId}/lab-referral`,
        payload
      );
      return response.data;
    } catch (err) {
      console.warn('API createLabReferral failed, simulating lab referral', err);
      return {
        id: `lab-${Date.now()}`,
        referral_code: `LAB-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
        validation_request_id: requestId,
        farm_id: 'demo-farm',
        sample_type: payload.sample_type || 'Leaf Tissue Sample',
        suspected_condition: payload.suspected_condition,
        reason: payload.reason,
        status: 'REQUESTED',
        requested_at: new Date().toISOString(),
      };
    }
  },

  /**
   * Fetch queue metrics & statistics.
   */
  async getValidationStatistics(): Promise<ValidationStats> {
    try {
      const response = await apiClient.get<ValidationStats>('/validation/statistics');
      return response.data;
    } catch (err) {
      return {
        total_pending: 17,
        high_priority: 5,
        critical: 2,
        my_assigned: 6,
        recently_validated: 28,
        lab_referrals: 3,
      };
    }
  },
};

// Fallback high-fidelity mock validation queue
function getMockValidationRequests(): ExpertValidationRequest[] {
  return [
    {
      id: 'val-001',
      case_number: 'EV-00017',
      farm_id: 'farm-nashik-1',
      farm_name: 'Sahyadri Agro Farm (Nashik)',
      zone_id: 'zone-17',
      zone_name: 'Zone Z17 (Greenhouse Block)',
      crop_name: 'Tomato (Hybrid Abhinav)',
      priority: 'HIGH',
      status: 'PENDING',
      reason: 'AI confidence is 78% with high humidity and active hotspot expansion in cluster Z16–Z18.',
      suspected_condition: 'Early Blight (Alternaria solani)',
      ai_confidence: 0.78,
      crop_growth_stage: 'Flowering & Fruiting Stage',
      symptoms: ['Target-board leaf spots', 'Foliar chlorosis', 'Stem collar browning'],
      image_urls: [
        'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80',
      ],
      weather_summary: {
        temperature_c: 26.8,
        humidity_pct: 86,
        rainfall_mm: 14.5,
        disease_risk_level: 'HIGH',
      },
      hotspot_id: 'HS-001 (Nashik North Corridor)',
      drone_observation_id: 'drone-scan-788',
      requested_by: 'usr-farmer-1',
      requester_name: 'Suresh Patil (Farmer)',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'val-002',
      case_number: 'EV-00018',
      farm_id: 'farm-solapur-2',
      farm_name: 'Sangola Pomegranate Orchard #2',
      zone_id: 'zone-04',
      zone_name: 'Zone Z04 (Orchard South)',
      crop_name: 'Pomegranate (Bhagwa)',
      priority: 'CRITICAL',
      status: 'UNDER_REVIEW',
      reason: 'Bacterial Blight / Telya oily black node spots detected on primary fruit-bearing branches.',
      suspected_condition: 'Bacterial Blight (Telya / Xanthomonas)',
      ai_confidence: 0.89,
      crop_growth_stage: 'Mrig Bahar Fruit Sizing',
      symptoms: ['Oily water-soaked spots on rind', 'Stem cankers with gumming', 'Leaf shedding'],
      image_urls: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
      ],
      weather_summary: {
        temperature_c: 31.0,
        humidity_pct: 78,
        rainfall_mm: 8.0,
        disease_risk_level: 'CRITICAL',
      },
      hotspot_id: 'HS-003 (Solapur-Sangli Belt)',
      requested_by: 'usr-farmer-2',
      requester_name: 'Ganesh Deshmukh (Farmer)',
      assigned_expert_name: 'Dr. Sundaram (Regional Pathologist)',
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'val-003',
      case_number: 'EV-00019',
      farm_id: 'farm-yavatmal-3',
      farm_name: 'Vidarbha Bt Cotton Block A1',
      zone_id: 'zone-02',
      zone_name: 'Zone Z02 (Rainfed Cotton)',
      crop_name: 'Bt Cotton (Bollgard II)',
      priority: 'HIGH',
      status: 'CONFIRMED',
      reason: 'Pink Bollworm entry holes and rosette flowers spotted during drone multispectral pass.',
      suspected_condition: 'Pink Bollworm (Pectinophora gossypiella)',
      ai_confidence: 0.84,
      crop_growth_stage: 'Boll Formation Stage',
      symptoms: ['Rosetted flowers', 'Interlocular feeding damage', 'Premature boll opening'],
      image_urls: [
        'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80',
      ],
      weather_summary: {
        temperature_c: 29.2,
        humidity_pct: 74,
        rainfall_mm: 2.0,
        disease_risk_level: 'HIGH',
      },
      requested_by: 'usr-officer-1',
      requester_name: 'Yavatmal Agri Extension Office',
      assigned_expert_name: 'Dr. Rajesh Shinde (Entomologist)',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
  ];
}
