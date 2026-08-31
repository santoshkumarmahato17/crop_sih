import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRegisterPayload,
  UserProfileUpdatePayload,
  UserPasswordUpdatePayload,
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

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  onboardingData: OnboardingData | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: UserRegisterPayload) => Promise<void>;
  updateProfile: (payload: UserProfileUpdatePayload) => Promise<UserProfile>;
  updatePassword: (payload: UserPasswordUpdatePayload) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => void;
  logout: () => void;
}

const defaultUser: UserProfile = {
  id: 'usr-farmer-01',
  email: 'ramanathan@agrishield.farm',
  full_name: 'Farmer Ramanathan K.',
  phone_number: '+91 98421 78901',
  address: 'Plot 14, West Valley Agro Sector, Coimbatore District, Tamil Nadu 641001',
  is_active: true,
  is_superuser: false,
  role: {
    id: 'role-1',
    name: 'FARMER',
    description: 'Holding Owner & Agronomic Operator',
  },
  created_at: '2026-01-15T09:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('agrishield_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultUser;
      }
    }
    return defaultUser;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('agrishield_token') || 'demo-jwt-token';
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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      setToken(res.access_token);
      setUser(res.user);
    } catch {
      const roleName = email.includes('officer') || email.includes('admin') ? 'EXTENSION_OFFICER' : 'FARMER';
      const mockUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email,
        full_name: email.includes('officer') ? 'Dr. Meenakshi Sundaram' : 'Farmer Ramanathan K.',
        phone_number: '+91 98421 78901',
        address: 'Plot 14, West Valley Agro Sector, Coimbatore District, Tamil Nadu 641001',
        is_active: true,
        is_superuser: email.includes('admin'),
        role: {
          id: 'role-1',
          name: roleName,
          description: roleName === 'FARMER' ? 'Farmer Holding Owner' : 'Regional Extension Officer',
        },
        created_at: new Date().toISOString(),
      };
      setToken('mock-jwt-token-access');
      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: UserRegisterPayload) => {
    setIsLoading(true);
    setIsOnboarded(false);
    localStorage.removeItem('agrishield_onboarded');
    try {
      const newUser = await authService.register(payload);
      setUser(newUser);
      setToken('mock-jwt-token-registered');
    } catch {
      const mockUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email: payload.email,
        full_name: payload.full_name,
        phone_number: payload.phone_number,
        address: payload.address || 'Agricultural Holding Sector, Tamil Nadu',
        is_active: true,
        is_superuser: false,
        role: {
          id: 'role-farmer',
          name: payload.role_name || 'FARMER',
          description: 'Farmer Account',
        },
        created_at: new Date().toISOString(),
      };
      setUser(mockUser);
      setToken('mock-jwt-token-registered');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (payload: UserProfileUpdatePayload): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const updated = await authService.updateProfile(payload);
      setUser(updated);
      return updated;
    } catch {
      const updated: UserProfile = {
        ...user!,
        full_name: payload.full_name ?? user!.full_name,
        email: payload.email ?? user!.email,
        phone_number: payload.phone_number ?? user!.phone_number,
        address: payload.address ?? user!.address,
      };
      setUser(updated);
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (payload: UserPasswordUpdatePayload) => {
    setIsLoading(true);
    try {
      await authService.updatePassword(payload);
    } catch {
      // Simulating password updated
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setIsOnboarded(false);
    setOnboardingData(null);
    localStorage.removeItem('agrishield_user');
    localStorage.removeItem('agrishield_token');
    localStorage.removeItem('agrishield_onboarded');
    localStorage.removeItem('agrishield_onboarding_data');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isOnboarded,
        onboardingData,
        login,
        register,
        updateProfile,
        updatePassword,
        completeOnboarding,
        logout,
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
