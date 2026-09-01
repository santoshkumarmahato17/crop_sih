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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* 1. Header Bar (Clean Minimal Mode during Login/Register) */}
      <div className="relative z-40">
        <Header
          systemStatus={systemStatus}
          version={version}
          isMinimal={!shouldShowAuthenticatedChrome}
          onToggleSidebar={() => setIsMobileDrawerOpen((prev) => !prev)}
        />
      </div>

      {/* 2. Main Body Container with Desktop Sidebar & Mobile Drawer */}
      <div className="flex flex-1 relative z-10 min-w-0">
        {/* Desktop Sidebar (Only visible on lg+ screens) */}
        {shouldShowAuthenticatedChrome && <Sidebar />}

        {/* Mobile Slide-Over Drawer with Backdrop (On screens < lg) */}
        {shouldShowAuthenticatedChrome && isMobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop Blur Overlay */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <Sidebar isMobileDrawer onClose={() => setIsMobileDrawerOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area (With bottom padding for mobile navigation bar) */}
        <main
          className={`flex-1 max-w-full min-w-0 ${
            isAuthPage
              ? 'p-0 flex items-center justify-center'
              : 'p-3 sm:p-6 md:p-8 pb-28 lg:pb-8 overflow-y-auto'
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

      {/* 3. Floating AI Agricultural Assistant */}
      {shouldShowAuthenticatedChrome && (
        <div className="relative z-50">
          <AgriculturalAssistantWidget />
        </div>
      )}

      {/* 4. Mobile Bottom Navigation Bar (High-Speed Thumb Access) */}
      {shouldShowAuthenticatedChrome && (
        <MobileBottomNav
          onToggleMenu={() => setIsMobileDrawerOpen((prev) => !prev)}
          isMenuOpen={isMobileDrawerOpen}
        />
      )}
    </div>
  );
};
