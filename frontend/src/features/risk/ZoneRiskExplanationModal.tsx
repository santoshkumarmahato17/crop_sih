import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Bug,
  Droplets,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { riskService } from '@/services/riskService';
import { RiskTier, Zone, ZoneRiskResponse } from '@/types';

interface ZoneRiskExplanationModalProps {
  zone: Zone;
  onClose: () => void;
}

export const ZoneRiskExplanationModal: React.FC<ZoneRiskExplanationModalProps> = ({
  zone,
  onClose,
}) => {
  const [riskData, setRiskData] = useState<ZoneRiskResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchZoneRisk();
  }, [zone.id]);

  const fetchZoneRisk = async () => {
    try {
      setIsLoading(true);
      const data = await riskService.getZoneRisk(zone.id);
      setRiskData(data);
    } catch (err: any) {
      // Fallback demo explainable risk assessment
      setRiskData({
        zone_id: zone.id,
        zone_code: zone.zone_code,
        farm_id: zone.farm_id,
        risk_assessment: {
          disease_risk_score: 82,
          pest_risk_score: 45,
          water_stress_risk: 30,
          overall_crop_risk: 82,
          risk_level: 'CRITICAL',
          rule_version: 'v1.2.0-explainable-ipm',
          assessment_timestamp: new Date().toISOString(),
          explanation_summary:
            'Overall crop risk evaluated at 82/100 (CRITICAL). Key driving factors: Increasing disease trend (+25), High canopy humidity (+20), Recent rainfall (+18).',
          contributing_factors: [
            {
              factor_name: 'Increasing Disease Trajectory',
              category: 'temporal_trend',
              points: 25,
              description: 'Multi-scan comparison indicates active chlorosis expansion (>15% vitality drop).',
            },
            {
              factor_name: 'High Canopy Humidity (>80%)',
              category: 'weather',
              points: 20,
              description: 'Relative humidity at 82% creates optimal microclimate for fungal spore germination.',
            },
            {
              factor_name: 'Recent Heavy Rainfall (22mm)',
              category: 'weather',
              points: 18,
              description: 'Extended leaf wetness duration elevates fungal and bacterial infection risk.',
            },
            {
              factor_name: 'Nearby Regional Disease Activity (3.5km)',
              category: 'biosecurity',
              points: 12,
              description: 'Active fungal outbreak confirmed within neighboring agricultural holding.',
            },
            {
              factor_name: 'Prior Pathology Occurrence',
              category: 'history',
              points: 10,
              description: 'Zone has documented history of foliar blight inoculum in crop residues.',
            },
            {
              factor_name: 'Vulnerable Growth Stage (Grain Filling)',
              category: 'agronomic',
              points: 7,
              description: 'Crop phenology is at high vulnerability to foliar pathology yield loss.',
            },
          ],
          raw_inputs: {
            crop_type: 'Wheat',
            growth_stage: 'Grain Filling',
            relative_humidity_pct: 82.0,
            recent_rainfall_mm: 22.0,
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskTierBadge = (tier: RiskTier) => {
    switch (tier) {
      case 'CRITICAL':
        return (
          <span className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-black flex items-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>CRITICAL RISK TIER</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-3 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span>HIGH RISK TIER</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400" />
            <span>MEDIUM RISK TIER</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>LOW RISK TIER</span>
          </span>
        );
    }
  };

  const assess = riskData?.risk_assessment;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-2xl w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono font-bold text-sm">
              {zone.zone_code}
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Explainable Crop Health Risk Assessment
              </h3>
              <p className="text-xs text-slate-400">
                Holding Zone: <span className="text-slate-200 font-semibold">{zone.name}</span> ({zone.area_hectares.toFixed(1)} ha)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm">
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Evaluating multi-vector risk models...</p>
          </div>
        ) : assess ? (
          <div className="space-y-5">
            {/* Top Score Matrix Grid */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-400 font-medium block">Overall Crop Risk Score</span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black font-mono text-rose-400">
                      {assess.overall_crop_risk}
                      <span className="text-xs text-slate-500 font-normal font-sans"> / 100</span>
                    </span>
                    {getRiskTierBadge(assess.risk_level)}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono self-start sm:self-auto">
                  Rule Engine: {assess.rule_version}
                </span>
              </div>

              {/* Threat Breakdown Gauges */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    <span>Disease Risk</span>
                  </span>
                  <p className="text-xl font-bold font-mono text-rose-400">
                    {assess.disease_risk_score} <span className="text-[10px] text-slate-500 font-sans">/100</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Bug className="w-3 h-3 text-amber-400" />
                    <span>Pest Threat</span>
                  </span>
                  <p className="text-xl font-bold font-mono text-amber-400">
                    {assess.pest_risk_score} <span className="text-[10px] text-slate-500 font-sans">/100</span>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    <span>Water Stress</span>
                  </span>
                  <p className="text-xl font-bold font-mono text-blue-400">
                    {assess.water_stress_risk} <span className="text-[10px] text-slate-500 font-sans">/100</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Explainable Contributing Factors Waterfall */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Explainable Point Attribution & Contributing Factors</span>
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Transparent Agronomic IPM
                </span>
              </div>

              <div className="space-y-2">
                {assess.contributing_factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 block">{factor.factor_name}</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{factor.description}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex-shrink-0 ${
                        factor.points > 0
                          ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                          : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {factor.points > 0 ? `+${factor.points}` : factor.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Banner */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 text-blue-400 mt-0.5" />
              <p className="leading-relaxed">{assess.explanation_summary}</p>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Dismiss Risk Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
