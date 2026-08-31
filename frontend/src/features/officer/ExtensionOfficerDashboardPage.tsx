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
} from 'lucide-react';
import { officerService } from '@/services/officerService';
import {
  OfficerDashboardResponse,
  OfficerFarmSummary,
  OfficerValidationRequest,
  PriorityTier,
} from '@/types';

export const ExtensionOfficerDashboardPage: React.FC = () => {
  const [data, setData] = useState<OfficerDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTier, setFilterTier] = useState<string>('ALL');

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
      setData(res);
    } catch (err: any) {
      console.error('Failed to load extension officer dashboard', err);
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
          <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>CRITICAL PRIORITY</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-400 font-bold text-xs flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>HIGH PRIORITY</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>MEDIUM PRIORITY</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>LOW (BASELINE)</span>
          </span>
        );
    }
  };

  const filteredFarms = data
    ? data.farms.filter((f) => {
        if (filterTier === 'ALL') return true;
        if (filterTier === 'VISITS') return f.recommended_visit;
        return f.priority_tier === filterTier;
      })
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Agricultural Extension Officer Portal</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Jurisdiction: Pune & Western Ghats Agro Basin
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Field Prioritization & Expert Validation Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Assigned Officer: <strong className="text-slate-200">{data?.officer_name || 'Extension Specialist'}</strong> • Scope-Enforced Security
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audited & Scope-Protected</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 text-center shadow-lg">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Critical Urgency
            </span>
            <p className="text-3xl font-black font-mono text-rose-400">{data.critical_count} Holdings</p>
            <span className="text-[10px] text-rose-400 font-semibold block">Immediate Intervention</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 text-center shadow-lg">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              High Risk Holdings
            </span>
            <p className="text-3xl font-black font-mono text-orange-400">{data.high_count} Holdings</p>
            <span className="text-[10px] text-slate-500 block">Close Monitoring</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 text-center shadow-lg">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Pending Validations
            </span>
            <p className="text-3xl font-black font-mono text-amber-400">{data.pending_validations_total} Requests</p>
            <span className="text-[10px] text-amber-400/80 font-semibold block">AI Calibration Required</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 text-center shadow-lg">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              Recommended Visits
            </span>
            <p className="text-3xl font-black font-mono text-blue-400">{data.recommended_visits_total} Visits</p>
            <span className="text-[10px] text-blue-400/80 font-semibold block">Ground-Truth Routing</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-2 font-semibold">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterTier === tab.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-slate-200">{filteredFarms.length}</strong> of {data?.total_assigned_farms} assigned holdings
        </span>
      </div>

      {/* Assigned Farms Priority Ranking List */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Loading assigned farm prioritization matrix...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFarms.map((farm) => (
            <div
              key={farm.farm_id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-100 text-base">{farm.farm_name}</h3>
                      {farm.recommended_visit && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                          Visit Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Farmer: <strong className="text-slate-300">{farm.owner_name}</strong> • {farm.location_name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {farm.area_hectares.toFixed(1)} ha • {farm.crop_type} ({farm.growth_stage})
                    </p>
                  </div>

                  {getPriorityBadge(farm.priority_tier)}
                </div>

                {/* Threat Indicators Grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Critical Zones</span>
                    <span className="font-bold text-rose-400">{farm.critical_zones_count} Zones</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Pest Hotspots</span>
                    <span className="font-bold text-orange-400">{farm.pest_hotspots_count} Active</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Spread Risk</span>
                    <span className="font-bold text-rose-400">{farm.spread_risk_score} / 100</span>
                  </div>
                </div>

                {/* Alerts & Pending Validations */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                  <span>Unresolved Alerts: <strong className="text-rose-400">{farm.unresolved_alerts_count}</strong></span>
                  <span>Pending Validations: <strong className="text-amber-400">{farm.pending_validations_count}</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleOpenReview(farm)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-950/40"
              >
                <span>Review AI Observations & Validate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Audited Expert Validation & Field Review Modal */}
      {isModalOpen && selectedFarm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-base">
                    Audited Agronomic Review & Validation
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Target: {selectedFarm.farm_name} (Priority: {selectedFarm.priority_tier})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition text-sm"
              >
                ✕
              </button>
            </div>

            {/* AI Observation Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="font-bold text-slate-200">AI Observation Stream #OBS-2026-89</span>
                <span className="text-emerald-400 font-mono font-bold">Confidence: 89.2%</span>
              </div>
              <p className="text-slate-300">
                Suspected <strong>Yellow Rust (Puccinia striiformis)</strong> pustules detected across canopy in Zone Z03. Water stress CWSI: 0.76 (High Deficit).
              </p>
            </div>

            {/* Officer Inputs: Notes & Override */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Extension Officer Diagnosis Notes:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter agronomic field observations, leaf tissue symptoms, or soil moisture verification..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Optional Pathogen Scientific Override / Correction:
                </label>
                <input
                  type="text"
                  value={overridePathogen}
                  onChange={(e) => setOverridePathogen(e.target.value)}
                  placeholder="e.g. Puccinia recondita (Brown Rust)"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Schedule Field Visit Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sched-visit"
                  checked={scheduleVisit}
                  onChange={(e) => setScheduleVisit(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 focus:ring-0"
                />
                <label htmlFor="sched-visit" className="text-xs text-slate-300 cursor-pointer font-medium">
                  Schedule immediate in-person field visit / routing for this holding
                </label>
              </div>
            </div>

            {/* Audit Status Notification */}
            {lastAuditResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                {lastAuditResult}
              </div>
            )}

            {/* Validation Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitValidation('VALIDATED')}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Validate Finding</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitValidation('REJECTED')}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Finding</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitValidation('UNCERTAIN')}
                className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Mark Uncertain</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitValidation('LAB_CONFIRMATION_REQUESTED')}
                className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Request Lab Assay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
