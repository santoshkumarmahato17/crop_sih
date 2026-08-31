from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional


@dataclass
class AdaptivePolicyConfig:
    """Configurable risk interval thresholds."""
    low_risk_days: int = 7
    medium_risk_days: int = 4
    high_risk_days: int = 2
    critical_risk_hours: int = 24


@dataclass
class AdaptiveMonitoringInputs:
    """Multi-factor crop telemetry inputs for dynamic monitoring scheduling."""
    overall_risk_score: int = 74  # 0 to 100
    overall_risk_level: str = "HIGH"  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    disease_risk_score: int = 78
    pest_risk_score: int = 35
    water_stress_score: int = 72
    health_trend: str = "DECLINING"  # "STABLE", "IMPROVING", "DECLINING", "RAPIDLY_DECLINING"
    disease_growth_rate: float = 0.18  # rate of change per day
    recent_rainfall_mm: float = 12.0
    relative_humidity_pct: float = 84.0
    crop_stage: str = "Grain Filling"
    neighbor_spread_risk_score: int = 74
    problem_zone_codes: List[str] = field(default_factory=lambda: ["Z17", "Z18", "Z19"])


@dataclass
class AdaptiveRecommendationResult:
    """Dynamically generated monitoring schedule and mission payload recommendation."""
    monitoring_priority: str  # "ROUTINE", "ELEVATED", "URGENT", "IMMEDIATE_TARGETED"
    recommended_date: datetime
    interval_days: float
    target_zones: List[str]
    reason_for_monitoring: str
    recommended_sensor_payload: List[str]
    recommended_flight_altitude_m: float
    factors_evaluated: Dict[str, Any]


def calculate_adaptive_monitoring_schedule(
    inputs: AdaptiveMonitoringInputs,
    policy: Optional[AdaptivePolicyConfig] = None,
) -> AdaptiveRecommendationResult:
    """
    Computes dynamic risk-adaptive surveillance frequency and target zones.
    
    Policy:
    - LOW: 7-day interval
    - MEDIUM: 4-day interval
    - HIGH: 2-day interval
    - CRITICAL: Immediate targeted inspection (<= 24h)
    """
    cfg = policy or AdaptivePolicyConfig()
    now = datetime.now(timezone.utc)

    # 1. Determine Tier and Interval
    risk_level = inputs.overall_risk_level.upper()
    reasons: List[str] = []

    # Reason synthesis
    if inputs.health_trend in ["DECLINING", "RAPIDLY_DECLINING"]:
        reasons.append("Disease indicators increased during consecutive observations.")
    if inputs.relative_humidity_pct >= 80.0 or inputs.recent_rainfall_mm >= 10.0:
        reasons.append("Elevated canopy humidity creates favorable sporulation conditions.")
    if inputs.neighbor_spread_risk_score >= 60:
        reasons.append("Adjacent holding downwind spore corridor detected.")
    if inputs.water_stress_score >= 70:
        reasons.append("Acute root-zone water stress detected in target quadrants.")

    if not reasons:
        reasons.append("Routine periodic crop health surveillance cycle.")

    full_reason = " ".join(reasons)

    # Sensor payload selection
    payload = ["RGB High-Res 4K"]
    altitude = 60.0

    if risk_level == "CRITICAL" or (not risk_level and inputs.overall_risk_score >= 85):
        priority = "IMMEDIATE_TARGETED"
        interval = cfg.critical_risk_hours / 24.0
        rec_date = now + timedelta(hours=cfg.critical_risk_hours)
        payload = ["Multispectral (NDVI/NDRE)", "Thermal IR", "High-Res 4K RGB"]
        altitude = 35.0  # low altitude for fine lesion resolution
    elif risk_level == "HIGH" or (not risk_level and inputs.overall_risk_score >= 50):
        priority = "URGENT"
        interval = float(cfg.high_risk_days)
        rec_date = now + timedelta(days=cfg.high_risk_days)
        payload = ["Multispectral (NDVI/NDRE)", "Thermal IR"]
        altitude = 45.0
    elif risk_level == "MEDIUM" or inputs.overall_risk_score >= 25:
        priority = "ELEVATED"
        interval = float(cfg.medium_risk_days)
        rec_date = now + timedelta(days=cfg.medium_risk_days)
        payload = ["Multispectral (NDVI)"]
        altitude = 60.0
    else:
        priority = "ROUTINE"
        interval = float(cfg.low_risk_days)
        rec_date = now + timedelta(days=cfg.low_risk_days)
        altitude = 80.0

    target_zones = inputs.problem_zone_codes if inputs.problem_zone_codes else ["Z01", "Z02", "Z03"]

    return AdaptiveRecommendationResult(
        monitoring_priority=priority,
        recommended_date=rec_date,
        interval_days=interval,
        target_zones=target_zones,
        reason_for_monitoring=full_reason,
        recommended_sensor_payload=payload,
        recommended_flight_altitude_m=altitude,
        factors_evaluated={
            "overall_risk_score": inputs.overall_risk_score,
            "overall_risk_level": risk_level,
            "health_trend": inputs.health_trend,
            "disease_risk": inputs.disease_risk_score,
            "neighbor_spread_risk": inputs.neighbor_spread_risk_score,
            "humidity_pct": inputs.relative_humidity_pct,
        },
    )
