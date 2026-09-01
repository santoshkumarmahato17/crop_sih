import React, { useState } from 'react';
import {
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Bug,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
} from 'lucide-react';
import { FarmWeatherRiskResponse, DailyForecastRiskData } from '@/types/weatherRisk';

interface WeatherRiskForecastCardProps {
  riskData: FarmWeatherRiskResponse;
  onRefresh?: () => void;
  onHorizonChange?: (days: number) => void;
  selectedHorizon?: number;
  isLoading?: boolean;
}

export const WeatherRiskForecastCard: React.FC<WeatherRiskForecastCardProps> = ({
  riskData,
  onRefresh,
  onHorizonChange,
  selectedHorizon = 7,
  isLoading = false,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [selectedForecastDay, setSelectedForecastDay] = useState<number>(0);

  const curWeather = riskData.current_weather;
  const curDisease = riskData.current_disease_risk;
  const curPest = riskData.current_pest_risk;
  const curWater = riskData.current_water_stress;

  const activeForecast: DailyForecastRiskData =
    riskData.forecast_timeline[selectedForecastDay] || riskData.forecast_timeline[0];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'CRITICAL':
        return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH':
        return 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM':
      case 'MODERATE':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend.includes('RISING')) {
      return (
        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{trend.replace('_', ' ')}</span>
        </span>
      );
    } else if (trend.includes('FALLING')) {
      return (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>{trend.replace('_', ' ')}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-bold">
        <Minus className="w-3.5 h-3.5" />
        <span>STABLE</span>
      </span>
    );
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-6 p-6 transition">
      {/* ── 1. Top Header: Weather Telemetry & Trend ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-xs font-black flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Weather-Based Risk Forecasting</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Model: {riskData.rule_version}
            </span>
            {getTrendIcon(riskData.risk_trend)}
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Microclimate Telemetry & Predictive Epidemic Risk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current Farm: <strong className="text-slate-800 dark:text-slate-200">{riskData.farm_name}</strong> • Updated {new Date(riskData.evaluated_at).toLocaleTimeString()}
          </p>
        </div>

        {/* Horizon Picker & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            {[3, 5, 7].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onHorizonChange?.(days)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  selectedHorizon === days
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="Recalculate Weather Risk"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Current Weather Quick Telemetry Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Temperature</span>
            <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">
              {curWeather.temperature_c.toFixed(1)}°C
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Humidity</span>
            <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">
              {curWeather.relative_humidity_percent.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Rainfall</span>
            <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">
              {curWeather.rainfall_mm.toFixed(1)} mm
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Wind Speed</span>
            <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">
              {curWeather.wind_speed_mps.toFixed(1)} m/s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">Microclimate</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
              {curWeather.condition_text}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Current Threat Vectors Matrix (Disease, Pest, Water Stress) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Disease Risk */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Crop Disease Risk</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${getTierColor(curDisease.tier)}`}>
                {curDisease.tier}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">{curDisease.score}</span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {curDisease.plain_explanation}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Forecast Confidence:</span>
            <strong className="text-slate-700 dark:text-slate-300 font-bold">{curDisease.confidence_pct}%</strong>
          </div>
        </div>

        {/* Pest Risk */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-amber-500" />
                <span>Pest Activity Risk</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${getTierColor(curPest.tier)}`}>
                {curPest.tier}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{curPest.score}</span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {curPest.plain_explanation}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Forecast Confidence:</span>
            <strong className="text-slate-700 dark:text-slate-300 font-bold">{curPest.confidence_pct}%</strong>
          </div>
        </div>

        {/* Water Stress */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-500" />
                <span>Water Stress Risk</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${getTierColor(curWater.tier)}`}>
                {curWater.tier}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-sky-600 dark:text-sky-400">{curWater.score}</span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {curWater.plain_explanation}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Forecast Confidence:</span>
            <strong className="text-slate-700 dark:text-slate-300 font-bold">{curWater.confidence_pct}%</strong>
          </div>
        </div>
      </div>

      {/* ── 4. Multi-Day Forecast Timeline Slider & Daily Breakdown ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-500" />
            <span>Forward Risk Forecast Timeline ({selectedHorizon} Days)</span>
          </h3>
          <span className="text-xs text-slate-400">Click a day to inspect forecast</span>
        </div>

        {/* Days Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {riskData.forecast_timeline.slice(0, selectedHorizon).map((item, idx) => {
            const isSelected = selectedForecastDay === idx;
            const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : `Day ${idx}`;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedForecastDay(idx)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-500 shadow-md ring-2 ring-sky-500/30'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{dayName}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${getTierColor(item.overall_tier)}`}>
                    {item.overall_tier.slice(0, 4)}
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                  {item.temperature_c.toFixed(0)}°C • {item.relative_humidity_pct.toFixed(0)}%
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.overall_risk_score >= 75
                        ? 'bg-rose-500'
                        : item.overall_risk_score >= 55
                        ? 'bg-orange-500'
                        : item.overall_risk_score >= 35
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.overall_risk_score}%` }}
                  />
                </div>

                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  Risk: {item.overall_risk_score}/100
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Deep Dive Callout */}
        <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              <span>
                {selectedForecastDay === 0 ? 'Today (Current Assessment)' : `Forecast for ${new Date(activeForecast.forecast_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`}
              </span>
            </span>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {activeForecast.primary_explanation}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono flex-shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 block">Disease</span>
              <strong className="text-rose-600 dark:text-rose-400 font-bold">{activeForecast.disease_risk_score}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Pest</span>
              <strong className="text-amber-600 dark:text-amber-400 font-bold">{activeForecast.pest_risk_score}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Water</span>
              <strong className="text-sky-600 dark:text-sky-400 font-bold">{activeForecast.water_stress_score}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Adaptive Monitoring Recommendation Banner ── */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Recommended Action & Monitoring Cadence
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {riskData.adaptive_monitoring_recommendation}
          </p>
        </div>
      </div>

      {/* ── 6. Expandable Technical & Agronomic Breakdown ── */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold py-1 transition"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-500" />
            <span>{showTechnicalDetails ? 'Hide' : 'View'} Agronomic Factor Attribution & Scientific Details</span>
          </span>
          {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
            <div className="space-y-2">
              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Contributing Risk Factors (+/- Point Attribution)
              </h5>
              <div className="space-y-2">
                {curDisease.contributing_factors?.map((f, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block font-bold">{f.factor_name}</strong>
                      <span className="text-slate-500 text-[11px]">{f.description}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs flex-shrink-0">
                      +{f.points_delta} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <p>Technical Diagnostic Signature: {curDisease.technical_explanation}</p>
              <p>Hydrological Model Calibration: {curWater.technical_explanation}</p>
              <p>Engine Spec: {riskData.rule_version} • Verified for PostGIS Geospatial Bounds</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
