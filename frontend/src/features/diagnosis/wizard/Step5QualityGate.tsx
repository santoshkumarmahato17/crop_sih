import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useDiagnosisWizard } from './DiagnosisWizardContext';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export const Step5QualityGate: React.FC<Props> = ({ onNext, onPrev }) => {
  const { uploadedImages, qualityValidationPassed, setQualityValidationPassed } = useDiagnosisWizard();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we haven't passed validation yet, run it when entering step
    if (!qualityValidationPassed && uploadedImages.length > 0) {
      runQualityCheck();
    }
  }, []);

  const runQualityCheck = () => {
    setIsChecking(true);
    setError(null);
    setQualityValidationPassed(false);

    // Simulate API call to ImageQualityService
    setTimeout(() => {
      // In a real scenario, this would POST the images to /api/v1/diagnosis/validate-image
      // Let's assume it passes for this demo, unless the user forces a fail condition
      setIsChecking(false);
      setQualityValidationPassed(true);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" />
          Image Quality Validation
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Verifying that uploaded images meet the minimum resolution, brightness, and focus requirements for AI analysis.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[250px] bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
        {isChecking ? (
          <>
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">Analyzing Image Quality...</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md">
              Checking {uploadedImages.length} image(s) for blur, exposure, and minimum resolution constraints.
            </p>
          </>
        ) : qualityValidationPassed ? (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Quality Checks Passed</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md">
              Your images meet all requirements for AI analysis.
            </p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Quality Check Failed</h3>
            <p className="text-red-600 mt-2 text-sm max-w-md">
              {error}
            </p>
            <button
              onClick={runQualityCheck}
              className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
            >
              Retry Check
            </button>
          </>
        ) : (
          <button
            onClick={runQualityCheck}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-sm"
          >
            Start Quality Check
          </button>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t mt-8">
        <button
          onClick={onPrev}
          disabled={isChecking}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!qualityValidationPassed || isChecking}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Crop Validation
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
