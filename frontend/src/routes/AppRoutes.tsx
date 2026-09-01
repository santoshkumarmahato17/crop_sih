import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import { useAuth } from '@/context/AuthContext';

// Auth Pages
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { UnauthorizedPage } from '@/features/auth/UnauthorizedPage';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';
import { UserProfilePage } from '@/features/profile/UserProfilePage';
import { SettingsPage } from '@/features/settings/SettingsPage';

// Dashboards
import { FarmerDashboardPage } from '@/features/dashboard/FarmerDashboardPage';
import { GovernmentDashboardShell } from '@/features/government/GovernmentDashboardShell';
import { AdminDashboardShell } from '@/features/admin/AdminDashboardShell';
import { ExtensionOfficerDashboardPage } from '@/features/officer/ExtensionOfficerDashboardPage';

// Operational Modules
import { PhotoVideoUploadPage } from '@/features/imagery/PhotoVideoUploadPage';
import { AIDiseaseAnalysisPage } from '@/features/detection/AIDiseaseAnalysisPage';
import { SymptomDiseaseIdentificationPage } from '@/features/diagnosis/SymptomDiseaseIdentificationPage';
import { FarmerCommunityPage } from '@/features/community/FarmerCommunityPage';
import { FieldMapViewerPage } from '@/features/farms/FieldMapViewerPage';
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
import { EOSCreateFieldOnboarding } from '@/features/farms/EOSCreateFieldOnboarding';

/**
 * Root Index Dispatcher: Automatically routes authenticated user to their role's dashboard.
 */
const RootRoleRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <FarmerDashboardPage />;
  }
  if (user.role === 'ADMIN') {
    return <AdminDashboardShell />;
  }
  if (user.role === 'GOVERNMENT') {
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
        <Route path="unauthorized" element={<UnauthorizedPage />} />
        <Route path="onboarding" element={<OnboardingWizard />} />

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
          path="farmer/farms"
          element={
            <RoleProtectedRoute allowedRoles={['FARMER', 'ADMIN']}>
              <FieldMapViewerPage />
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
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="upload" element={<PhotoVideoUploadPage />} />
        <Route path="analysis" element={<AIDiseaseAnalysisPage />} />
        <Route path="diagnosis" element={<SymptomDiseaseIdentificationPage />} />
        <Route path="disease-identification" element={<SymptomDiseaseIdentificationPage />} />
        <Route path="community" element={<FarmerCommunityPage />} />
        <Route path="officer" element={<ExtensionOfficerDashboardPage />} />

        {/* Spatial Field Map & Precision Monitoring */}
        <Route path="field-map" element={<FieldMapViewerPage />} />
        <Route path="create-field" element={<EOSCreateFieldOnboarding />} />
        <Route path="onboarding/create-field" element={<EOSCreateFieldOnboarding />} />
        <Route path="farmer/create-field" element={<EOSCreateFieldOnboarding />} />
        <Route path="farms" element={<FieldMapViewerPage />} />
        <Route path="farms/list" element={<FarmsListPage />} />
        <Route path="farms/new" element={<EOSCreateFieldOnboarding />} />
        <Route path="farms/:id" element={<FarmDetailsPage />} />
        <Route path="farms/:id/edit" element={<EditFarmPage />} />

        {/* Drone Fleet & Missions */}
        <Route path="drones" element={<DronesListPage />} />
        <Route path="missions" element={<MissionsListPage />} />
        <Route path="missions/new" element={<CreateMissionPage />} />
        <Route path="missions/:id" element={<MissionDetailsPage />} />

        {/* Sub-module Aliases */}
        <Route path="zones" element={<FieldMapViewerPage />} />
        <Route path="observations" element={<AIDiseaseAnalysisPage />} />
        <Route path="spread" element={<ExtensionOfficerDashboardPage />} />

        {/* 404 Catch-all */}
        <Route
          path="*"
          element={
            <div className="max-w-md mx-auto py-16 px-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-lg font-mono font-bold">
                404
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Page Not Found</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The requested agricultural module or resource route does not exist.
              </p>
              <div className="pt-2">
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
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
