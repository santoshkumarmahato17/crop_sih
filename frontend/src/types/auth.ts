export type RoleType = 'FARMER' | 'GOVERNMENT' | 'ADMIN';

export interface UserRole {
  id?: string;
  name: RoleType | string;
  description?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  address?: string;
  role: RoleType;
  permissions: string[];
  organization_name?: string;
  department?: string;
  assigned_region?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: UserProfile;
}

export interface UserRegisterPayload {
  email: string;
  password: string;
  confirm_password?: string;
  full_name: string;
  phone_number?: string;
  address?: string;
  role: 'FARMER' | 'GOVERNMENT';
  organization_name?: string;
  department?: string;
  assigned_region?: string;
}

export interface UserProfileUpdatePayload {
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  organization_name?: string;
  department?: string;
}

export interface UserPasswordUpdatePayload {
  current_password: string;
  new_password: string;
}
