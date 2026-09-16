import React, { useEffect, useState } from 'react';
import { ScanSearch, AlertTriangle, ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useDiagnosisWizard } from './DiagnosisWizardContext';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export const Step6ValidationGate: React.FC<Props> = ({ onNext, onPrev }) => {
  const { selectedCrop, cropValidationPassed, setCropValidationPassed } = useDiagnosisWizard();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cropValidationPassed) {
      runCropValidation();
    }
  }, []);

  const runCropValidation = () => {
    setIsChecking(true);
    setError(null);
    setCropValidationPassed(false);

    // Simulate API call to CropValidationService
    setTimeout(() => {
      // In a real scenario, this would POST to /api/v1/diagnosis/validate-crop
      // with the image and `selectedCrop`
      setIsChecking(false);
      setCropValidationPassed(true);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <ScanSearch className="text-emerald-600" />
          Crop Species Validation
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Verifying that the uploaded image actually contains a {selectedCrop} plant to prevent false-positive AI diagnoses.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[250px] bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
        {isChecking ? (
          <>
            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">Verifying Crop Species...</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md">
              Running a pre-flight model to ensure the image matches "{selectedCrop}".
            </p>
          </>
        ) : cropValidationPassed ? (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Crop Match Confirmed</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md">
              The image has been positively identified as {selectedCrop}. Proceeding to disease analysis.
            </p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Crop Mismatch Detected</h3>
            <p className="text-amber-700 mt-2 text-sm max-w-md">
              {error}
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={onPrev}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
              >
                Change Images
              </button>
              <button
                onClick={() => setCropValidationPassed(true)} // Force bypass for demo
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
              >
                Force Proceed (Override)
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={runCropValidation}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-sm"
          >
            Start Validation
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
          disabled={!cropValidationPassed || isChecking}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: AI Analysis
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
