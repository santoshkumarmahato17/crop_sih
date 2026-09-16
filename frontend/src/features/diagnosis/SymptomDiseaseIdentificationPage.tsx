import React from 'react';
import { DiagnosisWizard } from './wizard/DiagnosisWizard';

export const SymptomDiseaseIdentificationPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <DiagnosisWizard />
    </div>
  );
};
