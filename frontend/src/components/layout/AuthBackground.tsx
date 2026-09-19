import React from 'react';

export const AuthBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-full w-full flex justify-center overflow-x-hidden py-10 px-4">
      {/* ── 1. High-Res Agricultural Crop Photography Background ── */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
        style={{
          backgroundImage: `url('/wheat-bg.jpg')`,
        }}
      />

      {/* ── 2. Dynamic Lighting & Glass Scrim Overlays (Light & Dark Mode) ── */}
      {/* Light Mode: Lush green agriculture veil */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-agri-900/50 via-agri-800/30 to-agri-950/40 dark:hidden backdrop-blur-[2px]" />

      {/* Dark Mode: Deep green night veil */}
      <div className="absolute inset-0 z-0 hidden dark:block bg-gradient-to-tr from-agri-950/95 via-agri-950/88 to-agri-900/90 backdrop-blur-[3px]" />

      {/* Radial Green Accent Light */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-agri-400/20 to-agri-500/0 rounded-full blur-3xl pointer-events-none z-0 animate-pulse-soft" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-accent-lime/15 to-agri-500/0 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Precision GIS Field Grid Lines Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-10 dark:opacity-15 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(47, 133, 90, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(47, 133, 90, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Left Circle — WALL-E */}
      <div className="hidden md:block absolute -left-10 lg:left-4 top-1/2 -translate-y-1/2 z-0 pointer-events-none select-none opacity-90 dark:opacity-60 transition-all duration-700 animate-fade-in">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72 rounded-full overflow-hidden shadow-2xl shadow-agri-900/40 border-4 border-agri-400/30 dark:border-agri-500/20">
          <img
            src="/circle-left.jpg"
            alt="WALL-E holding plant"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right Circle — EVE */}
      <div className="hidden lg:block absolute -right-10 lg:right-4 top-1/2 -translate-y-1/2 z-0 pointer-events-none select-none opacity-90 dark:opacity-60 transition-all duration-700 animate-fade-in">
        <div className="relative w-48 h-48 lg:w-72 lg:h-72 rounded-full overflow-hidden shadow-2xl shadow-agri-900/30 border-4 border-agri-400/25 dark:border-agri-500/15">
          <img
            src="/circle-right.jpg"
            alt="EVE robot"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ── 4. Main Authentication Form Content ── */}
      <div className="relative z-10 w-full max-w-lg my-auto">
        {children}
      </div>
    </div>
  );
};
