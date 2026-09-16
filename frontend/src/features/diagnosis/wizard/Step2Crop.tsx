import React from 'react';
import { Sprout, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDiagnosisWizard } from './DiagnosisWizardContext';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const CROP_TYPES = ['Soybean', 'Apple', 'Tomato', 'Rice', 'Wheat', 'Corn', 'Banana', 'Chilli', 'Potato', 'Cotton', 'Sugarcane'];
const GROWTH_STAGES = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity', 'Harvest'];

export const Step2Crop: React.FC<Props> = ({ onNext, onPrev }) => {
  const { selectedCrop, setSelectedCrop, growthStage, setGrowthStage } = useDiagnosisWizard();

  const canProceed = selectedCrop !== '' && growthStage !== '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Sprout className="text-emerald-600" />
          Crop Details
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Specify the crop type and its current growth stage. This provides critical context for AI models.
        </p>
      </div>

      <div className="space-y-8">
        {/* Crop Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">Crop Type</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CROP_TYPES.map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCrop === crop
                    ? 'bg-emerald-600 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {crop}
              </button>
            ))}
          </div>
        </div>

        {/* Growth Stage */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">Growth Stage</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {GROWTH_STAGES.map((stage) => (
              <button
                key={stage}
                onClick={() => setGrowthStage(stage)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  growthStage === stage
                    ? 'bg-emerald-600 text-white shadow-md scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t mt-8">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Observations
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
