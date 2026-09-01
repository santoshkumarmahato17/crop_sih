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
  const { user, isAuthenticated, isOnboarded } = useAuth();
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/onboarding';

  const isExplicitOnboardingPage = location.pathname === '/onboarding';
  const shouldShowOnboardingModal =
    isAuthenticated && user && !isOnboarded && !isAuthPage && !isExplicitOnboardingPage;

  // Hide authenticated navigation, sidebar, and assistant on login/register pages
  const shouldShowAuthenticatedChrome = !isAuthPage && isAuthenticated;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* 1. Header Bar (Clean Minimal Mode during Login/Register) */}
      <div className="relative z-40">
        <Header
          systemStatus={systemStatus}
          version={version}
          isMinimal={!shouldShowAuthenticatedChrome}
          onToggleSidebar={() => setIsSidebarVisible((prev) => !prev)}
        />
      </div>

      {/* 2. Main Body Container with Conditional Sidebar */}
      <div className="flex flex-1 relative z-10">
        {shouldShowAuthenticatedChrome && isSidebarVisible && <Sidebar />}

        <main
          className={`flex-1 overflow-y-auto max-w-full ${
            isAuthPage
              ? 'flex items-center justify-center p-4 sm:p-8 min-h-[calc(100vh-4rem)]'
              : 'p-4 sm:p-6 md:p-8'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {/* 3. Floating AI Agricultural Assistant (Only after logging in) */}
      {shouldShowAuthenticatedChrome && (
        <div className="relative z-50">
          <AgriculturalAssistantWidget />
        </div>
      )}

      {/* 4. First-Time Registration Onboarding Setup Wizard Overlay */}
      {shouldShowOnboardingModal && <OnboardingWizard />}
    </div>
  );
};
