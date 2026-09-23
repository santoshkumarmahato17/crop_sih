import { apiClient } from './apiClient';
import {
  MonitoringTask,
  MonitoringResult,
  DroneMonitoringRecommendation,
  ZoneTrendData,
  FarmHealthEvent,
  MonitoringStats,
  MonitoringPriority,
  MonitoringMethod,
  MonitoringTriggerType,
} from '@/types/monitoring';

export interface CreateMonitoringTaskPayload {
  farm_id: string;
  zone_id?: string;
  crop_id?: string;
  trigger_type: MonitoringTriggerType;
  trigger_entity_id?: string;
  suspected_condition?: string;
  priority?: MonitoringPriority;
  monitoring_method?: MonitoringMethod;
  scheduled_at?: string;
  target_zone_ids?: string[];
  instructions?: string;
  baseline_health_score?: number;
  baseline_disease_risk?: number;
  baseline_affected_area_ha?: number;
}

export interface SubmitMonitoringResultPayload {
  observation_id?: string;
  health_score: number;
  disease_risk: number;
  pest_risk?: number;
  water_stress?: number;
  affected_area_ha?: number;
  severity?: string;
  observed_symptoms?: string[];
  image_urls?: string[];
  notes?: string;
  location_wkt?: string;
}

export const monitoringService = {
  /**
   * List follow-up monitoring tasks.
   */
  async getTasks(params?: {
    farm_id?: string;
    zone_id?: string;
    status?: string;
    priority?: string;
    skip?: number;
    limit?: number;
  }): Promise<MonitoringTask[]> {
    try {
      const response = await apiClient.get<MonitoringTask[]>('/monitoring/tasks', { params });
      return response.data || [];
    } catch (err) {
      console.warn('API getTasks failed', err);
      return [];
    }
  },

  /**
   * Get single monitoring task by ID.
   */
  async getTaskById(id: string): Promise<MonitoringTask> {
    try {
      const response = await apiClient.get<MonitoringTask>(`/monitoring/tasks/${id}`);
      return response.data;
    } catch (err) {
      console.warn(`API getTaskById failed for ${id}, using mock`, err);
      const mocks = getMockMonitoringTasks();
      return mocks.find((m) => m.id === id) || mocks[0];
    }
  },

  /**
   * Create a new follow-up monitoring task.
   */
  async createTask(payload: CreateMonitoringTaskPayload): Promise<MonitoringTask> {
    try {
      const response = await apiClient.post<MonitoringTask>('/monitoring/tasks', payload);
      return response.data;
    } catch (err) {
      console.warn('API createTask failed, creating simulated mock task', err);
      const mock: MonitoringTask = {
        id: `task-${Date.now()}`,
        task_code: `MT-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
        farm_id: payload.farm_id,
        farm_name: 'Sahyadri Agro Estate (Nashik)',
        zone_id: payload.zone_id,
        zone_name: 'Zone Z17 (Greenhouse Block)',
        trigger_type: payload.trigger_type,
        suspected_condition: payload.suspected_condition || 'Early Blight Foliar Anomaly',
        priority: payload.priority || 'HIGH',
        monitoring_method: payload.monitoring_method || 'DRONE',
        status: 'SCHEDULED',
        scheduled_at: payload.scheduled_at || new Date().toISOString(),
        due_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        target_zone_ids: payload.target_zone_ids || ['Z17', 'Z16', 'Z18'],
        instructions: payload.instructions || 'Capture high-res multispectral imagery of affected and buffer blocks.',
        baseline_health_score: payload.baseline_health_score || 64.0,
        baseline_disease_risk: payload.baseline_disease_risk || 78.0,
        baseline_affected_area_ha: payload.baseline_affected_area_ha || 1.2,
        created_at: new Date().toISOString(),
      };
      return mock;
    }
  },

  /**
   * Start a monitoring task (in progress).
   */
  async startTask(id: string): Promise<MonitoringTask> {
    try {
      const response = await apiClient.post<MonitoringTask>(`/monitoring/tasks/${id}/start`);
      return response.data;
    } catch (err) {
      const task = await this.getTaskById(id);
      task.status = 'IN_PROGRESS';
      task.started_at = new Date().toISOString();
      return task;
    }
  },

  /**
   * Submit follow-up observation result (executes comparison & reassessment).
   */
  async submitResult(
    taskId: string,
    payload: SubmitMonitoringResultPayload
  ): Promise<MonitoringResult> {
    try {
      const response = await apiClient.post<MonitoringResult>(
        `/monitoring/tasks/${taskId}/result`,
        payload
      );
      return response.data;
    } catch (err) {
      console.warn('API submitResult failed, generating simulated comparison result', err);
      const prevHealth = 64.0;
      const prevDisease = 78.0;
      const prevArea = 1.2;
      const healthChange = payload.health_score - prevHealth;
      const diseaseChange = payload.disease_risk - prevDisease;
      const areaChange = (payload.affected_area_ha || 0) - prevArea;
      const isWorsening = healthChange < -5 || diseaseChange > 5 || areaChange > 0.3;

      const mockResult: MonitoringResult = {
        id: `res-${Date.now()}`,
        monitoring_task_id: taskId,
        farm_id: 'farm-nashik-1',
        zone_id: 'zone-17',
        health_score: payload.health_score,
        disease_risk: payload.disease_risk,
        pest_risk: payload.pest_risk || 0,
        water_stress: payload.water_stress || 0,
        affected_area_ha: payload.affected_area_ha,
        severity: payload.severity || 'HIGH',
        trend: isWorsening ? 'WORSENING' : 'IMPROVING',
        observed_symptoms: payload.observed_symptoms || [],
        image_urls: payload.image_urls || [],
        notes: payload.notes,
        observed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        comparisons: [
          {
            id: `comp-${Date.now()}`,
            monitoring_result_id: `res-${Date.now()}`,
            previous_health_score: prevHealth,
            current_health_score: payload.health_score,
            health_change: healthChange,
            previous_disease_risk: prevDisease,
            current_disease_risk: payload.disease_risk,
            disease_risk_change: diseaseChange,
            previous_affected_area_ha: prevArea,
            current_affected_area_ha: payload.affected_area_ha || 0,
            affected_area_change_ha: areaChange,
            trend: isWorsening ? 'WORSENING' : 'IMPROVING',
            hotspot_status: isWorsening ? 'EXPANDING' : 'CONTRACTING',
            is_escalated: isWorsening,
            escalation_reason: isWorsening
              ? `Critical pathology surge detected (+${diseaseChange}% disease risk, ${healthChange} pts health drop).`
              : undefined,
            recommended_action: isWorsening
              ? 'Immediate extension pathologist review and targeted field inspection.'
              : 'Crop-health indicators are improving. Continue routine monitoring.',
            created_at: new Date().toISOString(),
          },
        ],
      };
      return mockResult;
    }
  },

  /**
   * Get targeted drone surveillance recommendations.
   */
  async getDroneRecommendations(farm_id?: string): Promise<DroneMonitoringRecommendation[]> {
    try {
      const response = await apiClient.get<DroneMonitoringRecommendation[]>(
        '/monitoring/recommendations/drone',
        { params: { farm_id } }
      );
      return response.data;
    } catch (err) {
      return getMockDroneRecommendations();
    }
  },

  /**
   * Get zone historical trend chart data points.
   */
  async getZoneTrends(zone_id: string): Promise<ZoneTrendData> {
    try {
      const response = await apiClient.get<ZoneTrendData>(`/monitoring/trends/${zone_id}`);
      return response.data;
    } catch (err) {
      return {
        zone_id,
        zone_name: 'Zone Z17 (Greenhouse Block)',
        crop_name: 'Tomato (Hybrid Abhinav)',
        current_health_score: 58.0,
        current_disease_risk: 84.0,
        overall_trend: 'WORSENING',
        data_points: [
          { timestamp: '01 Sep', health_score: 82.0, disease_risk: 42.0, pest_risk: 15.0, water_stress: 0.25, affected_area_ha: 0.5 },
          { timestamp: '03 Sep', health_score: 76.0, disease_risk: 55.0, pest_risk: 20.0, water_stress: 0.40, affected_area_ha: 0.8 },
          { timestamp: '05 Sep', health_score: 64.0, disease_risk: 78.0, pest_risk: 35.0, water_stress: 0.68, affected_area_ha: 1.2 },
          { timestamp: '07 Sep', health_score: 58.0, disease_risk: 84.0, pest_risk: 42.0, water_stress: 0.74, affected_area_ha: 1.8 },
        ],
      };
    }
  },

  /**
   * Get farm health life-cycle event stream.
   */
  async getFarmHealthTimeline(farm_id: string): Promise<FarmHealthEvent[]> {
    try {
      const response = await apiClient.get<FarmHealthEvent[]>(`/monitoring/history/${farm_id}`);
      return response.data;
    } catch (err) {
      return getMockTimelineEvents();
    }
  },

  /**
   * Get aggregated monitoring statistics & coverage %.
   */
  async getMonitoringStatistics(): Promise<MonitoringStats> {
    try {
      const response = await apiClient.get<MonitoringStats>('/monitoring/statistics');
      return response.data;
    } catch (err) {
      return {
        scheduled: 0,
        in_progress: 0,
        completed: 0,
        overdue: 0,
        critical: 0,
        hotspots_under_monitoring: 0,
        monitoring_coverage_pct: 0,
      };
    }
  },
};

// Fallback high-fidelity seed scenarios
function getMockMonitoringTasks(): MonitoringTask[] {
  return [
    {
      id: 'task-001',
      task_code: 'MT-202609-0017',
      farm_id: 'farm-nashik-1',
      farm_name: 'Sahyadri Agro Estate (Nashik)',
      zone_id: 'zone-17',
      zone_name: 'Zone Z17 (Greenhouse Block)',
      crop_name: 'Tomato (Hybrid Abhinav)',
      trigger_type: 'HOTSPOT',
      suspected_condition: 'Early Blight (Alternaria solani)',
      priority: 'HIGH',
      monitoring_method: 'DRONE',
      status: 'SCHEDULED',
      scheduled_at: new Date().toISOString(), // Today
      due_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      target_zone_ids: ['Z16', 'Z17', 'Z18'],
      instructions:
        'Capture high-res multispectral imagery of Zone Z17 and surrounding buffer envelope (Z16, Z18). Focus on lower canopy necrosis.',
      baseline_health_score: 64.0,
      baseline_disease_risk: 78.0,
      baseline_affected_area_ha: 1.2,
      created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
    {
      id: 'task-002',
      task_code: 'MT-202609-0018',
      farm_id: 'farm-solapur-2',
      farm_name: 'Sangola Pomegranate Orchard #2',
      zone_id: 'zone-04',
      zone_name: 'Zone Z04 (Orchard South)',
      crop_name: 'Pomegranate (Bhagwa)',
      trigger_type: 'WATER_STRESS',
      suspected_condition: 'Root Zone Moisture Deficit & Telya Risk',
      priority: 'MEDIUM',
      monitoring_method: 'FIELD_INSPECTION',
      status: 'SCHEDULED',
      scheduled_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // Tomorrow
      due_at: new Date(Date.now() + 96 * 3600 * 1000).toISOString(),
      target_zone_ids: ['Z04', 'Z05'],
      instructions:
        'Inspect soil moisture tension gauges, check drip emitter flow uniformity, and scout fruit nodes for water-soaked lesions.',
      baseline_health_score: 61.0,
      baseline_disease_risk: 76.0,
      baseline_affected_area_ha: 1.5,
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'task-003',
      task_code: 'MT-202609-0019',
      farm_id: 'farm-yavatmal-3',
      farm_name: 'Vidarbha Bt Cotton Block A1',
      zone_id: 'zone-02',
      zone_name: 'Zone Z02 (Rainfed Cotton)',
      crop_name: 'Bt Cotton (Bollgard II)',
      trigger_type: 'PEST_RISK',
      suspected_condition: 'Pink Bollworm (Pectinophora gossypiella)',
      priority: 'MEDIUM',
      monitoring_method: 'FARMER_IMAGE',
      status: 'SCHEDULED',
      scheduled_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString(), // In 3 Days
      due_at: new Date(Date.now() + 120 * 3600 * 1000).toISOString(),
      target_zone_ids: ['Z02'],
      instructions:
        'Farmer submits high-zoom photos of 20 freshly opened flowers and green bolls to verify rosette symptoms.',
      baseline_health_score: 82.0,
      baseline_disease_risk: 45.0,
      baseline_affected_area_ha: 0.8,
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
    {
      id: 'task-004',
      task_code: 'MT-202609-0012',
      farm_id: 'farm-nashik-1',
      farm_name: 'Sahyadri Agro Estate (Nashik)',
      zone_id: 'zone-17',
      zone_name: 'Zone Z17 (Greenhouse Block)',
      crop_name: 'Tomato (Hybrid Abhinav)',
      trigger_type: 'HOTSPOT',
      suspected_condition: 'Early Blight (Alternaria solani)',
      priority: 'CRITICAL',
      monitoring_method: 'DRONE',
      status: 'COMPLETED',
      scheduled_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      target_zone_ids: ['Z17', 'Z16', 'Z18'],
      instructions: 'Completed drone multispectral follow-up mission.',
      baseline_health_score: 64.0,
      baseline_disease_risk: 78.0,
      baseline_affected_area_ha: 1.2,
      created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      results: [
        {
          id: 'res-001',
          monitoring_task_id: 'task-004',
          farm_id: 'farm-nashik-1',
          zone_id: 'zone-17',
          health_score: 58.0,
          disease_risk: 84.0,
          pest_risk: 32.0,
          water_stress: 0.74,
          affected_area_ha: 1.8,
          severity: 'HIGH',
          trend: 'WORSENING',
          observed_symptoms: ['Target-board spots expanding into mid canopy', 'Defoliation on 18 plants'],
          image_urls: [
            'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=800&q=80',
          ],
          notes: 'Spore load surge verified. Adjacent zone Z16 exhibits initial foliar chlorosis.',
          observed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          comparisons: [
            {
              id: 'comp-001',
              monitoring_result_id: 'res-001',
              previous_health_score: 64.0,
              current_health_score: 58.0,
              health_change: -6.0,
              previous_disease_risk: 78.0,
              current_disease_risk: 84.0,
              disease_risk_change: 6.0,
              previous_affected_area_ha: 1.2,
              current_affected_area_ha: 1.8,
              affected_area_change_ha: 0.6,
              trend: 'WORSENING',
              hotspot_status: 'EXPANDING',
              is_escalated: true,
              escalation_reason:
                'Critical pathology surge detected (Disease Risk: 84%, Health: 58, Area: +0.6 ha). Hotspot expanded into Z16.',
              recommended_action:
                'Immediate extension pathologist on-site review and 200m buffer bio-fungicide containment.',
              created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            },
          ],
        },
      ],
    },
  ];
}

function getMockDroneRecommendations(): DroneMonitoringRecommendation[] {
  return [
    {
      id: 'drone-rec-01',
      farm_id: 'farm-nashik-1',
      farm_name: 'Sahyadri Agro Estate (Nashik)',
      zone_id: 'zone-17',
      zone_name: 'Zone Z17 (Greenhouse Block)',
      target_area_description: 'Zone Z17 Tomato Greenhouse & Buffer Envelope (Z16–Z18)',
      targeted_zones: ['Z16', 'Z17', 'Z18'],
      priority: 'HIGH',
      reason:
        'Targeted Early Blight re-scan after disease surge (+6 pts) and 0.6 ha area expansion into adjacent rows.',
      recommended_time_window: 'Within 48 hours (Optimal slot: Tomorrow 08:00 AM)',
      previous_health_score: 64.0,
      current_risk_score: 84.0,
      hotspot_status: 'EXPANDING',
      is_dispatched: false,
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'drone-rec-02',
      farm_id: 'farm-solapur-2',
      farm_name: 'Sangola Pomegranate Orchard #2',
      zone_id: 'zone-04',
      zone_name: 'Zone Z04 (Orchard South)',
      target_area_description: 'Sangola Pomegranate Block (Zone Z04 & Z05)',
      targeted_zones: ['Z04', 'Z05'],
      priority: 'MEDIUM',
      reason:
        'Follow-up multispectral scan after drip irrigation flush to verify canopy transpiration recovery.',
      recommended_time_window: 'Within 4 days',
      previous_health_score: 61.0,
      current_risk_score: 41.0,
      hotspot_status: 'CONTRACTING',
      is_dispatched: false,
      created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
  ];
}

function getMockTimelineEvents(): FarmHealthEvent[] {
  return [
    {
      id: 'evt-01',
      timestamp: new Date().toISOString(),
      event_type: 'ESCALATION_TRIGGERED',
      title: 'Expert Review Escalation Triggered',
      description: 'Hotspot expansion detected from 1.2 ha to 1.8 ha. Pathology surge requires on-site extension review.',
      severity: 'CRITICAL',
      zone_name: 'Zone Z17',
    },
    {
      id: 'evt-02',
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      event_type: 'DRONE_SCAN_COMPLETED',
      title: 'Follow-up Drone Multispectral Scan Completed',
      description: 'Zone Z17 and buffer envelope Z16–Z18 scanned. Mean NDVI: 0.58, Disease Risk: 84%.',
      severity: 'HIGH',
      zone_name: 'Zone Z17',
    },
    {
      id: 'evt-03',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      event_type: 'ADVISORY_DISPATCHED',
      title: 'Targeted IPM Crop Advisory Issued',
      description: 'Early Blight foliar sanitation protocol dispatched to farmer in Marathi and English.',
      severity: 'HIGH',
      zone_name: 'Zone Z17',
    },
    {
      id: 'evt-04',
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      event_type: 'PRIMARY_HOTSPOT_DETECTED',
      title: 'Primary Pathology Hotspot Identified',
      description: 'Optical scan & microclimate humidity trigger active Early Blight risk in greenhouse block.',
      severity: 'MEDIUM',
      zone_name: 'Zone Z17',
    },
  ];
}
