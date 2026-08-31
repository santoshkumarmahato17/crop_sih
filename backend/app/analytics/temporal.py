from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class ScanObservationData:
    """Individual scan observation metric point."""
    scan_id: str
    observation_date: datetime
    health_score: float  # 0.0 to 100.0
    mean_ndvi: Optional[float] = None
    mean_ndre: Optional[float] = None
    disease_probability: float = 0.0  # 0.0 to 100.0
    disease_count: int = 0
    max_disease_severity: str = "none"
    pest_probability: float = 0.0  # 0.0 to 100.0
    pest_count: int = 0
    water_stress_cwsi: float = 0.0  # 0.0 to 1.0
    water_stress_category: str = "none"
    anomaly_score: float = 0.0  # 0.0 to 100.0


@dataclass
class TemporalAnalysisResult:
    """Aggregated multi-scan temporal trend analysis."""
    zone_id: str
    total_scans: int
    health_trend: str  # STABLE, IMPROVING, DECLINING, RAPIDLY_DECLINING
    disease_trend: str  # STABLE, IMPROVING, INCREASING, SURGING
    pest_trend: str  # STABLE, IMPROVING, INCREASING, SURGING
    water_stress_trend: str  # STABLE, RELIEVED, INCREASING, CRITICAL
    anomaly_trend: str  # STABLE, DISSIPATING, EXPANDING
    classification: str  # STABLE, IMPROVING, DECLINING, RAPIDLY_DECLINING
    delta_last_scan_percent: float
    delta_total_percent: float
    velocity_per_day: float
    baseline_health: float
    current_health: float
    scans_history: List[ScanObservationData] = field(default_factory=list)


def calculate_temporal_trends(
    zone_id: str, scans: List[ScanObservationData]
) -> TemporalAnalysisResult:
    """
    Computes temporal rate-of-change, multi-scan velocity, and trend classifications.
    Scans must be ordered chronologically (oldest -> newest).
    """
    if not scans:
        return TemporalAnalysisResult(
            zone_id=zone_id,
            total_scans=0,
            health_trend="STABLE",
            disease_trend="STABLE",
            pest_trend="STABLE",
            water_stress_trend="STABLE",
            anomaly_trend="STABLE",
            classification="STABLE",
            delta_last_scan_percent=0.0,
            delta_total_percent=0.0,
            velocity_per_day=0.0,
            baseline_health=100.0,
            current_health=100.0,
            scans_history=[],
        )

    if len(scans) == 1:
        first = scans[0]
        return TemporalAnalysisResult(
            zone_id=zone_id,
            total_scans=1,
            health_trend="STABLE",
            disease_trend="STABLE",
            pest_trend="STABLE",
            water_stress_trend="STABLE",
            anomaly_trend="STABLE",
            classification="STABLE",
            delta_last_scan_percent=0.0,
            delta_total_percent=0.0,
            velocity_per_day=0.0,
            baseline_health=first.health_score,
            current_health=first.health_score,
            scans_history=scans,
        )

    # Scans chronologically ordered: scans[0] = baseline, scans[-1] = latest
    baseline = scans[0]
    latest = scans[-1]
    prev = scans[-2]

    # Health Deltas
    delta_total = latest.health_score - baseline.health_score
    delta_last = latest.health_score - prev.health_score

    # Compute Velocity per Day
    days_elapsed = max(
        1.0, (latest.observation_date - baseline.observation_date).total_seconds() / 86400.0
    )
    velocity_per_day = round(delta_total / days_elapsed, 2)

    # 1. Health Trend Classification
    # Example: 92 -> 86 -> 74 -> 61 (Total drop = -31 points -> RAPIDLY_DECLINING)
    if delta_total <= -20.0 or delta_last <= -15.0:
        health_trend = "RAPIDLY_DECLINING"
    elif delta_total <= -5.0 or delta_last <= -3.0:
        health_trend = "DECLINING"
    elif delta_total >= 5.0 or delta_last >= 3.0:
        health_trend = "IMPROVING"
    else:
        health_trend = "STABLE"

    classification = health_trend

    # 2. Disease Trend
    disease_delta = latest.disease_probability - baseline.disease_probability
    if disease_delta >= 25.0 or latest.disease_probability >= 60.0:
        disease_trend = "SURGING"
    elif disease_delta >= 8.0:
        disease_trend = "INCREASING"
    elif disease_delta <= -8.0:
        disease_trend = "IMPROVING"
    else:
        disease_trend = "STABLE"

    # 3. Pest Trend
    pest_delta = latest.pest_probability - baseline.pest_probability
    if pest_delta >= 25.0 or latest.pest_probability >= 50.0:
        pest_trend = "SURGING"
    elif pest_delta >= 8.0:
        pest_trend = "INCREASING"
    elif pest_delta <= -8.0:
        pest_trend = "IMPROVING"
    else:
        pest_trend = "STABLE"

    # 4. Water Stress Trend
    cwsi_delta = latest.water_stress_cwsi - baseline.water_stress_cwsi
    if latest.water_stress_cwsi >= 0.65:
        water_stress_trend = "CRITICAL"
    elif cwsi_delta >= 0.15:
        water_stress_trend = "INCREASING"
    elif cwsi_delta <= -0.15:
        water_stress_trend = "RELIEVED"
    else:
        water_stress_trend = "STABLE"

    # 5. Anomaly Trend
    anomaly_delta = latest.anomaly_score - baseline.anomaly_score
    if anomaly_delta >= 15.0:
        anomaly_trend = "EXPANDING"
    elif anomaly_delta <= -15.0:
        anomaly_trend = "DISSIPATING"
    else:
        anomaly_trend = "STABLE"

    return TemporalAnalysisResult(
        zone_id=zone_id,
        total_scans=len(scans),
        health_trend=health_trend,
        disease_trend=disease_trend,
        pest_trend=pest_trend,
        water_stress_trend=water_stress_trend,
        anomaly_trend=anomaly_trend,
        classification=classification,
        delta_last_scan_percent=round(delta_last, 1),
        delta_total_percent=round(delta_total, 1),
        velocity_per_day=velocity_per_day,
        baseline_health=round(baseline.health_score, 1),
        current_health=round(latest.health_score, 1),
        scans_history=scans,
    )
