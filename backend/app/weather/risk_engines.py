from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from app.weather.analyzer import EnvironmentalSignalAnalysis, WeatherConditionAnalyzer, WeatherSignal
from app.weather.provider import WeatherDataPoint


class RiskTier(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class WaterStressTier(str, Enum):
    ADEQUATE = "ADEQUATE"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class RiskTrend(str, Enum):
    STABLE = "STABLE"
    RISING = "RISING"
    FALLING = "FALLING"
    RAPIDLY_RISING = "RAPIDLY_RISING"
    RAPIDLY_FALLING = "RAPIDLY_FALLING"


@dataclass
class CropAgronomicContext:
    """Agronomic metadata contextualizing crop vulnerability."""
    crop_type: str = "Wheat"
    growth_stage: str = "Flowering / Heading"
    current_health_score: float = 80.0  # 0 to 100
    health_trend: str = "STABLE"  # IMPROVING, STABLE, DECLINING
    recent_disease_count: int = 0
    recent_pest_count: int = 0
    has_fungal_history: bool = True
    has_pest_history: bool = False
    cwsi_index: float = 0.45  # 0.0 to 1.0 Crop Water Stress Index
    soil_moisture_pct: Optional[float] = 45.0
    drone_canopy_temp_c: Optional[float] = 27.5


@dataclass
class RiskFactorItem:
    """Individual explainable factor attribution."""
    factor_name: str
    impact_level: str  # "HIGH", "MODERATE", "LOW"
    points_delta: int
    description: str


@dataclass
class SingleRiskScoreResult:
    """Evaluation result for a specific agronomic threat vector."""
    risk_type: str  # "DISEASE", "PEST", "WATER_STRESS", "OVERALL"
    score: int  # 0 to 100
    tier: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidence_pct: int  # 0 to 100
    plain_explanation: str
    technical_explanation: str
    contributing_factors: List[RiskFactorItem] = field(default_factory=list)
    rule_version: str = "weather-risk-v1"


@dataclass
class DailyForecastRiskItem:
    """Single day forward risk estimate."""
    day_offset: int
    forecast_date: datetime
    weather_summary: str
    temperature_c: float
    relative_humidity_pct: float
    expected_rainfall_mm: float
    disease_risk_score: int
    disease_tier: str
    pest_risk_score: int
    pest_tier: str
    water_stress_score: int
    water_stress_tier: str
    overall_risk_score: int
    overall_tier: str
    confidence_pct: int
    primary_explanation: str


@dataclass
class FullWeatherRiskAssessment:
    """Complete multi-horizon weather risk forecast dossier."""
    farm_id: str
    zone_id: Optional[str]
    evaluated_at: datetime
    horizon_days: int
    current_weather: WeatherDataPoint
    current_disease_risk: SingleRiskScoreResult
    current_pest_risk: SingleRiskScoreResult
    current_water_stress: SingleRiskScoreResult
    current_overall_risk: SingleRiskScoreResult
    risk_trend: RiskTrend
    forecast_timeline: List[DailyForecastRiskItem]
    adaptive_monitoring_recommendation: str
    recommended_inspection_interval_days: int
    rule_version: str = "weather-risk-v1"


class DiseaseRiskEngine:
    """Calculates crop pathology infection vulnerability without clinical certainty overclaims."""

    @staticmethod
    def evaluate(
        weather: WeatherDataPoint,
        signals: EnvironmentalSignalAnalysis,
        crop: CropAgronomicContext,
    ) -> SingleRiskScoreResult:
        factors: List[RiskFactorItem] = []
        base_score = 15

        # 1. Weather Signal Impact
        if WeatherSignal.HIGH_HUMIDITY in signals.signals:
            pts = 22
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Elevated Canopy Humidity",
                    impact_level="HIGH",
                    points_delta=pts,
                    description=f"Relative humidity at {weather.relative_humidity_percent:.1f}% creates favorable leaf wetness for fungal spore germination.",
                )
            )

        if WeatherSignal.HEAVY_RAIN in signals.signals or WeatherSignal.WET_PERIOD in signals.signals:
            pts = 18
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Persistent Wetness & Rain",
                    impact_level="HIGH",
                    points_delta=pts,
                    description=f"Rainfall event ({weather.rainfall_mm:.1f}mm) promotes splash dispersal and sustained foliar moisture.",
                )
            )

        # 2. Crop Growth Stage Vulnerability
        stage_lower = crop.growth_stage.lower()
        if any(s in stage_lower for s in ["flower", "heading", "grain fill", "fruiting", "tillering"]):
            pts = 15
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Susceptible Crop Growth Stage",
                    impact_level="MODERATE",
                    points_delta=pts,
                    description=f"{crop.crop_type} in {crop.growth_stage} is agronomically vulnerable to foliar fungal and bacterial pathogens.",
                )
            )

        # 3. Historical Pathogen Presence
        if crop.has_fungal_history or crop.recent_disease_count > 0:
            pts = 14
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Historical / Regional Pathogen Inoculum",
                    impact_level="MODERATE",
                    points_delta=pts,
                    description="Known presence of pathogen spores in zone or surrounding agro-basin elevates incubation probability.",
                )
            )

        # 4. Existing Crop Health Trajectory
        if crop.health_trend in ["DECLINING", "RAPIDLY_DECLINING"] or crop.current_health_score < 70:
            pts = 12
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Pre-existing Physiological Weakness",
                    impact_level="MODERATE",
                    points_delta=pts,
                    description=f"Canopy health score ({crop.current_health_score:.0f}%) indicates reduced systemic disease resistance.",
                )
            )

        score = max(5, min(95, base_score))

        # Determine Tier
        if score >= 75:
            tier = RiskTier.CRITICAL.value
        elif score >= 55:
            tier = RiskTier.HIGH.value
        elif score >= 35:
            tier = RiskTier.MEDIUM.value
        else:
            tier = RiskTier.LOW.value

        # Plain vs Technical Explanations
        if tier in [RiskTier.CRITICAL.value, RiskTier.HIGH.value]:
            plain = f"Conditions indicate elevated risk of disease development due to high humidity ({weather.relative_humidity_percent:.0f}%) and susceptible {crop.growth_stage} stage."
        elif tier == RiskTier.MEDIUM.value:
            plain = f"Moderate disease risk. Microclimate conditions are moderately favorable for fungal sporulation."
        else:
            plain = f"Low disease risk. Environmental conditions are not conducive to rapid pathogen spread."

        tech = f"Pathology index evaluated at {score}/100. Leaf wetness index: {signals.leaf_wetness_hours_estimate:.1f}h. Inoculum weighting: {'Active' if crop.has_fungal_history else 'Baseline'}."

        confidence = 88 if weather.rainfall_duration_hours is not None else 76

        return SingleRiskScoreResult(
            risk_type="DISEASE",
            score=score,
            tier=tier,
            confidence_pct=confidence,
            plain_explanation=plain,
            technical_explanation=tech,
            contributing_factors=factors,
        )


class PestRiskEngine:
    """Calculates entomological pest reproduction and activity risk."""

    @staticmethod
    def evaluate(
        weather: WeatherDataPoint,
        signals: EnvironmentalSignalAnalysis,
        crop: CropAgronomicContext,
    ) -> SingleRiskScoreResult:
        factors: List[RiskFactorItem] = []
        base_score = 10

        # Thermal Optimum: 24°C - 34°C
        if 24.0 <= weather.temperature_c <= 34.0:
            pts = 20
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Optimal Thermal Range",
                    impact_level="HIGH",
                    points_delta=pts,
                    description=f"Ambient temperature ({weather.temperature_c:.1f}°C) falls within the optimal thermal window for insect pest metabolism.",
                )
            )

        # Humidity Factor (Moderate-to-high humidity supports nymph survival)
        if 55.0 <= weather.relative_humidity_percent <= 85.0:
            pts = 12
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Favorable Microclimate Humidity",
                    impact_level="MODERATE",
                    points_delta=pts,
                    description=f"Canopy humidity ({weather.relative_humidity_percent:.1f}%) prevents desiccation of insect larvae.",
                )
            )

        # High Wind facilitates aerial migration of aphids / whiteflies
        if WeatherSignal.HIGH_WIND in signals.signals:
            pts = 10
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Wind-Borne Migration Vector",
                    impact_level="LOW",
                    points_delta=pts,
                    description=f"Wind speeds ({weather.wind_speed_mps:.1f} m/s) support passive dispersal of vector pests.",
                )
            )

        if crop.has_pest_history or crop.recent_pest_count > 0:
            pts = 15
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Past Pest Infestation History",
                    impact_level="MODERATE",
                    points_delta=pts,
                    description="Historical pest pressure indicates presence of overwintering pupae or regional egg clusters.",
                )
            )

        score = max(5, min(92, base_score))

        if score >= 75:
            tier = RiskTier.CRITICAL.value
        elif score >= 55:
            tier = RiskTier.HIGH.value
        elif score >= 35:
            tier = RiskTier.MEDIUM.value
        else:
            tier = RiskTier.LOW.value

        if tier in [RiskTier.CRITICAL.value, RiskTier.HIGH.value]:
            plain = f"Weather conditions may favor pest activity due to warm temperatures ({weather.temperature_c:.1f}°C) and favorable canopy humidity."
        else:
            plain = f"Pest activity risk is currently {tier.lower()}. Weather conditions are not actively accelerating pest outbreaks."

        tech = f"Entomological index: {score}/100. Thermal degree-day suitability: {signals.microclimate_pest_suitability:.2f}."

        return SingleRiskScoreResult(
            risk_type="PEST",
            score=score,
            tier=tier,
            confidence_pct=82,
            plain_explanation=plain,
            technical_explanation=tech,
            contributing_factors=factors,
        )


class WaterStressRiskEngine:
    """Calculates crop water deficit and thermal evapotranspiration stress."""

    @staticmethod
    def evaluate(
        weather: WeatherDataPoint,
        signals: EnvironmentalSignalAnalysis,
        crop: CropAgronomicContext,
    ) -> SingleRiskScoreResult:
        factors: List[RiskFactorItem] = []
        base_score = 10

        # 1. Thermal & Evapotranspiration
        if weather.temperature_c >= 33.0 or WeatherSignal.HIGH_TEMPERATURE in signals.signals:
            pts = 25
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="High Ambient Temperature",
                    impact_level="HIGH",
                    points_delta=pts,
                    description=f"Elevated temperatures ({weather.temperature_c:.1f}°C) dramatically increase crop evapotranspiration demand.",
                )
            )

        # 2. Rainfall Mitigation or Deficit
        if weather.rainfall_mm < 2.0:
            pts = 20
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Absence of Precipitation",
                    impact_level="HIGH",
                    points_delta=pts,
                    description="Dry conditions without scheduled irrigation cycle deplete root zone moisture.",
                )
            )
        else:
            # Significant rain reduces water stress
            base_score = max(5, base_score - int(weather.rainfall_mm * 1.5))

        # 3. CWSI & Soil Moisture Inputs
        if crop.cwsi_index >= 0.65:
            pts = 22
            base_score += pts
            factors.append(
                RiskFactorItem(
                    factor_name="Elevated CWSI Stress Index",
                    impact_level="HIGH",
                    points_delta=pts,
                    description=f"Crop Water Stress Index ({crop.cwsi_index:.2f}) confirms high stomatal closure and thermal distress.",
                )
            )

        score = max(5, min(95, base_score))

        if score >= 75:
            tier = WaterStressTier.CRITICAL.value
        elif score >= 55:
            tier = WaterStressTier.HIGH.value
        elif score >= 35:
            tier = WaterStressTier.MODERATE.value
        else:
            tier = WaterStressTier.ADEQUATE.value

        if tier in [WaterStressTier.CRITICAL.value, WaterStressTier.HIGH.value]:
            plain = f"Water stress risk is elevated due to dry conditions and warm temperatures ({weather.temperature_c:.1f}°C). Check soil moisture."
        else:
            plain = f"Water stress risk is currently {tier.lower()}. Soil moisture and canopy transpiration are in balance."

        tech = f"Hydrological stress score: {score}/100. CWSI telemetry: {crop.cwsi_index:.2f}. Deficit coefficient: {signals.microclimate_water_deficit:.2f}."

        return SingleRiskScoreResult(
            risk_type="WATER_STRESS",
            score=score,
            tier=tier,
            confidence_pct=85,
            plain_explanation=plain,
            technical_explanation=tech,
            contributing_factors=factors,
        )


class WeatherRiskForecastEngine:
    """Master multi-vector risk engine calculating multi-day risk forecasts and trends."""

    @classmethod
    def evaluate_farm_or_zone(
        cls,
        farm_id: str,
        current_weather: WeatherDataPoint,
        forecast_points: List[WeatherDataPoint],
        crop_context: CropAgronomicContext,
        zone_id: Optional[str] = None,
        horizon_days: int = 7,
    ) -> FullWeatherRiskAssessment:
        now = datetime.now(timezone.utc)
        cur_signals = WeatherConditionAnalyzer.analyze_point(current_weather)

        # 1. Current Risk Vectors
        cur_disease = DiseaseRiskEngine.evaluate(current_weather, cur_signals, crop_context)
        cur_pest = PestRiskEngine.evaluate(current_weather, cur_signals, crop_context)
        cur_water = WaterStressRiskEngine.evaluate(current_weather, cur_signals, crop_context)

        # Overall composite: weighted combination
        overall_score = int(round(cur_disease.score * 0.45 + cur_pest.score * 0.30 + cur_water.score * 0.25))
        overall_tier = (
            RiskTier.CRITICAL.value if overall_score >= 75
            else RiskTier.HIGH.value if overall_score >= 55
            else RiskTier.MEDIUM.value if overall_score >= 35
            else RiskTier.LOW.value
        )
        cur_overall = SingleRiskScoreResult(
            risk_type="OVERALL",
            score=overall_score,
            tier=overall_tier,
            confidence_pct=int(round((cur_disease.confidence_pct + cur_pest.confidence_pct + cur_water.confidence_pct) / 3)),
            plain_explanation=f"Overall crop threat index is {overall_tier.lower()} ({overall_score}/100) driven primarily by {cur_disease.tier.lower()} disease risk.",
            technical_explanation=f"Composite risk metric: Disease={cur_disease.score}, Pest={cur_pest.score}, Water={cur_water.score}.",
        )

        # 2. Multi-Day Forward Forecast Timeline
        timeline: List[DailyForecastRiskItem] = []
        scores_for_trend: List[int] = [overall_score]

        prev_pt = current_weather
        for i, pt in enumerate(forecast_points[:horizon_days]):
            signals = WeatherConditionAnalyzer.analyze_point(pt, prev_point=prev_pt)
            d_res = DiseaseRiskEngine.evaluate(pt, signals, crop_context)
            p_res = PestRiskEngine.evaluate(pt, signals, crop_context)
            w_res = WaterStressRiskEngine.evaluate(pt, signals, crop_context)

            day_overall = int(round(d_res.score * 0.45 + p_res.score * 0.30 + w_res.score * 0.25))
            day_tier = (
                RiskTier.CRITICAL.value if day_overall >= 75
                else RiskTier.HIGH.value if day_overall >= 55
                else RiskTier.MEDIUM.value if day_overall >= 35
                else RiskTier.LOW.value
            )

            # Confidence decays with forecast distance
            day_confidence = max(55, cur_overall.confidence_pct - (i * 3))

            timeline.append(
                DailyForecastRiskItem(
                    day_offset=i,
                    forecast_date=pt.timestamp,
                    weather_summary=pt.condition_text or ("Rainy" if pt.rainfall_mm > 5 else "Clear"),
                    temperature_c=pt.temperature_c,
                    relative_humidity_pct=pt.relative_humidity_percent,
                    expected_rainfall_mm=pt.rainfall_mm,
                    disease_risk_score=d_res.score,
                    disease_tier=d_res.tier,
                    pest_risk_score=p_res.score,
                    pest_tier=p_res.tier,
                    water_stress_score=w_res.score,
                    water_stress_tier=w_res.tier,
                    overall_risk_score=day_overall,
                    overall_tier=day_tier,
                    confidence_pct=day_confidence,
                    primary_explanation=d_res.plain_explanation if d_res.score >= p_res.score else p_res.plain_explanation,
                )
            )
            scores_for_trend.append(day_overall)
            prev_pt = pt

        # 3. Trend Calculation
        if len(scores_for_trend) >= 3:
            first_half = scores_for_trend[0]
            max_future = max(scores_for_trend[1:4])
            diff = max_future - first_half
            if diff >= 25:
                trend = RiskTrend.RAPIDLY_RISING
            elif diff >= 10:
                trend = RiskTrend.RISING
            elif diff <= -20:
                trend = RiskTrend.RAPIDLY_FALLING
            elif diff <= -8:
                trend = RiskTrend.FALLING
            else:
                trend = RiskTrend.STABLE
        else:
            trend = RiskTrend.STABLE

        # 4. Adaptive Monitoring Recommendation
        max_horizon_score = max(scores_for_trend)
        if max_horizon_score >= 75:
            interval = 1
            rec = "CRITICAL: Immediate targeted field inspection and bio-fungicide verification recommended within 24 hours."
        elif max_horizon_score >= 55:
            interval = 2
            rec = "HIGH: Scheduled drone multi-spectral surveillance recommended within 48 hours."
        elif max_horizon_score >= 35:
            interval = 4
            rec = "MEDIUM: Standard 4-day monitoring cycle recommended."
        else:
            interval = 7
            rec = "LOW: Routine 7-day monitoring interval sufficient."

        return FullWeatherRiskAssessment(
            farm_id=farm_id,
            zone_id=zone_id,
            evaluated_at=now,
            horizon_days=horizon_days,
            current_weather=current_weather,
            current_disease_risk=cur_disease,
            current_pest_risk=cur_pest,
            current_water_stress=cur_water,
            current_overall_risk=cur_overall,
            risk_trend=trend,
            forecast_timeline=timeline,
            adaptive_monitoring_recommendation=rec,
            recommended_inspection_interval_days=interval,
            rule_version="weather-risk-v1",
        )
