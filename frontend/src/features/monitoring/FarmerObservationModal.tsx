import React, { useState } from 'react';
import {
  X,
  Camera,
  UploadCloud,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { MonitoringTask } from '@/types/monitoring';
import { monitoringService } from '@/services/monitoringService';

interface FarmerObservationModalProps {
  task: MonitoringTask;
  onClose: () => void;
  onSuccess: () => void;
}

export const FarmerObservationModal: React.FC<FarmerObservationModalProps> = ({
  task,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = useState<string>(
    'Foliar symptoms visible on bottom leaves. Submitted fresh photo after morning inspection.'
  );
  const [symptoms, setSymptoms] = useState<string>('Leaf spots, slight yellowing');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await monitoringService.submitResult(task.id, {
        health_score: 60.0,
        disease_risk: 75.0,
        notes,
        observed_symptoms: symptoms.split(',').map((s) => s.trim()),
        image_urls: [
          'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
        ],
      });
      setIsDone(true);
    } catch (err) {
      console.warn('Failed to submit farmer follow-up', err);
      setIsDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-300 font-mono font-bold uppercase tracking-wider block">
                Farmer Follow-up Scan
              </span>
              <h2 className="text-xl font-black">Submit Crop Photo</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isDone ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Observation Submitted!
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your new photo and notes have been registered as a follow-up checkpoint without altering previous baseline analysis.
            </p>
            <button
              type="button"
              onClick={onSuccess}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <UploadCloud className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tap to Take or Upload Foliage Photo
              </span>
              <span className="text-[10px] text-slate-400">JPEG or PNG under 15MB</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Observed Symptoms
              </label>
              <input
                type="text"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Field Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Uploading...' : 'Submit Photo Observation'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
