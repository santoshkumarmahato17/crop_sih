import React, { useState } from 'react';
import { Stethoscope, CheckCircle2 } from 'lucide-react';
import { DiagnosisWizardProvider } from './DiagnosisWizardContext';
import { Step1Location } from './Step1Location';
import { Step2Crop } from './Step2Crop';
import { Step3Observations } from './Step3Observations';
import { Step4Evidence } from './Step4Evidence';
import { Step5QualityGate } from './Step5QualityGate';
import { Step6ValidationGate } from './Step6ValidationGate';
import { Step7AIAnalysis } from './Step7AIAnalysis';

const WIZARD_STEPS = [
  'Farm & Zone',
  'Crop Details',
  'Observations',
  'Evidence',
  'Quality Gate',
  'Crop Gate',
  'AI Analysis'
];

const WizardInner: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const jumpToStep = (step: number) => setCurrentStep(step);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-emerald-600" />
            AI Symptom & Disease Diagnosis
          </h1>
          <p className="text-slate-500 mt-1">
            Production-Ready Crop Health Diagnosis Workflow
          </p>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((label, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            
            return (
              <div key={idx} className="flex flex-col items-center flex-1 relative">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${
                    isActive ? 'bg-emerald-600 text-white shadow-md' :
                    isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`text-xs mt-2 font-medium hidden sm:block ${
                  isActive ? 'text-emerald-700' :
                  isCompleted ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {label}
                </span>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${
                    isCompleted ? 'bg-emerald-200' : 'bg-slate-100'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        {currentStep === 0 && <Step1Location onNext={nextStep} />}
        {currentStep === 1 && <Step2Crop onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 2 && <Step3Observations onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 3 && <Step4Evidence onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 4 && <Step5QualityGate onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 5 && <Step6ValidationGate onNext={nextStep} onPrev={prevStep} />}
        {currentStep === 6 && <Step7AIAnalysis onPrev={prevStep} onReset={() => jumpToStep(0)} />}
      </div>
    </div>
  );
};

export const DiagnosisWizard: React.FC = () => {
  return (
    <DiagnosisWizardProvider>
      <WizardInner />
    </DiagnosisWizardProvider>
  );
};
