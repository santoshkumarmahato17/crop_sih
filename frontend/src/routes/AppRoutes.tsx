import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FarmerDashboardPage } from '@/features/dashboard/FarmerDashboardPage';
import { ExtensionOfficerDashboardPage } from '@/features/officer/ExtensionOfficerDashboardPage';
import { PhotoVideoUploadPage } from '@/features/imagery/PhotoVideoUploadPage';
import { AIDiseaseAnalysisPage } from '@/features/detection/AIDiseaseAnalysisPage';
import { SymptomDiseaseIdentificationPage } from '@/features/diagnosis/SymptomDiseaseIdentificationPage';
import { FarmerCommunityPage } from '@/features/community/FarmerCommunityPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { UserProfilePage } from '@/features/profile/UserProfilePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { FieldMapViewerPage } from '@/features/farms/FieldMapViewerPage';
import { FarmsListPage } from '@/features/farms/FarmsListPage';
import { CreateFarmPage } from '@/features/farms/CreateFarmPage';
import { FarmDetailsPage } from '@/features/farms/FarmDetailsPage';
import { EditFarmPage } from '@/features/farms/EditFarmPage';
import { DronesListPage } from '@/features/drones/DronesListPage';
import { MissionsListPage } from '@/features/drones/MissionsListPage';
import { CreateMissionPage } from '@/features/drones/CreateMissionPage';
import { MissionDetailsPage } from '@/features/drones/MissionDetailsPage';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* Default Dashboard & Core Operations */}
        <Route index element={<FarmerDashboardPage />} />
        <Route path="dashboard" element={<FarmerDashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="onboarding" element={<OnboardingWizard />} />
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
        <Route path="farms" element={<FieldMapViewerPage />} />
        <Route path="farms/list" element={<FarmsListPage />} />
        <Route path="farms/new" element={<CreateFarmPage />} />
        <Route path="farms/:id" element={<FarmDetailsPage />} />
        <Route path="farms/:id/edit" element={<EditFarmPage />} />

        {/* Drone Fleet & Autonomous Mission Management Routes */}
        <Route path="drones" element={<DronesListPage />} />
        <Route path="missions" element={<MissionsListPage />} />
        <Route path="missions/new" element={<CreateMissionPage />} />
        <Route path="missions/:id" element={<MissionDetailsPage />} />

        {/* Sub-module Aliases & Clean Route Mapping */}
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
