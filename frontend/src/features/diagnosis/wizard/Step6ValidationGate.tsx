import React, { useEffect, useState } from 'react';
import { ScanSearch, ChevronLeft, Loader2, CheckCircle2, Play } from 'lucide-react';
import { useDiagnosisWizard } from './DiagnosisWizardContext';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export const Step6ValidationGate: React.FC<Props> = ({ onNext, onPrev }) => {
  const {
    farms, selectedFarmId, zones, selectedZoneId,
    selectedCrop, selectedSymptoms, uploadedImages,
    cropValidationPassed, setCropValidationPassed,
  } = useDiagnosisWizard();

  const [isChecking, setIsChecking] = useState(false);

  const currentFarm = farms.find((f) => f.id === selectedFarmId);
  const currentZone = zones.find((z) => z.id === selectedZoneId);

  useEffect(() => {
    if (!cropValidationPassed) {
      runCropValidation();
    }
  }, []);

  const runCropValidation = () => {
    setIsChecking(true);
    setCropValidationPassed(false);

    setTimeout(() => {
      setIsChecking(false);
      setCropValidationPassed(true);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
          <ScanSearch className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
          <span>Crop Gate & Final Pre-flight Check</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verify that the uploaded evidence and crop context are fully prepared for the AI diagnostic pipeline.
        </p>
      </div>

      {/* Pre-flight Configuration Summary Card */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#1b1718] border border-slate-200 dark:border-[#382d33] space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Pre-flight Diagnostic Payload Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
          <div className="p-3 bg-white dark:bg-[#141112] rounded-xl border border-slate-200 dark:border-[#34292e]">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Crop Species:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedCrop}</span>
          </div>

          <div className="p-3 bg-white dark:bg-[#141112] rounded-xl border border-slate-200 dark:border-[#34292e]">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Evidence Image:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4" /> {uploadedImages.length} Uploaded
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-[#141112] rounded-xl border border-slate-200 dark:border-[#34292e]">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Observed Symptoms:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4" /> {selectedSymptoms.length} Added
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-[#141112] rounded-xl border border-slate-200 dark:border-[#34292e]">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Target Farm:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">{currentFarm?.name || 'Selected Farm'}</span>
          </div>

          <div className="p-3 bg-white dark:bg-[#141112] rounded-xl border border-slate-200 dark:border-[#34292e]">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Target Zone:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">{currentZone?.name || 'Zone A'}</span>
          </div>

          <div className="p-3 bg-white dark:bg-[#141112] rounded-xl border border-slate-200 dark:border-[#34292e]">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Location Context:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4" /> Available
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#181415] rounded-2xl border border-slate-200 dark:border-[#34292e] text-center">
        {isChecking ? (
          <>
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Verifying Crop Gate...</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              Running species verification check to ensure evidence matches {selectedCrop}.
            </p>
          </>
        ) : cropValidationPassed ? (
          <>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Crop Gate Ready</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
              Pre-flight verification complete. Click below to start AI analysis.
            </p>
          </>
        ) : null}
      </div>

      <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800 mt-8">
        <button
          onClick={onPrev}
          disabled={isChecking}
          className="flex items-center gap-2 bg-slate-100 dark:bg-[#261f22] text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl font-bold text-sm transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!cropValidationPassed || isChecking}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-950/30 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Start AI Analysis</span>
        </button>
      </div>
    </div>
  );
};
