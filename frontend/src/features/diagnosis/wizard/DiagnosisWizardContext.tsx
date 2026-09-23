import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Farm, Zone } from '@/types';
import { SymptomAnalysisResult } from '@/services/diagnosisService';

export interface WizardState {
  // Topology
  farms: Farm[];
  selectedFarmId: string;
  zones: Zone[];
  selectedZoneId: string;

  // Location Enablement
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationStatus: 'NOT_REQUESTED' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'MANUAL';

  // Crop & Stage
  selectedCrop: string;
  growthStage: string;

  // Observations
  selectedPlantParts: string[];
  selectedSymptoms: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
  distribution: string;
  symptomDuration: string;
  farmerNotes: string;

  // Evidence
  uploadedImages: { url: string; name: string; file?: File }[];

  // Validation Results
  qualityValidationPassed: boolean;
  cropValidationPassed: boolean;

  // Final AI Result
  analysisResult: SymptomAnalysisResult | null;
}

export interface WizardActions {
  setFarms: (farms: Farm[]) => void;
  setSelectedFarmId: (id: string) => void;
  setZones: (zones: Zone[]) => void;
  setSelectedZoneId: (id: string) => void;
  setLocationData: (data: { latitude?: number; longitude?: number; locationName?: string; locationStatus?: 'NOT_REQUESTED' | 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'MANUAL' }) => void;
  setSelectedCrop: (crop: string) => void;
  setGrowthStage: (stage: string) => void;
  setSelectedPlantParts: (parts: string[]) => void;
  setSelectedSymptoms: (symptoms: string[]) => void;
  setSeverity: (sev: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE') => void;
  setDistribution: (dist: string) => void;
  setSymptomDuration: (dur: string) => void;
  setFarmerNotes: (notes: string) => void;
  setUploadedImages: (images: { url: string; name: string; file?: File }[]) => void;
  setQualityValidationPassed: (passed: boolean) => void;
  setCropValidationPassed: (passed: boolean) => void;
  setAnalysisResult: (res: SymptomAnalysisResult | null) => void;
}

export type DiagnosisWizardContextType = WizardState & WizardActions;

const defaultState: WizardState = {
  farms: [],
  selectedFarmId: '',
  zones: [],
  selectedZoneId: '',
  latitude: undefined,
  longitude: undefined,
  locationName: undefined,
  locationStatus: 'NOT_REQUESTED',
  selectedCrop: '',
  growthStage: 'Flowering',
  selectedPlantParts: ['Leaf'],
  selectedSymptoms: ['Spots', 'Yellowing'],
  severity: 'HIGH',
  distribution: 'One section of the zone',
  symptomDuration: '4–7 days ago',
  farmerNotes: '',
  uploadedImages: [],
  qualityValidationPassed: false,
  cropValidationPassed: false,
  analysisResult: null,
};

const DiagnosisWizardContext = createContext<DiagnosisWizardContextType | undefined>(undefined);

export const DiagnosisWizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WizardState>(defaultState);

  const actions: WizardActions = {
    setFarms: (farms) => setState((s) => ({ ...s, farms })),
    setSelectedFarmId: (selectedFarmId) => setState((s) => ({ ...s, selectedFarmId })),
    setZones: (zones) => setState((s) => ({ ...s, zones })),
    setSelectedZoneId: (selectedZoneId) => setState((s) => ({ ...s, selectedZoneId })),
    setLocationData: (data) => setState((s) => ({
      ...s,
      latitude: data.latitude !== undefined ? data.latitude : s.latitude,
      longitude: data.longitude !== undefined ? data.longitude : s.longitude,
      locationName: data.locationName !== undefined ? data.locationName : s.locationName,
      locationStatus: data.locationStatus !== undefined ? data.locationStatus : s.locationStatus,
    })),
    setSelectedCrop: (selectedCrop) => setState((s) => ({ ...s, selectedCrop })),
    setGrowthStage: (growthStage) => setState((s) => ({ ...s, growthStage })),
    setSelectedPlantParts: (selectedPlantParts) => setState((s) => ({ ...s, selectedPlantParts })),
    setSelectedSymptoms: (selectedSymptoms) => setState((s) => ({ ...s, selectedSymptoms })),
    setSeverity: (severity) => setState((s) => ({ ...s, severity })),
    setDistribution: (distribution) => setState((s) => ({ ...s, distribution })),
    setSymptomDuration: (symptomDuration) => setState((s) => ({ ...s, symptomDuration })),
    setFarmerNotes: (farmerNotes) => setState((s) => ({ ...s, farmerNotes })),
    setUploadedImages: (uploadedImages) => setState((s) => ({ ...s, uploadedImages })),
    setQualityValidationPassed: (qualityValidationPassed) => setState((s) => ({ ...s, qualityValidationPassed })),
    setCropValidationPassed: (cropValidationPassed) => setState((s) => ({ ...s, cropValidationPassed })),
    setAnalysisResult: (analysisResult) => setState((s) => ({ ...s, analysisResult })),
  };

  return (
    <DiagnosisWizardContext.Provider value={{ ...state, ...actions }}>
      {children}
    </DiagnosisWizardContext.Provider>
  );
};

export const useDiagnosisWizard = () => {
  const context = useContext(DiagnosisWizardContext);
  if (!context) {
    throw new Error('useDiagnosisWizard must be used within a DiagnosisWizardProvider');
  }
  return context;
};
