import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  FlaskConical,
  Clock,
  Lock,
  ArrowRight,
  Filter,
  Search,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { officerService, mockOfficerDashboardData } from '@/services/officerService';
import {
  OfficerDashboardResponse,
  OfficerFarmSummary,
  OfficerValidationRequest,
  PriorityTier,
} from '@/types';

export const ExtensionOfficerDashboardPage: React.FC = () => {
  const [data, setData] = useState<OfficerDashboardResponse>(mockOfficerDashboardData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Validation Modal State
  const [selectedFarm, setSelectedFarm] = useState<OfficerFarmSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [overridePathogen, setOverridePathogen] = useState<string>('');
  const [scheduleVisit, setScheduleVisit] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastAuditResult, setLastAuditResult] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await officerService.getOfficerDashboard();
      if (res && res.farms && res.farms.length > 0) {
        setData(res);
      } else {
        setData(mockOfficerDashboardData);
      }
    } catch (err: any) {
      console.warn('Using fallback extension officer data', err);
      setData(mockOfficerDashboardData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReview = (farm: OfficerFarmSummary) => {
    setSelectedFarm(farm);
    setNotes('');
    setOverridePathogen('');
    setScheduleVisit(farm.recommended_visit);
    setLastAuditResult(null);
    setIsModalOpen(true);
  };

  const handleSubmitValidation = async (
    status: 'VALIDATED' | 'REJECTED' | 'UNCERTAIN' | 'LAB_CONFIRMATION_REQUESTED'
  ) => {
    if (!selectedFarm) return;
    try {
      setIsSubmitting(true);
      const req: OfficerValidationRequest = {
        observation_id: `obs-${selectedFarm.farm_id}-latest`,
        observation_type: 'DISEASE',
        validation_status: status,
        notes: notes || undefined,
        override_pathogen: overridePathogen || undefined,
        create_field_visit: scheduleVisit,
        visit_scheduled_date: scheduleVisit ? new Date().toISOString() : undefined,
      };

      const res = await officerService.submitValidation(req);
      setLastAuditResult(
        `Audit Log Recorded: [${res.audit_action}] ID: ${res.audit_log_id.slice(0, 8)}... — ${res.message}`
      );
      // Refresh dashboard stats
      fetchDashboard();
    } catch (e) {
      alert('Failed to submit validation review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (tier: PriorityTier) => {
    switch (tier) {
      case 'CRITICAL':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>CRITICAL PRIORITY</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>HIGH PRIORITY</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>MEDIUM PRIORITY</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>LOW (BASELINE)</span>
          </span>
        );
    }
  };

  const filteredFarms = data.farms.filter((f) => {
    // 1. Tier Filter
    if (filterTier === 'CRITICAL' && f.priority_tier !== 'CRITICAL') return false;
    if (filterTier === 'HIGH' && f.priority_tier !== 'HIGH') return false;
    if (filterTier === 'MEDIUM' && f.priority_tier !== 'MEDIUM') return false;
    if (filterTier === 'VISITS' && !f.recommended_visit) return false;

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.farm_name.toLowerCase().includes(q);
      const matchOwner = f.owner_name.toLowerCase().includes(q);
      const matchLoc = f.location_name.toLowerCase().includes(q);
      const matchCrop = f.crop_type.toLowerCase().includes(q);
      return matchName || matchOwner || matchLoc || matchCrop;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── 1. Header Banner with Scope & Jurisdiction ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-xs font-black flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Agricultural Extension Officer Portal</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Jurisdiction: Coimbatore & Western Ghats Agro Basin (Zone IV)
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Field Prioritization & Expert Validation Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Assigned Officer: <strong className="text-slate-800 dark:text-slate-200">{data.officer_name}</strong> • Scope-Enforced Security
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDashboard}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="Refresh Ground Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Audited & Scope-Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Metric KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 space-y-1 text-center shadow-lg hover:border-rose-500/40 transition">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
            Critical Urgency
          </span>
          <p className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">{data.critical_count} Holdings</p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">Immediate Intervention</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 space-y-1 text-center shadow-lg hover:border-orange-500/40 transition">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
            High Risk Holdings
          </span>
          <p className="text-3xl font-black font-mono text-orange-600 dark:text-orange-400">{data.high_count} Holdings</p>
          <span className="text-[10px] text-slate-500 font-semibold block">Close Monitoring</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 space-y-1 text-center shadow-lg hover:border-amber-500/40 transition">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
            Pending Validations
          </span>
          <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{data.pending_validations_total} Requests</p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400/90 font-bold block">AI Calibration Required</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 space-y-1 text-center shadow-lg hover:border-sky-500/40 transition">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
            Recommended Visits
          </span>
          <p className="text-3xl font-black font-mono text-sky-600 dark:text-sky-400">{data.recommended_visits_total} Visits</p>
          <span className="text-[10px] text-sky-600 dark:text-sky-400/90 font-bold block">Ground-Truth Routing</span>
        </div>
      </div>

      {/* ── 3. Search and Multi-Filter Toolbar ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search holding, farmer, crop, region..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1 font-bold">
              <Filter className="w-3.5 h-3.5" /> Filter by:
            </span>
            {[
              { key: 'ALL', label: 'All Assigned Holdings' },
              { key: 'CRITICAL', label: 'Critical Only' },
              { key: 'HIGH', label: 'High Priority' },
              { key: 'MEDIUM', label: 'Medium' },
              { key: 'VISITS', label: 'Field Visit Recommended' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterTier(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  filterTier === tab.key
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span>
            Showing <strong className="text-slate-900 dark:text-slate-100 font-bold">{filteredFarms.length}</strong> of {data.total_assigned_farms} assigned holdings
          </span>
          <span className="font-mono text-[11px]">Evaluated: {new Date(data.evaluated_at).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ── 4. Assigned Farms Priority Ranking Cards Grid ── */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Loading assigned farm prioritization matrix...</p>
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Holdings Match Current Filter</h3>
          <p className="text-xs text-slate-500">Try resetting your search query or selecting "All Assigned Holdings".</p>
          <button
            type="button"
            onClick={() => {
              setFilterTier('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold shadow"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFarms.map((farm) => (
            <div
              key={farm.farm_id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 transition space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-900 dark:text-white text-base">{farm.farm_name}</h3>
                      {farm.recommended_visit && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                          Visit Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>Farmer: <strong className="text-slate-800 dark:text-slate-200">{farm.owner_name}</strong> • {farm.location_name}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {farm.area_hectares.toFixed(1)} ha • {farm.crop_type} ({farm.growth_stage})
                    </p>
                  </div>
                  {getPriorityBadge(farm.priority_tier)}
                </div>

                {/* Telemetry Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Priority Risk</span>
                    <span
                      className={`text-sm font-black font-mono ${
                        farm.risk_score >= 80
                          ? 'text-rose-600 dark:text-rose-400'
                          : farm.risk_score >= 60
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {farm.risk_score}/100
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Critical Zones</span>
                    <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200">
                      {farm.critical_zones_count} Zones
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Spread Risk</span>
                    <span className="text-sm font-black font-mono text-purple-600 dark:text-purple-400">
                      {farm.spread_risk_score}%
                    </span>
                  </div>
                </div>

                {/* Flags and Alerts */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {farm.unresolved_alerts_count > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{farm.unresolved_alerts_count} Unresolved Alerts</span>
                    </span>
                  )}
                  {farm.pending_validations_count > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{farm.pending_validations_count} Pending Validations</span>
                    </span>
                  )}
                  {farm.pest_hotspots_count > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold text-[11px]">
                      {farm.pest_hotspots_count} Pest Hotspots
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  Last Inspected: {farm.last_visit_date ? new Date(farm.last_visit_date).toLocaleDateString() : 'Pending'}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenReview(farm)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-black text-xs transition shadow-md shadow-sky-600/30 flex items-center gap-1.5"
                >
                  <span>Review & Validate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 5. Audited Ground-Truth Validation Modal ── */}
      {isModalOpen && selectedFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-mono font-bold uppercase">
                  Official Ground Calibration
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Validate Finding for {selectedFarm.farm_name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Observation ID: <span className="font-mono font-bold">obs-{selectedFarm.farm_id}-latest</span> • Farmer: {selectedFarm.owner_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {lastAuditResult && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{lastAuditResult}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Extension Agronomist Notes / Ground Symptoms
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record physical symptom check, pathogen stage, lesion progression, or soil moisture findings..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Override AI Suspected Pathogen (Optional)
                </label>
                <input
                  type="text"
                  value={overridePathogen}
                  onChange={(e) => setOverridePathogen(e.target.value)}
                  placeholder="e.g. Puccinia striiformis (Yellow Rust) / Severe Potassium Deficiency"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="schedule-visit-cb"
                  checked={scheduleVisit}
                  onChange={(e) => setScheduleVisit(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="schedule-visit-cb" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Schedule In-Person Extension Officer Field Visit & Lab Sampling
                </label>
              </div>

              {/* Action Decision Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                  Submit Official Determination (Audited Record)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitValidation('VALIDATED')}
                    className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/30"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm & Validate AI Finding</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitValidation('REJECTED')}
                    className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-rose-600/30"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject AI Finding (Retrain Model)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitValidation('LAB_CONFIRMATION_REQUESTED')}
                    className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-purple-600/30"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Order Pathology Lab Assay</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSubmitValidation('UNCERTAIN')}
                    className="p-3 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-600/30"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Mark Inconclusive (Queue Drone)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
