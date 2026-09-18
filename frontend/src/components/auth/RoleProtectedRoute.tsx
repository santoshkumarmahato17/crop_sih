import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RoleType } from '@/types';
import { UnauthorizedPage } from '@/features/auth/UnauthorizedPage';

interface RoleProtectedRouteProps {
  allowedRoles: RoleType[];
  children: React.ReactElement;
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-agri-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono tracking-widest uppercase">Checking RBAC Permissions...</p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated users redirected to /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check if user's primary role is authorized for this route
  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return (
      <UnauthorizedPage
        requiredRole={allowedRoles.join(' or ')}
        message={`Your account role (${user.role}) is not authorized to access this section.`}
      />
    );
  }

  return children;
};
