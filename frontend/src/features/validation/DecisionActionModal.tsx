import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FlaskConical,
  ShieldCheck,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { ExpertValidationRequest } from '@/types/validation';
import { validationService } from '@/services/validationService';

interface DecisionActionModalProps {
  request: ExpertValidationRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export const DecisionActionModal: React.FC<DecisionActionModalProps> = ({
  request,
  onClose,
  onSuccess,
}) => {
  const [decision, setDecision] = useState<'CONFIRMED' | 'REJECTED' | 'UNCERTAIN' | 'LAB_REFERRAL'>('CONFIRMED');
  const [confirmedCondition, setConfirmedCondition] = useState<string>(request.suspected_condition);
  const [expertNotes, setExpertNotes] = useState<string>('');
  const [farmerGuidance, setFarmerGuidance] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [uncertainRec, setUncertainRec] = useState<string>('');
  const [sampleType, setSampleType] = useState<string>('Leaf Tissue Sample');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (decision === 'LAB_REFERRAL') {
        await validationService.createLabReferral(request.id, {
          sample_type: sampleType,
          suspected_condition: confirmedCondition,
          reason: expertNotes || 'Requires certified laboratory pathogen assay.',
        });
      } else {
        await validationService.submitDecision(request.id, {
          decision,
          confirmed_condition: decision === 'CONFIRMED' ? confirmedCondition : undefined,
          expert_notes: expertNotes,
          farmer_guidance: farmerGuidance,
          rejection_reason: decision === 'REJECTED' ? rejectionReason : undefined,
          uncertain_recommendation: decision === 'UNCERTAIN' ? uncertainRec : undefined,
        });
      }
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to submit validation decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-agri-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-agri-100 dark:border-agri-700/25 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-agri-500/15 text-agri-400 border border-agri-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-agri-300 font-mono font-bold uppercase tracking-wider block">
                Official Agronomic Review
              </span>
              <h2 className="text-xl font-black">
                Submit Ground-Truth Decision ({request.case_number})
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-agri-400/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Decision Type Buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-agri-500/70 tracking-wider">
              Validation Verdict
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDecision('CONFIRMED')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                  decision === 'CONFIRMED'
                    ? 'bg-agri-500 text-white border-emerald-600 shadow-md'
                    : 'bg-surface-light dark:bg-surface-darkBg text-agri-700 dark:text-agri-300 border-agri-200/50 dark:border-agri-700/25'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>CONFIRMED</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                  decision === 'REJECTED'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-surface-light dark:bg-surface-darkBg text-agri-700 dark:text-agri-300 border-agri-200/50 dark:border-agri-700/25'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>REJECTED</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('UNCERTAIN')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                  decision === 'UNCERTAIN'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                    : 'bg-surface-light dark:bg-surface-darkBg text-agri-700 dark:text-agri-300 border-agri-200/50 dark:border-agri-700/25'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>UNCERTAIN</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('LAB_REFERRAL')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                  decision === 'LAB_REFERRAL'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                    : 'bg-surface-light dark:bg-surface-darkBg text-agri-700 dark:text-agri-300 border-agri-200/50 dark:border-agri-700/25'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>LAB REFERRAL</span>
              </button>
            </div>
          </div>

          {/* Conditional Decision Inputs */}
          {decision === 'CONFIRMED' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
                  Confirmed Pathogen / Disease Name
                </label>
                <input
                  type="text"
                  value={confirmedCondition}
                  onChange={(e) => setConfirmedCondition(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-agri-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
                  Actionable Guidance for Farmer (Plain Language)
                </label>
                <textarea
                  rows={3}
                  value={farmerGuidance}
                  onChange={(e) => setFarmerGuidance(e.target.value)}
                  placeholder="e.g. Prune affected lower leaves, apply certified bio-fungicide, avoid evening overhead sprinkling..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs focus:outline-none focus:ring-2 focus:ring-agri-500"
                  required
                />
              </div>
            </div>
          )}

          {decision === 'REJECTED' && (
            <div>
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why the AI prediction was invalid (e.g. Non-pathogenic leaf scorch / mechanical fertilizer burn)..."
                className="w-full px-4 py-2.5 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
          )}

          {decision === 'UNCERTAIN' && (
            <div>
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
                Recommendations for Resubmission
              </label>
              <textarea
                rows={3}
                value={uncertainRec}
                onChange={(e) => setUncertainRec(e.target.value)}
                placeholder="Specify what additional field observation or higher-zoom photo is required..."
                className="w-full px-4 py-2.5 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          )}

          {decision === 'LAB_REFERRAL' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
                  Sample Type for Lab Testing
                </label>
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Leaf Tissue Sample">Leaf Tissue Sample (PCR / Fungal Culture)</option>
                  <option value="Soil Core Sample">Soil Core Sample (Nematode & Nutrient Analysis)</option>
                  <option value="Stem Collar Section">Stem Collar Cross-section (Vascular Wilt)</option>
                  <option value="Fruit Tissue Specimen">Fruit Tissue Specimen</option>
                </select>
              </div>
            </div>
          )}

          {/* Internal Expert Notes */}
          <div>
            <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
              Internal Notes (Government / Extension Archive Only)
            </label>
            <textarea
              rows={2}
              value={expertNotes}
              onChange={(e) => setExpertNotes(e.target.value)}
              placeholder="Internal technical assessment, pathogen classification notes..."
              className="w-full px-4 py-2 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-agri-100 dark:border-agri-700/25 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-agri-600 dark:text-agri-300 hover:bg-agri-50 dark:hover:bg-agri-800/60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-agri-500 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Official Verdict'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
