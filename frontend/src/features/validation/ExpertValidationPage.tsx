import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { ExpertValidationRequest, ValidationStats } from '@/types/validation';
import { validationService } from '@/services/validationService';
import { EvidenceInspectionTabs } from './EvidenceInspectionTabs';
import { DecisionActionModal } from './DecisionActionModal';
import { useTranslation } from '@/i18n';

export const ExpertValidationPage: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ExpertValidationRequest[]>([]);
  const [stats, setStats] = useState<ValidationStats>({
    total_pending: 17,
    high_priority: 5,
    critical: 2,
    my_assigned: 6,
    recently_validated: 28,
    lab_referrals: 3,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Selected Case for Deep Inspection & Decision
  const [selectedCase, setSelectedCase] = useState<ExpertValidationRequest | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqList, statsData] = await Promise.all([
        validationService.getValidationRequests(),
        validationService.getValidationStatistics(),
      ]);
      setRequests(reqList);
      setStats(statsData);
      if (reqList.length > 0 && !selectedCase) {
        setSelectedCase(reqList[0]);
      }
    } catch (err) {
      console.warn('Failed to load validation workspace', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.suspected_condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.farm_name && r.farm_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || r.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'CONFIRMED':
        return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-rose-500/15 text-rose-600 border-rose-500/30';
      case 'UNDER_REVIEW':
        return 'bg-sky-500/15 text-sky-600 border-sky-500/30';
      case 'LAB_REFERRAL':
        return 'bg-purple-500/15 text-purple-600 border-purple-500/30';
      default:
        return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ── Header Banner ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-extrabold uppercase tracking-wider">
              Extension Ground-Truth Verification
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <span>{t('validation.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl">
            {t('validation.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center justify-center gap-2 text-xs font-bold active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* ── Statistics Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            Pending Cases
          </span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.total_pending}</p>
        </div>

        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-1">
          <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider block">
            High Priority
          </span>
          <p className="text-2xl font-black text-orange-700 dark:text-orange-400">{stats.high_priority}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
            Critical Outbreaks
          </span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{stats.critical}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
            My Assigned
          </span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.my_assigned}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Validated
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.recently_validated}</p>
        </div>

        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1">
          <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block">
            Lab Referrals
          </span>
          <p className="text-2xl font-black text-sky-700 dark:text-sky-400">{stats.lab_referrals}</p>
        </div>
      </div>

      {/* ── Main Workspace Layout (Left: Queue, Right: Evidence Tabs & Decision) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column: Cases Queue (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Queue Filter Controls */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case #, disease, or farm..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Only</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="REJECTED">Rejected</option>
                <option value="LAB_REFERRAL">Lab Referral</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>
          </div>

          {/* Queue List Cards */}
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium">
                No cases matching filter criteria.
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = selectedCase?.id === req.id;
                return (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => setSelectedCase(req)}
                    className={`w-full p-4 rounded-3xl border text-left transition-all duration-150 flex flex-col gap-2.5 shadow-sm ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 dark:border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                        {req.case_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getPriorityBadge(
                            req.priority
                          )}`}
                        >
                          {req.priority}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {req.suspected_condition}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {req.farm_name} {req.zone_name ? `• ${req.zone_name}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>AI Conf: {(req.ai_confidence * 100).toFixed(0)}%</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Inspect Evidence</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Column: Evidence Inspector & Decision Actions (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCase ? (
            <div className="space-y-4">
              {/* Evidence Inspector Tabs */}
              <EvidenceInspectionTabs request={selectedCase} />

              {/* Decision Action Toolbar */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold uppercase tracking-wider block">
                    Case Decision Gateway
                  </span>
                  <h3 className="text-sm font-black">
                    Submit Ground-Truth Verdict for {selectedCase.case_number}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="py-2.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-95 whitespace-nowrap"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter Official Decision</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 text-xs">
              Select a validation case from the queue to review evidence.
            </div>
          )}
        </div>
      </div>

      {/* ── Decision Modal ── */}
      {selectedCase && isDecisionModalOpen && (
        <DecisionActionModal
          request={selectedCase}
          onClose={() => setIsDecisionModalOpen(false)}
          onSuccess={() => {
            setIsDecisionModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
