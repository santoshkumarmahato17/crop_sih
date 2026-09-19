import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { useAuth } from '@/context/AuthContext';

// Auth Pages
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { UnauthorizedPage } from '@/features/auth/UnauthorizedPage';
import { GoogleCallbackPage } from '@/features/auth/GoogleCallbackPage';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';
import { UserProfilePage } from '@/features/profile/UserProfilePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { GovernmentPendingPage } from '@/features/auth/GovernmentPendingPage';

// Dashboards
import { FarmerDashboardPage } from '@/features/dashboard/FarmerDashboardPage';
import { GovernmentDashboardShell } from '@/features/government/GovernmentDashboardShell';
import { AdminDashboardShell } from '@/features/admin/AdminDashboardShell';
import { GovernmentApprovalPage } from '@/features/admin/GovernmentApprovalPage';
import { ExtensionOfficerDashboardPage } from '@/features/officer/ExtensionOfficerDashboardPage';
import ExtensionDashboard from '@/features/extension/ExtensionDashboard';

// Operational Modules
import { TomatoCameraAnalysisPage } from '@/features/detection/TomatoCameraAnalysisPage';
import { SymptomDiseaseIdentificationPage } from '@/features/diagnosis/SymptomDiseaseIdentificationPage';
import { FarmerCommunityPage } from '@/features/community/FarmerCommunityPage';
import { FarmsListPage } from '@/features/farms/FarmsListPage';
import { FarmDetailsPage } from '@/features/farms/FarmDetailsPage';
import { EditFarmPage } from '@/features/farms/EditFarmPage';
import { DronesListPage } from '@/features/drones/DronesListPage';
import { MissionsListPage } from '@/features/drones/MissionsListPage';
import { CreateMissionPage } from '@/features/drones/CreateMissionPage';
import { MissionDetailsPage } from '@/features/drones/MissionDetailsPage';

// Multilingual Advisories & Expert Validation & Follow-up Monitoring Modules
import { AdvisoriesPage } from '@/features/advisories/AdvisoriesPage';
import { ExpertValidationPage } from '@/features/validation/ExpertValidationPage';
import { MonitoringWorkspacePage } from '@/features/monitoring/MonitoringWorkspacePage';

/**
 * Root Index Dispatcher: Automatically routes authenticated user to their role's dashboard,
 * or guides new / unauthenticated users to the Login / Register procedure.
 */
const RootRoleRedirect: React.FC = () => {
  const { user, isAuthenticated, isOnboarded } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'FARMER' && !isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  if (user.role === 'ADMIN') {
    return <AdminDashboardShell />;
  }
  if (user.role === 'GOVERNMENT') {
    if (!user.is_verified) {
      return <Navigate to="/government/pending" replace />;
    }
    if (user.department === 'EXTENSION_WORKER') {
      return <ExtensionDashboard />;
    }
    return <GovernmentDashboardShell />;
  }
  return <FarmerDashboardPage />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* ── Dynamic Index Dispatcher ── */}
        <Route index element={<RootRoleRedirect />} />
        <Route path="dashboard" element={<RootRoleRedirect />} />

        {/* ── Public Auth & Error Routes ── */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="unauthorized" element={<UnauthorizedPage />} />
        <Route path="auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="onboarding" element={<OnboardingWizard />} />
        <Route path="government/pending" element={<GovernmentPendingPage />} />

        {/* ── FARMER Role Routes ── */}
        <Route
          path="farmer/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <FarmerDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="farmer/crop-health"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <SymptomDiseaseIdentificationPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="farmer/drones"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <DronesListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="advisories"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <AdvisoriesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="farmer/advisories"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <AdvisoriesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="validation"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN', 'FARMER']}>
              <ExpertValidationPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="government/validation"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <ExpertValidationPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="monitoring"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <MonitoringWorkspacePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="farmer/monitoring"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <MonitoringWorkspacePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="government/monitoring"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <MonitoringWorkspacePage />
            </RoleProtectedRoute>
          }
        />

        {/* ── EXTENSION WORKER Role Routes ── */}
        <Route
          path="extension/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['EXTENSION_WORKER', 'ADMIN', 'GOVERNMENT']}>
              <ExtensionDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* ── GOVERNMENT Role Routes ── */}
        <Route
          path="government/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <GovernmentDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="government/regional"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <GovernmentDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="government/disease-hotspots"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <ExtensionOfficerDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="government/pest-hotspots"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <ExtensionOfficerDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="government/water-stress"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <ExtensionOfficerDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="government/spread-risk"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <ExtensionOfficerDashboardPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="government/analytics"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <GovernmentDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="government/reports"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <GovernmentDashboardShell />
            </RoleProtectedRoute>
          }
        />

        {/* ── ADMIN Role Routes ── */}
        <Route
          path="admin/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/farmers"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/government-users"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/government-approvals"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <GovernmentApprovalPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/system"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/ai-models"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/drones"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardShell />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="admin/settings"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardShell />
            </RoleProtectedRoute>
          }
        />

        {/* ── Shared Operations & Diagnostics ── */}
        <Route
          path="profile"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <UserProfilePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <SettingsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="upload"
          element={<Navigate to="/analysis" replace />}
        />
        <Route
          path="analysis"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <TomatoCameraAnalysisPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="tomato-camera"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <TomatoCameraAnalysisPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="diagnosis"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <SymptomDiseaseIdentificationPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="disease-identification"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <SymptomDiseaseIdentificationPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="community"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <FarmerCommunityPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="officer"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <ExtensionOfficerDashboardPage />
            </RoleProtectedRoute>
          }
        />

        {/* Spatial Field Map & Precision Monitoring */}
        <Route
          path="farms/list"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <FarmsListPage />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="farms/:id"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <FarmDetailsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="farms/:id/edit"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <EditFarmPage />
            </RoleProtectedRoute>
          }
        />

        {/* Drone Fleet & Missions */}
        <Route
          path="drones"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <DronesListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="missions"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <MissionsListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="missions/new"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <CreateMissionPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="missions/:id"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <MissionDetailsPage />
            </RoleProtectedRoute>
          }
        />

        {/* Sub-module Aliases */}
        <Route
          path="observations"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'GOVERNMENT', 'ADMIN']}>
              <TomatoCameraAnalysisPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="spread"
          element={
            <RoleProtectedRoute allowedRoles={['GOVERNMENT', 'ADMIN']}>
              <ExtensionOfficerDashboardPage />
            </RoleProtectedRoute>
          }
        />

        {/* 404 Catch-all */}
        <Route
          path="*"
          element={
            <div className="max-w-md mx-auto py-16 px-6 text-center rounded-2xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 space-y-4 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-agri-500/10 text-agri-600 dark:text-agri-400 mx-auto flex items-center justify-center text-lg font-mono font-bold">
                404
              </div>
              <h2 className="text-xl font-bold text-agri-900 dark:text-white">Page Not Found</h2>
              <p className="text-xs text-agri-500/70 dark:text-agri-400/70 leading-relaxed">
                The requested agricultural module or resource route does not exist.
              </p>
              <div className="pt-2">
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-agri-500 hover:bg-agri-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Return to Dashboard
                </a>
              </div>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};
