import React from 'react';
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDiagnosisWizard } from './DiagnosisWizardContext';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const PLANT_PARTS = ['Leaf', 'Stem', 'Root', 'Fruit', 'Flower', 'Whole Plant'];

const SYMPTOM_TAXONOMY = {
  'Leaf Symptoms': ['Yellowing', 'Browning', 'Wilting', 'Curling', 'Spots', 'Blotches', 'Holes', 'Powdery coating', 'Rust-like appearance', 'Mosaic pattern', 'Vein discoloration', 'Necrosis'],
  'Stem Symptoms': ['Lesions', 'Discoloration', 'Cracking', 'Rot', 'Wilting', 'Swelling'],
  'Fruit Symptoms': ['Spots', 'Rot', 'Discoloration', 'Deformation', 'Cracking', 'Premature dropping'],
  'Whole Plant': ['Stunted growth', 'Sudden wilting', 'Slow growth', 'Plant death', 'Uneven growth'],
};

export const Step3Observations: React.FC<Props> = ({ onNext, onPrev }) => {
  const {
    selectedPlantParts, setSelectedPlantParts,
    selectedSymptoms, setSelectedSymptoms,
    severity, setSeverity,
    distribution, setDistribution,
    symptomDuration, setSymptomDuration,
    farmerNotes, setFarmerNotes
  } = useDiagnosisWizard();

  const togglePlantPart = (part: string) => {
    setSelectedPlantParts(
      selectedPlantParts.includes(part)
        ? selectedPlantParts.filter((p) => p !== part)
        : [...selectedPlantParts, part]
    );
  };

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(
      selectedSymptoms.includes(sym)
        ? selectedSymptoms.filter((s) => s !== sym)
        : [...selectedSymptoms, sym]
    );
  };

  const canProceed = selectedPlantParts.length > 0 && selectedSymptoms.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Layers className="text-emerald-600" />
          Plant Parts & Observations
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Select which parts of the plant are affected and the specific visual symptoms you can see.
        </p>
      </div>

      <div className="space-y-6">
        {/* Plant Parts */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Affected Plant Parts</label>
          <div className="flex flex-wrap gap-2">
            {PLANT_PARTS.map((part) => (
              <button
                key={part}
                onClick={() => togglePlantPart(part)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selectedPlantParts.includes(part)
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                }`}
              >
                {part}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Observed Symptoms</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(SYMPTOM_TAXONOMY).map(([category, symptoms]) => (
              <div key={category} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm mb-3 pb-2 border-b border-slate-200">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => toggleSymptom(sym)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        selectedSymptoms.includes(sym)
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="LOW">Low (Early stages)</option>
              <option value="MEDIUM">Medium (Noticeable damage)</option>
              <option value="HIGH">High (Significant damage)</option>
              <option value="SEVERE">Severe (Crop failure risk)</option>
            </select>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Distribution in Zone</label>
            <select
              value={distribution}
              onChange={(e) => setDistribution(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Single plant">Single plant only</option>
              <option value="Small cluster (Hotspot)">Small cluster (Hotspot)</option>
              <option value="One section of the zone">One section of the zone</option>
              <option value="Scattered across zone">Scattered across zone</option>
              <option value="Most of the zone">Most of the zone</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">When did symptoms start?</label>
            <select
              value={symptomDuration}
              onChange={(e) => setSymptomDuration(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Today">Today / Just noticed</option>
              <option value="1–3 days ago">1–3 days ago</option>
              <option value="4–7 days ago">4–7 days ago</option>
              <option value="1–2 weeks ago">1–2 weeks ago</option>
              <option value="More than 2 weeks ago">More than 2 weeks ago</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Farmer Notes (Optional)</label>
          <textarea
            value={farmerNotes}
            onChange={(e) => setFarmerNotes(e.target.value)}
            placeholder="Describe anything unusual about the symptoms, recent weather changes, or chemical applications..."
            className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
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
          Next: Upload Evidence
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
