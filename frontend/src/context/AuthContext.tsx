import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRegisterPayload,
  UserProfileUpdatePayload,
  UserPasswordUpdatePayload,
  RoleType,
} from '@/types';
import { authService } from '@/services/authService';

export interface OnboardingData {
  language: string;
  crops: string[];
  soilType: string;
  permissions: {
    location: boolean;
    notifications: boolean;
    camera: boolean;
    video: boolean;
  };
}

export const normalizeRole = (role: any): RoleType => {
  if (!role) return 'FARMER';
  if (typeof role === 'string') {
    const upper = role.toUpperCase().trim();
    if (upper === 'ADMIN' || upper === 'SYSTEM_ADMIN') return 'ADMIN';
    if (upper === 'GOVERNMENT' || upper === 'EXTENSION_OFFICER' || upper === 'AGRICULTURE_ADMIN') return 'GOVERNMENT';
    return 'FARMER';
  }
  if (typeof role === 'object' && role.name) {
    return normalizeRole(role.name);
  }
  return 'FARMER';
};

export const normalizeUser = (user: any): UserProfile | null => {
  if (!user) return null;
  const role = normalizeRole(user.role);
  return {
    ...user,
    id: user.id || 'usr-default',
    email: user.email || 'farmer@agrishield.farm',
    full_name: user.full_name || 'Agricultural Operator',
    role,
    permissions: Array.isArray(user.permissions)
      ? user.permissions
      : [
          'FARM_VIEW',
          'FARM_CREATE',
          'FARM_EDIT',
          'CROP_VIEW',
          'CROP_MANAGE',
          'DRONE_VIEW',
          'DISEASE_VIEW',
          'DISEASE_ANALYZE',
          'ALERT_VIEW',
          'REPORT_VIEW',
          'AI_ASSISTANT_USE',
        ],
    is_active: user.is_active !== undefined ? user.is_active : true,
    is_verified: user.is_verified !== undefined ? user.is_verified : true,
    created_at: user.created_at || new Date().toISOString(),
  };
};

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: RoleType | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  onboardingData: OnboardingData | null;
  login: (email: string, password: string) => Promise<RoleType>;
  register: (payload: UserRegisterPayload) => Promise<RoleType>;
  updateProfile: (payload: UserProfileUpdatePayload) => Promise<UserProfile>;
  updatePassword: (payload: UserPasswordUpdatePayload) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => void;
  logout: () => void;
  hasRole: (roles: RoleType | RoleType[]) => boolean;
  hasPermission: (permission: string) => boolean;
  getRoleDashboardPath: (role?: any) => string;
}

const defaultFarmerUser: UserProfile = {
  id: 'usr-farmer-01',
  email: 'ramanathan@agrishield.farm',
  full_name: 'Farmer Ramanathan K.',
  phone_number: '+91 98421 78901',
  address: 'Plot 14, West Valley Agro Sector, Coimbatore District, Tamil Nadu',
  role: 'FARMER',
  permissions: [
    'FARM_VIEW',
    'FARM_CREATE',
    'FARM_EDIT',
    'CROP_VIEW',
    'CROP_MANAGE',
    'DRONE_VIEW',
    'DISEASE_VIEW',
    'DISEASE_ANALYZE',
    'ALERT_VIEW',
    'REPORT_VIEW',
    'AI_ASSISTANT_USE',
  ],
  is_active: true,
  is_verified: true,
  created_at: '2026-01-15T09:00:00Z',
};

export const getRoleDashboardPath = (role?: any): string => {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'GOVERNMENT':
      return '/government/dashboard';
    case 'FARMER':
    default:
      return '/farmer/dashboard';
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('agrishield_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return normalizeUser(parsed);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('agrishield_token') || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('agrishield_onboarded') === 'true';
  });

  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(() => {
    const saved = localStorage.getItem('agrishield_onboarding_data');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('agrishield_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('agrishield_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('agrishield_token', token);
    } else {
      localStorage.removeItem('agrishield_token');
    }
  }, [token]);

  const completeOnboarding = (data: OnboardingData) => {
    setIsOnboarded(true);
    setOnboardingData(data);
    localStorage.setItem('agrishield_onboarded', 'true');
    localStorage.setItem('agrishield_onboarding_data', JSON.stringify(data));
  };

  const login = async (email: string, password: string): Promise<RoleType> => {
    setIsLoading(true);
    try {
      const authData = await authService.login(email, password);
      const cleanUser = normalizeUser(authData.user);
      if (!cleanUser) {
        throw new Error('Invalid user account format returned by server.');
      }
      setUser(cleanUser);
      setToken(authData.access_token);
      setIsOnboarded(true);
      localStorage.setItem('agrishield_onboarded', 'true');
      return cleanUser.role;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: UserRegisterPayload): Promise<RoleType> => {
    setIsLoading(true);
    try {
      const newUser = await authService.register(payload);
      // Automatically log in newly registered account to acquire JWT session token
      const authData = await authService.login(payload.email, payload.password);
      const cleanUser = normalizeUser(authData.user) || normalizeUser(newUser);
      if (!cleanUser) {
        throw new Error('Registration completed, but profile could not be loaded.');
      }
      setUser(cleanUser);
      setToken(authData.access_token);
      setIsOnboarded(false);
      localStorage.setItem('agrishield_onboarded', 'false');
      return cleanUser.role;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (payload: UserProfileUpdatePayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const updated = await authService.updateProfile(payload);
      const cleanUser = normalizeUser(updated) || defaultFarmerUser;
      setUser(cleanUser);
      return cleanUser;
    } catch {
      if (user) {
        const localUpdated: UserProfile = {
          ...user,
          ...payload,
        };
        const cleanUser = normalizeUser(localUpdated) || defaultFarmerUser;
        setUser(cleanUser);
        return cleanUser;
      }
      throw new Error('User not found');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (payload: UserPasswordUpdatePayload): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.updatePassword(payload);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      authService.logout();
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('agrishield_user');
    localStorage.removeItem('agrishield_token');
  };

  const hasRole = (roles: RoleType | RoleType[]): boolean => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles.map(normalizeRole) : [normalizeRole(roles)];
    return allowed.includes(normalizeRole(user.role));
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (normalizeRole(user.role) === 'ADMIN') return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? normalizeRole(user.role) : null,
        permissions: user?.permissions || [],
        isAuthenticated: !!user && !!token,
        isLoading,
        isOnboarded,
        onboardingData,
        login,
        register,
        updateProfile,
        updatePassword,
        completeOnboarding,
        logout,
        hasRole,
        hasPermission,
        getRoleDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
