import { apiClient } from './apiClient';
import {
  CreateDronePayload,
  CreateMissionPayload,
  Drone,
  DroneListResponse,
  DroneMission,
  DroneMissionListResponse,
} from '@/types';

export const droneService = {
  // Drones
  listDrones: async (skip: number = 0, limit: number = 50): Promise<DroneListResponse> => {
    const response = await apiClient.get<DroneListResponse>('/drones', {
      params: { skip, limit },
    });
    return response.data;
  },

  registerDrone: async (payload: CreateDronePayload): Promise<Drone> => {
    const response = await apiClient.post<Drone>('/drones', payload);
    return response.data;
  },

  // Missions
  listMissions: async (
    farmId?: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<DroneMissionListResponse> => {
    const response = await apiClient.get<DroneMissionListResponse>('/drone-missions', {
      params: { farm_id: farmId, skip, limit },
    });
    return response.data;
  },

  createMission: async (payload: CreateMissionPayload): Promise<DroneMission> => {
    const response = await apiClient.post<DroneMission>('/drone-missions', payload);
    return response.data;
  },

  getMission: async (missionId: string): Promise<DroneMission> => {
    const response = await apiClient.get<DroneMission>(`/drone-missions/${missionId}`);
    return response.data;
  },

  startMission: async (missionId: string): Promise<DroneMission> => {
    const response = await apiClient.post<DroneMission>(`/drone-missions/${missionId}/start`);
    return response.data;
  },

  completeMission: async (missionId: string): Promise<DroneMission> => {
    const response = await apiClient.post<DroneMission>(`/drone-missions/${missionId}/complete`);
    return response.data;
  },
};
