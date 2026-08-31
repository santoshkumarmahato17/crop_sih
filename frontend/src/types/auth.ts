export interface UserRole {
  id: string;
  name: 'FARMER' | 'EXTENSION_OFFICER' | 'AGRICULTURE_ADMIN' | 'SYSTEM_ADMIN' | string;
  description?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  address?: string;
  is_active: boolean;
  is_superuser: boolean;
  role?: UserRole;
  created_at: string;
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
  full_name: string;
  phone_number?: string;
  address?: string;
  role_name?: string;
}

export interface UserProfileUpdatePayload {
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
}

export interface UserPasswordUpdatePayload {
  current_password: string;
  new_password: string;
}
