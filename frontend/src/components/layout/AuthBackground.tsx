import React from 'react';

export const AuthBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-full w-full flex items-center justify-center overflow-x-hidden py-10 px-4 bg-surface-light dark:bg-surface-darkBg transition-colors duration-300">
      
      {/* Subtle Radial Accents for a premium look (instead of plain white) */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-agri-400/10 to-agri-500/0 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-accent-lime/5 to-agri-500/0 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ── Main Authentication Form Content ── */}
      <div className="relative z-10 w-full max-w-lg my-auto flex justify-center">
        {children}
      </div>
    </div>
  );
};
