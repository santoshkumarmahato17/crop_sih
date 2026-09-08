import { apiClient } from './apiClient';
import {
  FarmWeatherRiskResponse,
  RegionalRiskResponse,
  WeatherObservationData,
} from '@/types/weatherRisk';

/** Extended type that adds a frontend-only mock indicator flag */
export type WeatherRiskDataWithMeta = FarmWeatherRiskResponse & {
  _is_mock_fallback?: boolean;
};

export interface AccuWeatherData {
  temp_celsius: number;
  condition: string;
  humidity_percent: number;
  precipitation_mm: number;
  wind_kmh: number;
  is_day_time: boolean;
  location_name: string;
  weather_text: string;
}

export const mockFarmWeatherRiskData: FarmWeatherRiskResponse = {
  farm_id: 'farm-cbe-01',
  farm_name: 'Ramanathan Precision Wheat & Paddy Estate',
  evaluated_at: new Date().toISOString(),
  horizon_days: 7,
  current_weather: {
    timestamp: new Date().toISOString(),
    temperature_c: 28.5,
    min_temperature_c: 21.0,
    max_temperature_c: 31.5,
    relative_humidity_percent: 84.0,
    rainfall_mm: 14.5,
    rainfall_probability_percent: 75.0,
    rainfall_duration_hours: 3.5,
    wind_speed_mps: 3.8,
    wind_direction_deg: 225.0,
    solar_radiation_w_m2: 520.0,
    cloud_cover_percent: 70.0,
    soil_moisture_percent: 44.0,
    condition_text: 'Humid & Intermittent Rain',
    source: 'in_situ_microclimate_station',
    is_forecast: false,
  },
  current_disease_risk: {
    risk_type: 'DISEASE',
    score: 78,
    tier: 'HIGH',
    confidence_pct: 88,
    plain_explanation: 'High humidity and recent rainfall increase disease risk during susceptible heading stage.',
    technical_explanation: 'Pathology vulnerability index 78/100. Leaf wetness duration exceeds 6.2 hours.',
    contributing_factors: [
      {
        factor_name: 'Elevated Canopy Humidity',
        impact_level: 'HIGH',
        points_delta: 22,
        description: 'Relative humidity (84%) creates optimal conditions for Puccinia striiformis spore germination.',
      },
      {
        factor_name: 'Recent Rainfall & Leaf Wetness',
        impact_level: 'HIGH',
        points_delta: 18,
        description: 'Rainfall of 14.5mm sustains continuous free moisture on leaf blades.',
      },
      {
        factor_name: 'Susceptible Growth Stage',
        impact_level: 'MODERATE',
        points_delta: 15,
        description: 'Wheat in Flowering / Heading stage has elevated foliar disease susceptibility.',
      },
    ],
    rule_version: 'weather-risk-v1',
  },
  current_pest_risk: {
    risk_type: 'PEST',
    score: 51,
    tier: 'MEDIUM',
    confidence_pct: 82,
    plain_explanation: 'Weather conditions moderately favor pest activity with warm daytime temperatures.',
    technical_explanation: 'Entomological index: 51/100. Thermal degree-day suitability: 0.65.',
    contributing_factors: [
      {
        factor_name: 'Optimal Thermal Window',
        impact_level: 'MODERATE',
        points_delta: 20,
        description: '28.5°C temperature supports insect pest metabolism without thermal distress.',
      },
    ],
    rule_version: 'weather-risk-v1',
  },
  current_water_stress: {
    risk_type: 'WATER_STRESS',
    score: 22,
    tier: 'ADEQUATE',
    confidence_pct: 85,
    plain_explanation: 'Water stress risk is low. Recent rain and balanced soil moisture maintain optimal canopy hydration.',
    technical_explanation: 'Hydrological stress score: 22/100. CWSI telemetry: 0.32.',
    contributing_factors: [],
    rule_version: 'weather-risk-v1',
  },
  current_overall_risk: {
    risk_type: 'OVERALL',
    score: 64,
    tier: 'HIGH',
    confidence_pct: 85,
    plain_explanation: 'Overall crop risk is HIGH (64/100) driven by escalating foliar disease pressure.',
    technical_explanation: 'Composite weighted evaluation: Disease (78), Pest (51), Water Stress (22).',
    rule_version: 'weather-risk-v1',
  },
  risk_trend: 'RISING',
  forecast_timeline: [
    {
      day_offset: 0,
      forecast_date: new Date().toISOString(),
      weather_summary: 'Scattered Showers',
      temperature_c: 28.5,
      relative_humidity_pct: 84.0,
      expected_rainfall_mm: 14.5,
      disease_risk_score: 78,
      disease_tier: 'HIGH',
      pest_risk_score: 51,
      pest_tier: 'MEDIUM',
      water_stress_score: 22,
      water_stress_tier: 'ADEQUATE',
      overall_risk_score: 64,
      overall_tier: 'HIGH',
      confidence_pct: 88,
      primary_explanation: 'High humidity and rainfall promote fungal spore incubation.',
    },
    {
      day_offset: 1,
      forecast_date: new Date(Date.now() + 86400000).toISOString(),
      weather_summary: 'Heavy Rain & Humid',
      temperature_c: 27.2,
      relative_humidity_pct: 89.0,
      expected_rainfall_mm: 28.0,
      disease_risk_score: 84,
      disease_tier: 'CRITICAL',
      pest_risk_score: 48,
      pest_tier: 'MEDIUM',
      water_stress_score: 12,
      water_stress_tier: 'ADEQUATE',
      overall_risk_score: 72,
      overall_tier: 'HIGH',
      confidence_pct: 85,
      primary_explanation: 'Heavy precipitation event creates critical leaf wetness duration.',
    },
    {
      day_offset: 2,
      forecast_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      weather_summary: 'Monsoonal Rain',
      temperature_c: 26.5,
      relative_humidity_pct: 91.0,
      expected_rainfall_mm: 35.0,
      disease_risk_score: 89,
      disease_tier: 'CRITICAL',
      pest_risk_score: 42,
      pest_tier: 'MEDIUM',
      water_stress_score: 8,
      water_stress_tier: 'ADEQUATE',
      overall_risk_score: 78,
      overall_tier: 'CRITICAL',
      confidence_pct: 82,
      primary_explanation: 'Prolonged rainfall accelerates Yellow Rust and bacterial blight risk.',
    },
    {
      day_offset: 3,
      forecast_date: new Date(Date.now() + 86400000 * 3).toISOString(),
      weather_summary: 'Humid & Overcast',
      temperature_c: 27.5,
      relative_humidity_pct: 85.0,
      expected_rainfall_mm: 12.0,
      disease_risk_score: 82,
      disease_tier: 'CRITICAL',
      pest_risk_score: 55,
      pest_tier: 'MEDIUM',
      water_stress_score: 18,
      water_stress_tier: 'ADEQUATE',
      overall_risk_score: 74,
      overall_tier: 'HIGH',
      confidence_pct: 79,
      primary_explanation: 'Persistent cloud cover and moisture sustain secondary infections.',
    },
    {
      day_offset: 4,
      forecast_date: new Date(Date.now() + 86400000 * 4).toISOString(),
      weather_summary: 'Warm & Humid',
      temperature_c: 29.8,
      relative_humidity_pct: 76.0,
      expected_rainfall_mm: 4.0,
      disease_risk_score: 68,
      disease_tier: 'HIGH',
      pest_risk_score: 64,
      pest_tier: 'HIGH',
      water_stress_score: 28,
      water_stress_tier: 'ADEQUATE',
      overall_risk_score: 62,
      overall_tier: 'HIGH',
      confidence_pct: 75,
      primary_explanation: 'Warming conditions increase pest activity while disease risk stabilizes.',
    },
    {
      day_offset: 5,
      forecast_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      weather_summary: 'Sunny Intervals',
      temperature_c: 31.5,
      relative_humidity_pct: 65.0,
      expected_rainfall_mm: 0.0,
      disease_risk_score: 52,
      disease_tier: 'MEDIUM',
      pest_risk_score: 68,
      pest_tier: 'HIGH',
      water_stress_score: 42,
      water_stress_tier: 'MODERATE',
      overall_risk_score: 54,
      overall_tier: 'MEDIUM',
      confidence_pct: 72,
      primary_explanation: 'Dry sunshine lowers disease pressure but increases evaporation.',
    },
    {
      day_offset: 6,
      forecast_date: new Date(Date.now() + 86400000 * 6).toISOString(),
      weather_summary: 'Clear & Warm',
      temperature_c: 32.8,
      relative_humidity_pct: 58.0,
      expected_rainfall_mm: 0.0,
      disease_risk_score: 38,
      disease_tier: 'MEDIUM',
      pest_risk_score: 62,
      pest_tier: 'HIGH',
      water_stress_score: 58,
      water_stress_tier: 'HIGH',
      overall_risk_score: 50,
      overall_tier: 'MEDIUM',
      confidence_pct: 68,
      primary_explanation: 'Rising heat and drying soil begin to elevate irrigation requirements.',
    },
  ],
  adaptive_monitoring_recommendation: 'HIGH RISK: Scheduled drone multispectral scan recommended within 48 hours to inspect northern wheat zones for Yellow Rust.',
  recommended_inspection_interval_days: 2,
  rule_version: 'weather-risk-v1',
};

export const weatherService = {
  // Backward compatibility — uses location_name from live weather if available
  async getCurrentConditions(): Promise<AccuWeatherData> {
    const risk = await this.getFarmRiskDossier('farm-cbe-01') as WeatherRiskDataWithMeta;
    const w = risk.current_weather;
    const locationName = w.location_name ?? w.latitude != null
      ? `${(w.latitude as number).toFixed(4)}°, ${(w.longitude as number).toFixed(4)}°`
      : 'Pollachi Agro-Corridor';
    return {
      temp_celsius: w.temperature_c,
      condition: w.condition_text,
      humidity_percent: w.relative_humidity_percent,
      precipitation_mm: w.rainfall_mm,
      wind_kmh: Math.round(w.wind_speed_mps * 3.6),
      is_day_time: true,
      location_name: locationName as string,
      weather_text: w.condition_text,
    };
  },

  async getCurrentWeather(farmId: string = 'farm-cbe-01'): Promise<WeatherObservationData> {
    try {
      const res = await apiClient.get<WeatherObservationData>(`/weather/current/${farmId}`);
      return res.data;
    } catch {
      return mockFarmWeatherRiskData.current_weather;
    }
  },

  async getWeatherForecast(
    farmId: string = 'farm-cbe-01',
    days: number = 7
  ): Promise<WeatherObservationData[]> {
    try {
      const res = await apiClient.get<WeatherObservationData[]>(`/weather/forecast/${farmId}`, {
        params: { days },
      });
      return res.data;
    } catch {
      return mockFarmWeatherRiskData.forecast_timeline.map((item) => ({
        timestamp: item.forecast_date,
        temperature_c: item.temperature_c,
        relative_humidity_percent: item.relative_humidity_pct,
        rainfall_mm: item.expected_rainfall_mm,
        rainfall_probability_percent: item.expected_rainfall_mm > 0 ? 70 : 10,
        wind_speed_mps: 3.5,
        wind_direction_deg: 220,
        condition_text: item.weather_summary,
        source: 'mock_weather_engine',
        is_forecast: true,
      }));
    }
  },

  async getFarmRiskDossier(
    farmId: string = 'farm-cbe-01',
    days: number = 7,
    lat?: number,
    lon?: number
  ): Promise<WeatherRiskDataWithMeta> {
    try {
      const params: any = { days };
      if (lat !== undefined && lon !== undefined) {
        params.lat = lat;
        params.lon = lon;
      }
      const res = await apiClient.get<FarmWeatherRiskResponse>(`/risk/farm/${farmId}`, {
        params,
      });
      if (res.data && res.data.forecast_timeline && res.data.forecast_timeline.length > 0) {
        // Real data from backend — no mock flag
        return res.data as WeatherRiskDataWithMeta;
      }
      // Backend returned empty/invalid — use mock with flag
      return { ...mockFarmWeatherRiskData, _is_mock_fallback: true };
    } catch {
      // Network/auth error — use mock with flag
      return { ...mockFarmWeatherRiskData, _is_mock_fallback: true };
    }
  },

  async getZoneRiskDossier(
    zoneId: string,
    days: number = 7
  ): Promise<FarmWeatherRiskResponse> {
    try {
      const res = await apiClient.get<FarmWeatherRiskResponse>(`/risk/zone/${zoneId}`, {
        params: { days },
      });
      return res.data;
    } catch {
      return {
        ...mockFarmWeatherRiskData,
        zone_id: zoneId,
      };
    }
  },

  async getRegionalRiskIntelligence(): Promise<RegionalRiskResponse> {
    try {
      const res = await apiClient.get<RegionalRiskResponse>('/risk/region');
      return res.data;
    } catch {
      return {
        jurisdiction: 'Coimbatore & Western Ghats Agro-Ecological Basin (Zone IV)',
        evaluated_at: new Date().toISOString(),
        total_monitored_farms: 12,
        critical_hotspots_count: 3,
        high_risk_hotspots_count: 4,
        moderate_risk_count: 3,
        dominant_weather_pattern: 'Active Monsoonal Inflow • High Humidity (>82%) & Intermittent Rain',
        hotspots: [
          {
            farm_id: 'farm-cbe-01',
            farm_name: 'Ramanathan Precision Wheat & Paddy Estate',
            location_name: 'Pollachi Agro-Belt, Coimbatore',
            crop_type: 'Wheat (PBW-550)',
            overall_risk_score: 88,
            risk_tier: 'CRITICAL',
            disease_risk_score: 92,
            pest_risk_score: 68,
            water_stress_score: 78,
            risk_trend: 'RAPIDLY_RISING',
            recommended_action: 'Dispatch emergency foliar bio-fungicide verification and drone scan.',
          },
          {
            farm_id: 'farm-tnj-02',
            farm_name: 'Cauvery Delta High-Yield Rice Cooperative',
            location_name: 'Kumbakonam Delta Sector, Thanjavur',
            crop_type: 'Paddy Rice (CR-1009)',
            overall_risk_score: 92,
            risk_tier: 'CRITICAL',
            disease_risk_score: 94,
            pest_risk_score: 72,
            water_stress_score: 42,
            risk_trend: 'RISING',
            recommended_action: 'Field inspection for Bacterial Leaf Blight and water drainage calibration.',
          },
          {
            farm_id: 'farm-slm-03',
            farm_name: 'Attur Organic Cotton & Sweet Corn Farm',
            location_name: 'Attur Agro-Belt, Salem',
            crop_type: 'Bt Cotton & Sweet Corn',
            overall_risk_score: 85,
            risk_tier: 'CRITICAL',
            disease_risk_score: 82,
            pest_risk_score: 88,
            water_stress_score: 81,
            risk_trend: 'RISING',
            recommended_action: 'Pheromone trap deployment and targeted IPM intervention.',
          },
        ],
      };
    }
  },

  async recalculateRisk(farmId: string = 'farm-cbe-01') {
    return apiClient.post(`/risk/recalculate/${farmId}`);
  },
};
