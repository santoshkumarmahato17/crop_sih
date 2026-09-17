import React, { useState } from 'react';
import {
  X,
  Send,
  Eye,
} from 'lucide-react';
import { MonitoringTask } from '@/types/monitoring';
import { monitoringService } from '@/services/monitoringService';

interface FieldInspectionFormModalProps {
  task: MonitoringTask;
  onClose: () => void;
  onSuccess: () => void;
}

export const FieldInspectionFormModal: React.FC<FieldInspectionFormModalProps> = ({
  task,
  onClose,
  onSuccess,
}) => {
  const [healthScore, setHealthScore] = useState<number>(58.0);
  const [diseaseRisk, setDiseaseRisk] = useState<number>(84.0);
  const [waterStress, setWaterStress] = useState<number>(0.74);
  const [affectedAreaHa, setAffectedAreaHa] = useState<number>(1.8);
  const severity = 'HIGH';
  const [notes, setNotes] = useState<string>(
    'Foliar chlorosis and concentric target spots spreading into mid canopy. Adjacent block Z16 shows initial symptoms.'
  );
  const symptoms = ['Leaf spots', 'Canopy wilting'];
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await monitoringService.submitResult(task.id, {
        health_score: Number(healthScore),
        disease_risk: Number(diseaseRisk),
        water_stress: Number(waterStress),
        affected_area_ha: Number(affectedAreaHa),
        severity,
        notes,
        observed_symptoms: symptoms,
        image_urls: [
          'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
        ],
      });
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to submit monitoring result.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-agri-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/25 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-agri-100 dark:border-agri-700/25 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-agri-500/15 text-agri-400 border border-agri-500/25">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-agri-300 font-mono font-bold uppercase tracking-wider block">
                Field Inspection Ground-Truth
              </span>
              <h2 className="text-xl font-black">
                Submit Follow-up Observation ({task.task_code})
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Metric Inputs Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
                Measured Health Score (0–100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={healthScore}
                onChange={(e) => setHealthScore(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-agri-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
                Disease Pathology Risk (0–100%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={diseaseRisk}
                onChange={(e) => setDiseaseRisk(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
                Affected Surface Area (Hectares)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={affectedAreaHa}
                onChange={(e) => setAffectedAreaHa(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
                Water Stress (CWSI 0.0–1.0)
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={waterStress}
                onChange={(e) => setWaterStress(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-agri-700 dark:text-agri-300 block mb-1">
              Field Scout Observations & Symptom Progression Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-light dark:bg-surface-darkBg border border-agri-200/50 dark:border-agri-700/25 text-xs focus:outline-none focus:ring-2 focus:ring-agri-500"
              required
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-agri-100 dark:border-agri-700/25 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-agri-600 dark:text-agri-300 hover:bg-agri-50 dark:hover:bg-agri-800/60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-agri-500 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Comparing...' : 'Submit & Execute Comparison'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
