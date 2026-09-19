import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/onboarding';

  // Hide authenticated navigation, sidebar, and assistant on login/register pages
  const shouldShowAuthenticatedChrome = !isAuthPage && isAuthenticated;

  return (
    <div className="h-screen max-h-screen bg-surface-light dark:bg-surface-darkBg text-agri-900 dark:text-agri-50 flex flex-col selection:bg-agri-500 selection:text-white transition-colors duration-300 overflow-hidden">
      {/* 1. Fixed Stationary Header Bar */}
      {!isAuthPage && (
        <div className="relative z-40 shrink-0 w-full">
          <Header
            systemStatus={systemStatus}
            version={version}
            isMinimal={!shouldShowAuthenticatedChrome}
            onToggleSidebar={() => setIsMobileDrawerOpen((prev) => !prev)}
          />
        </div>
      )}

      {/* 2. Main Body Container with Stationary Sidebar & Independently Scrolling Main Area */}
      <div className="flex flex-1 min-h-0 relative z-10 min-w-0 overflow-hidden">
        {/* Desktop Fixed Sidebar (Stationary barrier on the left) */}
        {shouldShowAuthenticatedChrome && <Sidebar />}

        {/* Mobile Slide-Over Drawer with Backdrop (On screens < lg) */}
        {shouldShowAuthenticatedChrome && isMobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop Blur Overlay */}
            <div
              className="fixed inset-0 bg-agri-950/70 backdrop-blur-sm animate-fade-in transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-slide-in-left">
              <Sidebar isMobileDrawer onClose={() => setIsMobileDrawerOpen(false)} />
            </div>
          </div>
        )}

        {/* 3. Main Content Area (Only this square area scrolls upward/downward) */}
        <main
          className={`flex-1 max-w-full min-w-0 h-full overflow-y-auto ${
            isAuthPage
              ? 'p-0 flex items-center justify-center'
              : 'p-2.5 sm:p-6 md:p-8 pb-24 sm:pb-28 lg:pb-8'
          }`}
        >
          {isAuthPage ? (
            <AuthBackground>
              <Outlet />
            </AuthBackground>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* 4. Floating AI Agricultural Assistant */}
      {shouldShowAuthenticatedChrome && (
        <div className="relative z-50">
          <AgriculturalAssistantWidget />
        </div>
      )}

      {/* 5. Mobile Bottom Navigation Bar */}
      {shouldShowAuthenticatedChrome && (
        <MobileBottomNav
          onToggleMenu={() => setIsMobileDrawerOpen((prev) => !prev)}
          isMenuOpen={isMobileDrawerOpen}
        />
      )}
    </div>
  );
};
