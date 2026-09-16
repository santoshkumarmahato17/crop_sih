import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Search, Map as MapIcon, Filter, CheckSquare } from 'lucide-react';
import { MaplibreGISViewer } from './MaplibreGISViewer';
import { FarmPolygonZone } from './LiveSatelliteGISMap';

// Mock Data structure for the Sidebar
interface Parcel {
  id: string;
  name: string;
  area: number;
  crop: string;
  cropIcon: string;
  polygonPoints: [number, number][];
  healthStatus: 'HEALTHY' | 'MODERATE_STRESS' | 'HIGH_RISK' | 'CRITICAL';
}

interface FarmGroup {
  id: string;
  name: string;
  parcels: Parcel[];
  isExpanded: boolean;
}

export const FieldMapViewerPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>('parcel-a');

  // Farm Groups State
  const [farmGroups, setFarmGroups] = useState<FarmGroup[]>([
    {
      id: 'farm-1',
      name: 'Greenfield Farm',
      isExpanded: true,
      parcels: [
        {
          id: 'parcel-a',
          name: 'Parcel A',
          area: 6.7,
          crop: 'Maize',
          cropIcon: '🌽',
          healthStatus: 'HEALTHY',
          polygonPoints: [[30, 20], [45, 22], [42, 38], [28, 35]],
        },
        {
          id: 'parcel-b',
          name: 'Parcel B',
          area: 3.2,
          crop: 'Grapes',
          cropIcon: '🍇',
          healthStatus: 'HEALTHY',
          polygonPoints: [[48, 22], [65, 25], [62, 40], [45, 38]],
        },
        {
          id: 'parcel-c',
          name: 'Parcel C',
          area: 5.1,
          crop: 'Tomato',
          cropIcon: '🍅',
          healthStatus: 'MODERATE_STRESS',
          polygonPoints: [[68, 26], [85, 30], [82, 45], [65, 40]],
        },
      ],
    },
    {
      id: 'farm-2',
      name: 'Westfield Farm',
      isExpanded: false,
      parcels: [
        {
          id: 'parcel-d',
          name: 'Parcel D',
          area: 4.5,
          crop: 'Cotton',
          cropIcon: '☁️',
          healthStatus: 'HEALTHY',
          polygonPoints: [[25, 40], [40, 42], [38, 60], [22, 58]],
        },
        {
          id: 'parcel-e',
          name: 'Parcel E',
          area: 2.8,
          crop: 'Tomato',
          cropIcon: '🍅',
          healthStatus: 'HIGH_RISK',
          polygonPoints: [[42, 42], [58, 45], [55, 62], [39, 60]],
        },
      ],
    },
    {
      id: 'farm-3',
      name: 'Riverside Farm',
      isExpanded: false,
      parcels: [
        {
          id: 'parcel-f',
          name: 'Parcel F',
          area: 7.2,
          crop: 'Rice',
          cropIcon: '🌾',
          healthStatus: 'CRITICAL',
          polygonPoints: [[62, 48], [78, 52], [75, 70], [58, 65]],
        },
      ],
    },
  ]);

  const toggleGroup = (id: string) => {
    setFarmGroups(groups =>
      groups.map(g => (g.id === id ? { ...g, isExpanded: !g.isExpanded } : g))
    );
  };

  // Convert nested parcels to flat FarmPolygonZone[] for the map
  const allZones: FarmPolygonZone[] = farmGroups.flatMap(group =>
    group.parcels.map(p => ({
      id: p.id,
      name: p.name,
      crop: p.crop,
      areaHa: p.area,
      ndvi: 0.8,
      cwsi: 0.2,
      healthStatus: p.healthStatus,
      pathogenRisk: '',
      soilMoisture: 50,
      canopyTemp: 25,
      lat: 20.2185,
      lng: 73.8420,
      polygonPoints: p.polygonPoints,
    }))
  );

  return (
    <div className={`flex h-[calc(100vh-4rem)] w-full overflow-hidden ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* LEFT SIDEBAR - List View */}
      <div className="w-80 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 transition-colors duration-300">
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 p-2">
          <button 
            onClick={() => setIsDarkMode(false)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              !isDarkMode 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>My Fields</span>
          </button>
          <button 
            onClick={() => setIsDarkMode(true)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              isDarkMode 
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>All Tasks</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={isDarkMode ? "Search tasks..." : "Search fields..."}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-950 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>
          <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!isDarkMode ? (
            // MY FIELDS LIST
            farmGroups.map(group => (
              <div key={group.id} className="space-y-1">
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 flex items-center justify-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                      {group.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-white text-sm">{group.name}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {group.parcels.length} parcels
                  </span>
                </button>

                {group.isExpanded && (
                  <div className="pl-7 space-y-1">
                    {group.parcels.map(parcel => (
                      <button
                        key={parcel.id}
                        onClick={() => setSelectedZoneId(parcel.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          selectedZoneId === parcel.id
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-sm ${
                            parcel.healthStatus === 'HEALTHY' ? 'bg-emerald-500' :
                            parcel.healthStatus === 'MODERATE_STRESS' ? 'bg-amber-500' :
                            parcel.healthStatus === 'HIGH_RISK' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium">{parcel.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm opacity-80">{parcel.cropIcon}</span>
                          <span className="text-xs font-medium opacity-60 w-12 text-right">{parcel.area} ha</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            // ALL TASKS LIST (Dark mode mockup)
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">Pinned Tasks</h3>
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Apply Fungicide (Target Spot)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Parcel C • Tomorrow, 08:00 AM</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">Not Started</h3>
                <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer border border-transparent">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">Soil Sampling</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Parcel A • Due in 3 days</p>
                </div>
                <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer border border-transparent">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">Drone NDVI Scan</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Westfield Farm • Due next week</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors">
            <Plus className="w-4 h-4" />
            <span>{isDarkMode ? 'New Task' : 'Add Field'}</span>
          </button>
        </div>
      </div>

      {/* RIGHT MAIN AREA - Map */}
      <div className="flex-1 relative bg-slate-100 dark:bg-slate-900">
        <MaplibreGISViewer 
          zones={allZones} 
          selectedZoneId={selectedZoneId}
          onZoneClick={(id) => setSelectedZoneId(id)}
        />
      </div>

    </div>
  );
};
