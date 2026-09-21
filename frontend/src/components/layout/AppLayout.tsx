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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const { isAuthenticated, showLocationModal } = useAuth();
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/onboarding';

  // Hide authenticated navigation, sidebar, and assistant on login/register pages
  const shouldShowAuthenticatedChrome = !isAuthPage && isAuthenticated;
  const shouldShowSidebar = shouldShowAuthenticatedChrome && !showLocationModal;

  return (
    <div className="h-screen max-h-screen bg-slate-50 dark:bg-[#121011] text-slate-900 dark:text-[#d8cbcf] flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200 overflow-hidden">
      {/* 1. Fixed Header Bar with Top-Left Hamburger Toggle */}
      {!isAuthPage && (
        <div className="relative z-40 shrink-0 w-full">
          <Header
            systemStatus={systemStatus}
            version={version}
            isMinimal={!shouldShowAuthenticatedChrome}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
        </div>
      )}

      {/* 2. Main Body Container with Collapsible Desktop Sidebar & Mobile Drawer */}
      <div className="flex flex-1 min-h-0 relative z-10 min-w-0 overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        {shouldShowSidebar && (
          <aside
            className={`hidden lg:block shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden ${
              isSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 border-none pointer-events-none'
            }`}
          >
            <Sidebar />
          </aside>
        )}

        {/* Mobile Slide-Over Drawer with Backdrop (On screens < lg) */}
        {shouldShowSidebar && isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop Blur Overlay */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sliding Drawer Container */}
            <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-slide-in-left">
              <Sidebar onClose={() => setIsSidebarOpen(false)} isMobileDrawer={true} />
            </div>
          </div>
        )}

        {/* 3. Main Content Area (Only this square area scrolls upward/downward) */}
        <main
          className={`flex-1 max-w-full min-w-0 h-full overflow-y-auto transition-all duration-300 ease-in-out ${
            isAuthPage
              ? 'p-0'
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
          onToggleMenu={() => setIsSidebarOpen((prev) => !prev)}
          isMenuOpen={isSidebarOpen}
        />
      )}
    </div>
  );
};
