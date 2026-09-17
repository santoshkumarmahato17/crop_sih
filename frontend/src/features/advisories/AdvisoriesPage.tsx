import React, { useState, useEffect } from 'react';
import {
  Sprout,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Advisory } from '@/types/advisory';
import { advisoryService } from '@/services/advisoryService';
import { AdvisoryCard } from './AdvisoryCard';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/i18n';
import { RequestValidationModal } from '@/features/validation/RequestValidationModal';

export const AdvisoriesPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [trustFilter, setTrustFilter] = useState<string>('ALL');
  
  // Validation Request Modal State
  const [selectedAdvisoryForValidation, setSelectedAdvisoryForValidation] = useState<Advisory | null>(null);

  const loadAdvisories = async () => {
    setIsLoading(true);
    try {
      const data = await advisoryService.getAdvisories({ language: currentLanguage });
      setAdvisories(data);
    } catch (err) {
      console.warn('Failed to load advisories', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdvisories();
  }, [currentLanguage]);

  // Filter logic
  const filteredAdvisories = advisories.filter((adv) => {
    const matchesSearch =
      adv.condition_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adv.localized?.title && adv.localized.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (adv.farm_name && adv.farm_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = priorityFilter === 'ALL' || adv.priority === priorityFilter;
    const matchesTrust =
      trustFilter === 'ALL' ||
      (trustFilter === 'VALIDATED' && adv.trust_level === 3) ||
      (trustFilter === 'LAB' && adv.trust_level === 4) ||
      (trustFilter === 'AI' && adv.trust_level <= 2);

    return matchesSearch && matchesPriority && matchesTrust;
  });

  const validatedCount = advisories.filter((a) => a.trust_level === 3).length;
  const criticalCount = advisories.filter((a) => a.priority === 'CRITICAL').length;
  const labCount = advisories.filter((a) => a.trust_level === 4).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-agri-500/15 border border-emerald-400/40 text-agri-300 font-mono text-[10px] font-extrabold uppercase tracking-wider">
              IPM Precision Advisory Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Sprout className="w-7 h-7 text-agri-400" />
            <span>{t('advisories.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl">
            {t('advisories.subtitle')}
          </p>
        </div>

        {/* Language Switcher in Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <LanguageSwitcher variant="full" />
          <button
            type="button"
            onClick={loadAdvisories}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center justify-center gap-2 text-xs font-bold active:scale-95"
            title="Refresh Advisories"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Metrics Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-agri-500/70 uppercase tracking-wider block">
            Total Active Advisories
          </span>
          <p className="text-2xl font-black text-agri-900 dark:text-white">{advisories.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-agri-500/10 border border-agri-500/25 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-agri-700 dark:text-agri-300 uppercase tracking-wider block flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Expert Validated</span>
          </span>
          <p className="text-2xl font-black text-agri-700 dark:text-agri-400">{validatedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Critical Priority</span>
          </span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{criticalCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block">
            Lab Referrals
          </span>
          <p className="text-2xl font-black text-sky-700 dark:text-sky-400">{labCount}</p>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-agri-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search condition, crop or farm..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-agri-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs font-bold text-agri-700 dark:text-agri-300 focus:outline-none focus:ring-2 focus:ring-agri-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
          </select>

          {/* Trust Level filter */}
          <select
            value={trustFilter}
            onChange={(e) => setTrustFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs font-bold text-agri-700 dark:text-agri-300 focus:outline-none focus:ring-2 focus:ring-agri-500"
          >
            <option value="ALL">All Trust Levels</option>
            <option value="VALIDATED">Expert Validated (Level 3)</option>
            <option value="LAB">Lab Confirmed (Level 4)</option>
            <option value="AI">AI Suspected (Level 1/2)</option>
          </select>
        </div>
      </div>

      {/* ── Advisories Feed ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 rounded-3xl bg-slate-200 dark:bg-agri-800/50 animate-pulse" />
          ))}
        </div>
      ) : filteredAdvisories.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-surface-darkCard border border-dashed border-slate-300 dark:border-agri-700/25 space-y-3">
          <Sparkles className="w-10 h-10 text-agri-500 mx-auto opacity-70" />
          <h3 className="text-base font-black text-agri-900 dark:text-white">
            No Advisories Found
          </h3>
          <p className="text-xs text-agri-500/70 max-w-sm mx-auto">
            Your crops in monitored zones are currently within nominal healthy thresholds.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredAdvisories.map((advisory) => (
            <AdvisoryCard
              key={advisory.id}
              advisory={advisory}
              onRequestValidation={(adv) => setSelectedAdvisoryForValidation(adv)}
            />
          ))}
        </div>
      )}

      {/* ── Farmer Request Validation Modal ── */}
      {selectedAdvisoryForValidation && (
        <RequestValidationModal
          advisory={selectedAdvisoryForValidation}
          onClose={() => setSelectedAdvisoryForValidation(null)}
          onSuccess={() => {
            setSelectedAdvisoryForValidation(null);
            loadAdvisories();
          }}
        />
      )}
    </div>
  );
};
