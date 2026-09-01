import React from 'react';
import { Sprout, Plane, Droplets, Sparkles } from 'lucide-react';

export const AuthBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center overflow-hidden py-8 px-4">
      {/* ── 1. High-Res Agricultural Crop Photography Background ── */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
        style={{
          backgroundImage: `url('/wheat-bg.jpg')`,
        }}
      />

      {/* ── 2. Dynamic Lighting & Glass Scrim Overlays (Light & Dark Mode) ── */}
      {/* Light Mode: Lush green sunlit crop veil */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-emerald-950/40 via-emerald-900/25 to-slate-900/35 dark:hidden backdrop-blur-[2px]" />

      {/* Dark Mode: Deep high-tech agro-night veil with emerald glow */}
      <div className="absolute inset-0 z-0 hidden dark:block bg-gradient-to-tr from-slate-950/92 via-slate-950/85 to-emerald-950/85 backdrop-blur-[3px]" />

      {/* Radial Sunbeam / Bioluminescent Agro Accent Light */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-emerald-400/25 to-teal-500/0 rounded-full blur-3xl pointer-events-none z-0 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-lime-400/20 to-emerald-500/0 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Precision GIS Field Grid Lines Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-15 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(16, 185, 129, 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.25) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── 3. Prominent Circular Agricultural Crop & Produce Artworks ── */}
      {/* Primary Floating Crop Mandala (Left / Center Accent) */}
      <div className="absolute -left-16 sm:left-4 lg:left-12 top-1/2 -translate-y-1/2 z-0 pointer-events-none select-none opacity-85 dark:opacity-60 transition-all duration-700 animate-in fade-in zoom-in-95">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-[420px] lg:h-[420px] rounded-full overflow-hidden shadow-2xl shadow-emerald-900/50 border-4 border-emerald-400/40 dark:border-emerald-500/30 backdrop-blur-sm">
          <img
            src="/crop-circle-bg.png"
            alt="Agricultural Crop Mandala"
            className="w-full h-full object-cover transform hover:scale-105 transition duration-1000"
          />
          {/* Subtle Ambient Radial Green Glow */}
          <div className="absolute inset-0 bg-radial from-transparent via-emerald-950/10 to-emerald-900/30 pointer-events-none" />
        </div>
      </div>

      {/* Secondary Crop Mandala (Right Background Accent) */}
      <div className="hidden lg:block absolute -right-16 lg:right-10 top-1/2 -translate-y-1/2 z-0 pointer-events-none select-none opacity-70 dark:opacity-45 transition-all duration-700 animate-in fade-in zoom-in-95">
        <div className="relative w-72 h-72 lg:w-96 lg:h-96 rounded-full overflow-hidden shadow-2xl shadow-emerald-900/40 border-4 border-emerald-400/30 dark:border-emerald-500/20 backdrop-blur-sm">
          <img
            src="/crop-circle-bg.png"
            alt="Organic Crop Botanical Artwork"
            className="w-full h-full object-cover scale-105 transform -rotate-12"
          />
          <div className="absolute inset-0 bg-radial from-transparent via-emerald-950/10 to-emerald-900/30 pointer-events-none" />
        </div>
      </div>

      {/* ── 4. Floating Precision Agriculture Telemetry Badges (Desktop) ── */}
      {/* Top Left Badge */}
      <div className="hidden xl:flex absolute top-12 left-10 z-10 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-xl items-center gap-3 animate-in fade-in slide-in-from-left-6 duration-700">
        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm">
          <Sprout className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Lush Crop Canopy</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">NDVI 0.88 • Optimal Health</p>
        </div>
      </div>

      {/* Bottom Left Badge */}
      <div className="hidden xl:flex absolute bottom-12 left-10 z-10 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-xl items-center gap-3 animate-in fade-in slide-in-from-left-6 duration-700">
        <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 shadow-sm">
          <Plane className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Autonomous Drone Fleet</p>
          <p className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-bold">Multispectral Telemetry Synced</p>
        </div>
      </div>

      {/* Top Right Badge */}
      <div className="hidden xl:flex absolute top-12 right-10 z-10 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-xl items-center gap-3 animate-in fade-in slide-in-from-right-6 duration-700">
        <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Gemini AI Agronomist</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold">Precision Disease Diagnostics</p>
        </div>
      </div>

      {/* Bottom Right Badge */}
      <div className="hidden xl:flex absolute bottom-12 right-10 z-10 p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-xl items-center gap-3 animate-in fade-in slide-in-from-right-6 duration-700">
        <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 shadow-sm">
          <Droplets className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">Smart Water Defense</p>
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
