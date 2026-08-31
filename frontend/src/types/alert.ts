export type AlertType =
  | 'DISEASE_DETECTED'
  | 'DISEASE_RISING'
  | 'PEST_DETECTED'
  | 'WATER_STRESS'
  | 'SPREAD_RISK'
  | 'DRONE_MISSION_COMPLETED'
  | 'FOLLOW_UP_MONITORING_REQUIRED'
  | 'EXPERT_VALIDATION_REQUIRED';

export type AlertSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertResponse {
  id: string;
  farm_id: string;
  farm_name?: string;
  zone_id?: string;
  zone_code?: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  alert_id?: string;
  channel: string;
  title: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  alert?: AlertResponse;
}

export interface NotificationCenterSummary {
  total_unread: number;
  critical_alerts_count: number;
  high_alerts_count: number;
  notifications: NotificationResponse[];
  evaluated_at: string;
}
