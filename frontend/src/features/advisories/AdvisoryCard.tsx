import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FlaskConical,
  Bot,
  Volume2,
  VolumeX,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Eye,
  Ban,
  HelpCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import { Advisory } from '@/types/advisory';
import { useTranslation } from '@/i18n';

interface AdvisoryCardProps {
  advisory: Advisory;
  onRequestValidation?: (advisory: Advisory) => void;
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({
  advisory,
  onRequestValidation,
}) => {
  const { t, currentLanguage } = useTranslation();
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'farmer' | 'technical'>('farmer');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const loc = advisory.localized;
  const trustLevel = advisory.trust_level;

  // Audio Text-to-Speech Playback
  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = loc?.audio_text || `${loc?.title}. ${loc?.summary}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set appropriate TTS language voice
    if (currentLanguage === 'hi-IN') utterance.lang = 'hi-IN';
    else if (currentLanguage === 'mr-IN') utterance.lang = 'mr-IN';
    else utterance.lang = 'en-US';

    utterance.rate = 0.95;
    setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  // Trust Level Metadata Visuals
  const getTrustLevelBadge = () => {
    switch (trustLevel) {
      case 3:
        return {
          icon: <ShieldCheck className="w-4 h-4 text-agri-600 dark:text-agri-400" />,
          label: t('trustLevels.level3'),
          badgeClass: 'bg-agri-500/15 text-agri-700 dark:text-agri-300 border-agri-500/25',
          borderClass: 'border-emerald-300 dark:border-agri-700/30',
          glowClass: 'shadow-emerald-950/10',
        };
      case 4:
        return {
          icon: <FlaskConical className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
          label: t('trustLevels.level4'),
          badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
          borderClass: 'border-sky-300 dark:border-sky-800/80',
          glowClass: 'shadow-sky-950/10',
        };
      case 2:
        return {
          icon: <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
          label: t('trustLevels.level2'),
          badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          borderClass: 'border-amber-300 dark:border-amber-800/80',
          glowClass: 'shadow-amber-950/10',
        };
      default:
        return {
          icon: <Bot className="w-4 h-4 text-amber-500" />,
          label: t('trustLevels.level1'),
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          borderClass: 'border-agri-200/50 dark:border-agri-700/25',
          glowClass: '',
        };
    }
  };

  const trustBadge = getTrustLevelBadge();

  // Priority colors
  const getPriorityBadge = () => {
    switch (advisory.priority) {
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

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-surface-darkCard border ${trustBadge.borderClass} shadow-xl ${trustBadge.glowClass} overflow-hidden transition-all duration-200`}
    >
      {/* ── Top Header Banner ── */}
      <div className="p-5 border-b border-agri-100 dark:border-agri-700/25 bg-surface-light/50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Trust Level Badge (Level 1–4) */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm ${trustBadge.badgeClass}`}
            >
              {trustBadge.icon}
              <span>{trustBadge.label}</span>
            </div>

            {/* Priority Badge */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${getPriorityBadge()}`}
            >
              {advisory.priority} PRIORITY
            </span>

            {/* Farm & Zone Scope */}
            <div className="flex items-center gap-1.5 text-xs text-agri-500/70 dark:text-agri-400/70 font-medium">
              <MapPin className="w-3.5 h-3.5 text-agri-400/70" />
              <span>
                {advisory.farm_name || 'Farm'} {advisory.zone_name ? `• ${advisory.zone_name}` : ''}
              </span>
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-black text-agri-900 dark:text-white tracking-tight">
            {loc?.title || advisory.condition_name}
          </h3>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          {/* Audio TTS Button */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              isPlayingAudio
                ? 'bg-rose-500/15 text-rose-600 border-rose-500/30 animate-pulse'
                : 'bg-white dark:bg-agri-800/50 hover:bg-agri-50 dark:hover:bg-agri-700/40 text-agri-700 dark:text-agri-200 border-agri-200/50 dark:border-agri-700/30 shadow-sm'
            }`}
            title={isPlayingAudio ? t('advisories.stopAudio') : t('advisories.listenAudio')}
          >
            {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-agri-600 dark:text-agri-400" />}
            <span className="hidden sm:inline">
              {isPlayingAudio ? t('advisories.stopAudio') : t('advisories.listenAudio')}
            </span>
          </button>

          {/* Farmer vs Technical View Switcher */}
          <div className="flex items-center bg-slate-200 dark:bg-agri-800/50 p-0.5 rounded-xl border border-slate-300 dark:border-agri-700/30 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('farmer')}
              className={`px-2 py-1 rounded-lg transition ${
                viewMode === 'farmer'
                  ? 'bg-white dark:bg-surface-darkCard text-agri-900 dark:text-white shadow-sm'
                  : 'text-agri-600 dark:text-agri-400/70'
              }`}
            >
              {t('advisories.farmerView')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('technical')}
              className={`px-2 py-1 rounded-lg transition ${
                viewMode === 'technical'
                  ? 'bg-white dark:bg-surface-darkCard text-agri-900 dark:text-white shadow-sm'
                  : 'text-agri-600 dark:text-agri-400/70'
              }`}
            >
              {t('advisories.technicalView')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-2 rounded-xl text-agri-400/70 hover:text-agri-600 hover:bg-agri-50 dark:hover:bg-agri-800/60 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Main Content Body ── */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Summary & Why this matters */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-agri-800 dark:text-agri-200 leading-relaxed">
              {loc?.summary}
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-agri-700 dark:text-agri-300 space-y-1">
              <span className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Why this matters / हे का महत्त्वाचे आहे:</span>
              </span>
              <p>{loc?.why_this_matters}</p>
            </div>
          </div>

          {/* Structured IPM Action Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. What to do now */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-agri-500/20 space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-agri-700 dark:text-agri-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-agri-600" />
                <span>{t('advisories.whatToDoNow')}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-agri-700 dark:text-agri-300">
                {loc?.what_to_do_now.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-agri-600 font-black mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. What to monitor */}
            <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-600" />
                <span>{t('advisories.whatToMonitor')}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-agri-700 dark:text-agri-300">
                {loc?.what_to_monitor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-600 font-black mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. What to avoid */}
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>{t('advisories.whatToAvoid')}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-agri-700 dark:text-agri-300">
                {loc?.what_to_avoid.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-600 font-black mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. When to seek expert help */}
            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  <span>{t('advisories.whenToSeekHelp')}</span>
                </h4>
                <p className="text-xs text-agri-700 dark:text-agri-300">
                  {loc?.when_to_seek_expert_help}
                </p>
              </div>

              {/* Farmer Trigger for Expert Validation */}
              {trustLevel < 3 && onRequestValidation && (
                <button
                  type="button"
                  onClick={() => onRequestValidation(advisory)}
                  className="mt-2 w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/20 active:scale-95"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{t('validation.requestValidation')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Technical Diagnostics View (When toggled) */}
          {viewMode === 'technical' && loc?.technical_breakdown && (
            <div className="p-4 rounded-2xl bg-slate-950 text-agri-400 font-mono text-xs border border-slate-800 space-y-1">
              <span className="text-agri-400/70 font-bold block">⚙️ Technical Metadata & Telemetry Breakdown:</span>
              <p>{loc.technical_breakdown}</p>
              <p className="text-[11px] text-agri-500/70">
                Advisory ID: {advisory.id} • Version: {advisory.version} • Source: {advisory.source} • Trust Level: {trustLevel}/4
              </p>
            </div>
          )}

          {/* Safety Warnings & Follow-Up Date */}
          <div className="pt-3 border-t border-agri-100 dark:border-agri-700/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-agri-500/70 dark:text-agri-400/70">
              <Shield className="w-4 h-4 text-agri-600 dark:text-agri-400" />
              <span>
                <strong>IPM Protection:</strong> {loc?.safety_warnings[0] || 'Strictly follow authorized organic guidelines.'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-agri-500/70 font-mono text-[11px] whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('advisories.nextCheck')}: {advisory.follow_up_date ? new Date(advisory.follow_up_date).toLocaleDateString() : 'Within 48h'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
