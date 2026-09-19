import React, { useState, useEffect } from 'react';
import { Layers, Image as ImageIcon, BarChart2, Calendar, Radio } from 'lucide-react';
import { satelliteService } from '@/services/apiClient';

interface FarmSatelliteViewerProps {
  farmId: string;
}

export const FarmSatelliteViewer: React.FC<FarmSatelliteViewerProps> = ({ farmId }) => {
  const [activeLayer, setActiveLayer] = useState<'true_color' | 'ndvi' | 'ndwi'>('ndvi');
  const [imagery, setImagery] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (farmId) {
      loadSatelliteData();
    }
  }, [farmId, activeLayer]);

  const loadSatelliteData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [imgData, statsData] = await Promise.all([
        satelliteService.getFarmImagery(farmId, activeLayer),
        satelliteService.getFarmStats(farmId, 30)
      ]);
      setImagery(imgData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load satellite data', err);
      setError('Failed to load satellite data. Please check if coordinates are valid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-agri-900/60 border border-slate-800 space-y-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div>
            <h3 className="font-bold text-agri-100 text-sm">Satellite Field Intelligence</h3>
            <p className="text-[10px] text-agri-400/70 font-mono">Sentinel-2 L2A (10m Resolution)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveLayer('true_color')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeLayer === 'true_color'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-700 text-agri-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>True Color</span>
          </button>
          <button
            onClick={() => setActiveLayer('ndvi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeLayer === 'ndvi'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-700 text-agri-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>NDVI</span>
          </button>
          <button
            onClick={() => setActiveLayer('ndwi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeLayer === 'ndwi'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-700 text-agri-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>NDWI</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-agri-400 text-sm font-mono animate-pulse">
          Connecting to Sentinel Hub...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-rose-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Raster Image Viewer */}
          <div className="col-span-1 relative h-64 sm:h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
            {imagery && (
              <>
                <img
                  src={`data:${imagery.content_type};base64,${imagery.data}`}
                  alt="Satellite Raster"
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur border border-white/10 rounded-md text-[10px] text-white font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{imagery.date}</span>
                </div>
                {imagery.is_mock && (
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-yellow-500/20 backdrop-blur border border-yellow-500/50 text-yellow-400 rounded-md text-[10px] font-bold uppercase">
                    Demo Mode (Mock)
                  </div>
                )}
              </>
            )}
          </div>

          {/* Time Series Statistics */}
          <div className="col-span-1 lg:col-span-2 flex flex-col space-y-4 h-64 sm:h-80">
            <h4 className="text-xs font-bold text-agri-300 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>30-Day Mean NDVI Trajectory</span>
            </h4>
            
            {stats && stats.series && stats.series.length > 0 ? (
              <div className="flex-1 w-full flex items-end gap-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
                {stats.series.map((point: any, idx: number) => {
                  const heightPct = Math.max(10, (point.mean / 1.0) * 100);
                  const color = point.mean > 0.6 ? 'bg-emerald-500' : point.mean > 0.3 ? 'bg-yellow-500' : 'bg-orange-500';
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                      <div className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80" style={{ height: `${heightPct}%`, backgroundColor: color.replace('bg-', 'var(--tw-colors-') + ')' }} className={color}></div>
                      <span className="text-[9px] text-agri-400/50 font-mono rotate-45 origin-left mt-2 whitespace-nowrap">
                        {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      
                      {/* Tooltip */}
                      <div className="absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition">
                        NDVI: {point.mean.toFixed(3)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-agri-500/50 text-xs">
                No time-series data available for the selected period.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
