import React from 'react';
import { DiagnosisWizard } from './wizard/DiagnosisWizard';

export const SymptomDiseaseIdentificationPage: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-surface-darkBg min-h-screen py-8 transition-colors duration-200">
      <DiagnosisWizard />
    </div>
  );
};
