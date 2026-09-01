import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AuthBackground } from './AuthBackground';
import { AgriculturalAssistantWidget } from '@/features/assistant/AgriculturalAssistantWidget';
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
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/onboarding';

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

      {/* 2. Main Body Container with Conditional Sidebar & Background */}
      <div className="flex flex-1 relative z-10">
        {shouldShowAuthenticatedChrome && isSidebarVisible && <Sidebar />}

        <main className={`flex-1 max-w-full ${isAuthPage ? 'p-0 flex items-center justify-center' : 'p-4 sm:p-6 md:p-8 overflow-y-auto'}`}>
          {isAuthPage ? (
            <AuthBackground>
              <Outlet />
            </AuthBackground>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* 3. Floating AI Agricultural Assistant (Only after logging in) */}
      {shouldShowAuthenticatedChrome && (
        <div className="relative z-50">
          <AgriculturalAssistantWidget />
        </div>
      )}
    </div>
  );
};
