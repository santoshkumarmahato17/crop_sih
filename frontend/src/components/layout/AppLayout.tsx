import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AgriculturalAssistantWidget } from '@/features/assistant/AgriculturalAssistantWidget';
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';
import { useAuth } from '@/context/AuthContext';

interface AppLayoutProps {
  systemStatus?: string;
  version?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  systemStatus = 'healthy',
  version = '0.1.0',
}) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const { user, isOnboarded } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isExplicitOnboardingPage = location.pathname === '/onboarding';
  const shouldShowOnboardingModal = user && !isOnboarded && !isAuthPage && !isExplicitOnboardingPage;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200 overflow-x-hidden">

      {/* 2. Frosted Glass Top Navigation Bar */}
      <div className="relative z-40">
        <Header
          systemStatus={systemStatus}
          version={version}
          onToggleSidebar={() => setIsSidebarVisible((prev) => !prev)}
        />
      </div>

      {/* 3. Main Body Container with Collapsible Glass Sidebar */}
      <div className="flex flex-1 relative z-10">
        {isSidebarVisible && <Sidebar />}

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-full">
          <Outlet />
        </main>
      </div>

      {/* 4. Floating AI Agricultural Assistant */}
      <div className="relative z-50">
        <AgriculturalAssistantWidget />
      </div>

      {/* 5. First-Time Registration Onboarding Setup Wizard Overlay */}
      {shouldShowOnboardingModal && <OnboardingWizard />}
    </div>
  );
};
