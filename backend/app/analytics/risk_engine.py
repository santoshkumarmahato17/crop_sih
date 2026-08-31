from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class ContributingFactor:
    """Individual explainable factor contributing to the composite risk score."""
    factor_name: str
    category: str  # "weather", "temporal_trend", "agronomic", "biosecurity", "history"
    points: int
    description: str


@dataclass
class RiskEngineInputs:
    """Multi-modal domain inputs for explainable crop health risk scoring."""
    crop_type: str = "Wheat"
    growth_stage: str = "Grain Filling"  # "Seedling", "Vegetative", "Flowering", "Grain Filling", "Maturity"
    relative_humidity_pct: float = 82.0
    recent_rainfall_mm: float = 22.0
    temperature_c: float = 28.5
    current_health_score: float = 72.0  # 0 to 100
    health_trend: str = "DECLINING"  # "STABLE", "IMPROVING", "DECLINING", "RAPIDLY_DECLINING"
    has_disease_history: bool = True
    has_pest_history: bool = False
    nearby_disease_activity_km: Optional[float] = 3.5  # Distance in km to nearest outbreak
    cwsi_water_stress: float = 0.45  # 0.0 to 1.0


@dataclass
class ExplainableRiskResult:
    """Complete explainable multi-vector crop health risk assessment."""
    disease_risk_score: int  # 0 to 100
    pest_risk_score: int  # 0 to 100
    water_stress_risk: int  # 0 to 100
    overall_crop_risk: int  # 0 to 100
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    rule_version: str
    assessment_timestamp: datetime
    explanation_summary: str
    contributing_factors: List[ContributingFactor] = field(default_factory=list)
    raw_inputs: Dict[str, Any] = field(default_factory=dict)


def evaluate_crop_health_risk(
    zone_id: str, inputs: RiskEngineInputs, rule_version: str = "v1.2.0-explainable-ipm"
) -> ExplainableRiskResult:
    """
    Executes explainable multi-factor agronomic risk scoring.
    
    Generates exact $+/-$ point attribution for disease, pest, and water stress threats,
    avoiding opaque black-box scoring.
    """
    factors: List[ContributingFactor] = []
    base_disease = 10
    base_pest = 10
    base_water = 5

    # 1. Weather Factor Attribution
    if inputs.relative_humidity_pct >= 80.0:
        pts = 20
        base_disease += pts
        factors.append(
            ContributingFactor(
                factor_name="High Canopy Humidity",
                category="weather",
                points=pts,
                description=f"Relative humidity at {inputs.relative_humidity_pct:.1f}% creates optimal microclimate for fungal spore germination.",
            )
        )
    elif inputs.relative_humidity_pct >= 65.0:
        pts = 10
        base_disease += pts
        factors.append(
            ContributingFactor(
                factor_name="Moderate Humidity",
                category="weather",
                points=pts,
                description=f"Canopy humidity at {inputs.relative_humidity_pct:.1f}% supports fungal sporulation.",
            )
        )

    if inputs.recent_rainfall_mm >= 15.0:
        pts = 18
        base_disease += pts
        base_water -= 15  # Rainfall relieves water deficit
        factors.append(
            ContributingFactor(
                factor_name="Recent Heavy Rainfall",
                category="weather",
                points=pts,
                description=f"Cumulative rainfall of {inputs.recent_rainfall_mm:.1f}mm increases leaf wetness duration.",
            )
        )
    elif inputs.recent_rainfall_mm < 2.0 and inputs.temperature_c >= 30.0:
        pts = 15
        base_water += pts
        factors.append(
            ContributingFactor(
                factor_name="High Temperature & Aridity",
                category="weather",
                points=pts,
                description=f"Temperature {inputs.temperature_c:.1f}°C with negligible rainfall accelerates transpiration.",
            )
        )

    # 2. Temporal Trajectory Factor Attribution
    if inputs.health_trend == "RAPIDLY_DECLINING":
        pts = 25
        base_disease += pts
        base_pest += 15
        factors.append(
            ContributingFactor(
                factor_name="Rapidly Declining Health Trajectory",
                category="temporal_trend",
                points=pts,
                description="Consecutive monitoring flights indicate sharp vegetative decline (>20% drop).",
            )
        )
    elif inputs.health_trend == "DECLINING":
        pts = 15
        base_disease += pts
        base_pest += 8
        factors.append(
            ContributingFactor(
                factor_name="Declining Vitality Trend",
                category="temporal_trend",
                points=pts,
                description="Observed negative slope in canopy chlorosis over recent scans.",
            )
        )
    elif inputs.health_trend == "IMPROVING":
        pts = -10
        base_disease += pts
        base_pest += pts
        factors.append(
            ContributingFactor(
                factor_name="Canopy Health Recovery",
                category="temporal_trend",
                points=pts,
                description="Positive canopy vegetative vigor reduces active vulnerability.",
            )
        )

    # 3. Regional Nearby Disease Activity (Biosecurity Buffer)
    if inputs.nearby_disease_activity_km is not None:
        if inputs.nearby_disease_activity_km <= 5.0:
            pts = 12
            base_disease += pts
            factors.append(
                ContributingFactor(
                    factor_name="Nearby Regional Pathology Outbreak",
                    category="biosecurity",
                    points=pts,
                    description=f"Active infection cluster detected {inputs.nearby_disease_activity_km:.1f}km away within the wind vector corridor.",
                )
            )
        elif inputs.nearby_disease_activity_km <= 15.0:
            pts = 6
            base_disease += pts
            factors.append(
                ContributingFactor(
                    factor_name="Regional Disease Proximity",
                    category="biosecurity",
                    points=pts,
                    description=f"Outbreak identified within regional {inputs.nearby_disease_activity_km:.1f}km radius.",
                )
            )

    # 4. Crop Growth Stage Susceptibility
    stage = inputs.growth_stage.lower()
    if "flowering" in stage or "grain" in stage or "pod" in stage:
        pts = 7
        base_disease += pts
        base_pest += 8
        factors.append(
            ContributingFactor(
                factor_name=f"Vulnerable Growth Stage ({inputs.growth_stage})",
                category="agronomic",
                points=pts,
                description=f"Crop phenology '{inputs.growth_stage}' is highly susceptible to yield loss from foliar blights.",
            )
        )

    # 5. Historical Pathology & Pest Recurrence
    if inputs.has_disease_history:
        pts = 10
        base_disease += pts
        factors.append(
            ContributingFactor(
                factor_name="Prior Pathology Occurrence",
                category="history",
                points=pts,
                description="Zone has documented history of fungal/bacterial inoculum in soil/crop residues.",
            )
        )

    if inputs.has_pest_history:
        pts = 12
        base_pest += pts
        factors.append(
            ContributingFactor(
                factor_name="Historical Pest Infestation",
                category="history",
                points=pts,
                description="Zone previously experienced localized insect defoliation.",
            )
        )

    # 6. Water Deficit (CWSI) Factor
    if inputs.cwsi_water_stress >= 0.60:
        pts = 35
        base_water += pts
        factors.append(
            ContributingFactor(
                factor_name="Critical Stomatal Water Deficit",
                category="agronomic",
                points=pts,
                description=f"CWSI of {inputs.cwsi_water_stress:.2f} indicates acute root-zone moisture depletion.",
            )
        )
    elif inputs.cwsi_water_stress >= 0.35:
        pts = 20
        base_water += pts
        factors.append(
            ContributingFactor(
                factor_name="Moderate Water Stress",
                category="agronomic",
                points=pts,
                description=f"CWSI of {inputs.cwsi_water_stress:.2f} warrants scheduled irrigation replenishment.",
            )
        )

    # Bounded Normalization [0 to 100]
    disease_risk_score = max(0, min(100, base_disease))
    pest_risk_score = max(0, min(100, base_pest))
    water_stress_risk = max(0, min(100, base_water))

    # Overall Composite Crop Risk (Weighted Maximum)
    overall_crop_risk = int(
        round(
            (disease_risk_score * 0.45)
            + (pest_risk_score * 0.30)
            + (water_stress_risk * 0.25)
        )
    )
    # If any single domain is acute, escalate overall risk
    overall_crop_risk = max(overall_crop_risk, int(max(disease_risk_score, pest_risk_score) * 0.9))

    # Classify Risk Tier
    if overall_crop_risk >= 76:
        risk_level = "CRITICAL"
    elif overall_crop_risk >= 51:
        risk_level = "HIGH"
    elif overall_crop_risk >= 26:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Construct Explanation Summary
    top_factors = sorted(factors, key=lambda f: abs(f.points), reverse=True)[:3]
    top_factor_names = ", ".join(f"{f.factor_name} (+{f.points})" for f in top_factors)
    explanation_summary = (
        f"Overall risk evaluated at {overall_crop_risk}/100 ({risk_level}). "
        f"Key driving factors: {top_factor_names}."
    )

    return ExplainableRiskResult(
        disease_risk_score=disease_risk_score,
        pest_risk_score=pest_risk_score,
        water_stress_risk=water_stress_risk,
        overall_crop_risk=overall_crop_risk,
        risk_level=risk_level,
        rule_version=rule_version,
        assessment_timestamp=datetime.now(timezone.utc),
        explanation_summary=explanation_summary,
        contributing_factors=factors,
        raw_inputs={
            "crop_type": inputs.crop_type,
            "growth_stage": inputs.growth_stage,
            "relative_humidity_pct": inputs.relative_humidity_pct,
            "recent_rainfall_mm": inputs.recent_rainfall_mm,
            "temperature_c": inputs.temperature_c,
            "health_trend": inputs.health_trend,
            "nearby_disease_activity_km": inputs.nearby_disease_activity_km,
        },
    )
