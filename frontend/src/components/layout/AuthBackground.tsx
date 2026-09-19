import React from 'react';
import { Sprout, Plane, Droplets, Sparkles } from 'lucide-react';

export const AuthBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden py-8 px-4 bg-agri-50 dark:bg-agri-950 transition-colors duration-700">
      
      {/* ── 1. Premium Dynamic Mesh Gradient Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft radial gradients acting as dynamic light sources */}
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-agri-300/30 to-agri-500/10 dark:from-agri-800/40 dark:to-agri-900/10 blur-[120px] animate-pulse-soft mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-accent-lime/20 to-teal-400/5 dark:from-accent-lime/10 dark:to-teal-900/20 blur-[100px] animate-pulse-soft mix-blend-multiply dark:mix-blend-screen" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-[30%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-gradient-to-tr from-sky-400/15 to-agri-400/10 dark:from-sky-900/20 dark:to-agri-800/10 blur-[140px] animate-pulse-soft mix-blend-multiply dark:mix-blend-screen" style={{ animationDelay: '4s' }} />
      </div>

      {/* ── 2. Precision GIS Field Grid Lines Overlay ── */}
      <div
        className="absolute inset-0 z-0 opacity-20 dark:opacity-25 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(47, 133, 90, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(47, 133, 90, 0.15) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Subtle scanline effect for technical feel */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

      {/* ── 3. Floating Abstract Geometric Elements ── */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-agri-300/40 dark:border-agri-700/30 rounded-full z-0 opacity-50 animate-spin-slow pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 border border-agri-300/30 dark:border-agri-700/20 rounded-full z-0 opacity-40 animate-spin-slow pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '40s' }} />

      {/* ── 4. Floating Precision Agriculture Telemetry Badges (Desktop) ── */}
      {/* Top Left Badge */}
      <div className="hidden xl:flex absolute top-16 left-12 z-10 p-3.5 rounded-2xl bg-white/70 dark:bg-surface-darkCard/70 backdrop-blur-2xl border border-white/40 dark:border-agri-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] items-center gap-3 animate-fade-in-up hover:scale-105 transition-transform duration-300">
        <div className="p-2.5 rounded-xl bg-agri-500/15 text-agri-600 dark:text-agri-400 border border-agri-500/25 shadow-sm">
          <Sprout className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-agri-900 dark:text-agri-50">Lush Crop Canopy</p>
          <p className="text-[10px] text-agri-600 dark:text-agri-400 font-mono font-bold">NDVI 0.88 • Optimal Health</p>
        </div>
      </div>

      {/* Bottom Left Badge */}
      <div className="hidden xl:flex absolute bottom-20 left-16 z-10 p-3.5 rounded-2xl bg-white/70 dark:bg-surface-darkCard/70 backdrop-blur-2xl border border-white/40 dark:border-agri-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] items-center gap-3 animate-fade-in-up hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.15s' }}>
        <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 shadow-sm">
          <Plane className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-agri-900 dark:text-agri-50">Autonomous Drone Fleet</p>
          <p className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-bold">Multispectral Telemetry Synced</p>
        </div>
      </div>

      {/* Top Right Badge */}
      <div className="hidden xl:flex absolute top-24 right-16 z-10 p-3.5 rounded-2xl bg-white/70 dark:bg-surface-darkCard/70 backdrop-blur-2xl border border-white/40 dark:border-agri-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] items-center gap-3 animate-fade-in-up hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.3s' }}>
        <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-agri-900 dark:text-agri-50">Gemini AI Agronomist</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">Precision Disease Diagnostics</p>
        </div>
      </div>

      {/* Bottom Right Badge */}
      <div className="hidden xl:flex absolute bottom-24 right-20 z-10 p-3.5 rounded-2xl bg-white/70 dark:bg-surface-darkCard/70 backdrop-blur-2xl border border-white/40 dark:border-agri-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] items-center gap-3 animate-fade-in-up hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.45s' }}>
        <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/25 shadow-sm">
          <Droplets className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-agri-900 dark:text-agri-50">Smart Water Defense</p>
          <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold">CWSI 0.22 • Hydrated Soils</p>
        </div>
      </div>

      {/* ── 5. Main Authentication Form Content ── */}
      <div className="relative z-10 w-full max-w-lg">
        {children}
      </div>
    </div>
  );
};
