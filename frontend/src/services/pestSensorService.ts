import { apiClient } from './apiClient';

export interface PestObservation {
  id: string;
  farmId: string;
  zoneId: string;
  crop: string;
  pestType: string;
  trapId: string;
  observationDate: string;
  pestCount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
  isSimulated?: boolean;
}

export interface SensorData {
  farmId: string;
  zoneId: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  rainfall: number;
  leafWetness: string;
  windSpeed: number;
  mode?: string;
  sensorStatus?: string;
  lastUpdated?: string;
  isSimulated?: boolean;
}

const DEFAULT_OBSERVATIONS: PestObservation[] = [
  {
    id: 'demo-obs-1',
    farmId: 'Green Valley Farm',
    zoneId: 'Zone A',
    crop: 'Tomato',
    pestType: 'Whitefly',
    trapId: 'TRAP-001',
    observationDate: '19 Sep 2026',
    pestCount: 42,
    riskLevel: 'HIGH',
    notes: 'Increasing pest activity observed on lower leaves',
    isSimulated: true,
  },
  {
    id: 'demo-obs-2',
    farmId: 'Green Valley Farm',
    zoneId: 'Zone A',
    crop: 'Tomato',
    pestType: 'Whitefly',
    trapId: 'TRAP-001',
    observationDate: '18 Sep 2026',
    pestCount: 27,
    riskLevel: 'MEDIUM',
    notes: 'Moderate yellow sticky trap counts',
    isSimulated: true,
  },
  {
    id: 'demo-obs-3',
    farmId: 'Green Valley Farm',
    zoneId: 'Zone A',
    crop: 'Tomato',
    pestType: 'Whitefly',
    trapId: 'TRAP-001',
    observationDate: '17 Sep 2026',
    pestCount: 12,
    riskLevel: 'MEDIUM',
    notes: 'Initial trap deployment observation',
    isSimulated: true,
  },
];

export const pestSensorService = {
  submitPestObservation: async (payload: Partial<PestObservation>): Promise<PestObservation> => {
    try {
      const response = await apiClient.post<PestObservation>('/sensors/pest-observations', payload);
      return response.data;
    } catch (err) {
      const isDemo = localStorage.getItem('kisan_sathi_demo_mode') === 'true';
      if (!isDemo) {
        throw new Error('Unable to connect to server');
      }
      const count = payload.pestCount ?? 0;
      const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
        count <= 10 ? 'LOW' : count <= 30 ? 'MEDIUM' : 'HIGH';

      return {
        id: `obs-${Date.now()}`,
        farmId: payload.farmId || 'Green Valley Farm',
        zoneId: payload.zoneId || 'Zone A',
        crop: payload.crop || 'Tomato',
        pestType: payload.pestType || 'Whitefly',
        trapId: payload.trapId || 'TRAP-001',
        observationDate: payload.observationDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        pestCount: count,
        riskLevel,
        notes: payload.notes || 'Observed via KISAN SATHI console',
        isSimulated: true,
      };
    }
  },

  getPestObservations: async (farmId?: string): Promise<PestObservation[]> => {
    try {
      const response = await apiClient.get<PestObservation[]>('/sensors/pest-observations', {
        params: { farm_id: farmId },
      });
      if (response.data) {
        return response.data;
      }
    } catch (err) {
      const isDemo = localStorage.getItem('kisan_sathi_demo_mode') === 'true';
      if (isDemo) {
        return DEFAULT_OBSERVATIONS;
      }
      throw new Error('Unable to connect to server');
    }
    return [];
  },

  submitSensorData: async (payload: Partial<SensorData>): Promise<SensorData> => {
    try {
      const response = await apiClient.post<SensorData>('/sensors/sensor-data', payload);
      return response.data;
    } catch (err) {
      const isDemo = localStorage.getItem('kisan_sathi_demo_mode') === 'true';
      if (!isDemo) {
        throw new Error('Unable to connect to server');
      }
      return {
        farmId: payload.farmId || 'Green Valley Farm',
        zoneId: payload.zoneId || 'Zone A',
        temperature: payload.temperature ?? 29.0,
        humidity: payload.humidity ?? 78.0,
        soilMoisture: payload.soilMoisture ?? 42.0,
        rainfall: payload.rainfall ?? 12.0,
        leafWetness: payload.leafWetness || 'High',
        windSpeed: payload.windSpeed ?? 8.0,
        mode: 'Demo Mode - Simulated Data',
        sensorStatus: 'Online',
        lastUpdated: 'Just now',
        isSimulated: true,
      };
    }
  },

  getSensorData: async (farmId?: string, zoneId?: string): Promise<SensorData> => {
    try {
      const response = await apiClient.get<SensorData>('/sensors/sensor-data', {
        params: { farm_id: farmId, zone_id: zoneId },
      });
      return response.data;
    } catch (err) {
      const isDemo = localStorage.getItem('kisan_sathi_demo_mode') === 'true';
      if (!isDemo) {
        throw new Error('Unable to connect to server');
      }
      return {
        farmId: farmId || 'Green Valley Farm',
        zoneId: zoneId || 'Zone A',
        temperature: 29.0,
        humidity: 78.0,
        soilMoisture: 42.0,
        rainfall: 12.0,
        leafWetness: 'High',
        windSpeed: 8.0,
        mode: 'Demo Mode - Simulated Data',
        sensorStatus: 'Online',
        lastUpdated: '2 minutes ago',
        isSimulated: true,
      };
    }
  },
};
