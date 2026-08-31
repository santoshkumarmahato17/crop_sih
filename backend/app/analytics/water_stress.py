from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class WaterStressInputs:
    """Inputs for zonal precision water-stress and irrigation decision support."""
    crop_health_score: float = 80.0  # 0 to 100
    mean_ndvi: Optional[float] = 0.72
    canopy_air_temp_diff_c: Optional[float] = 1.2  # T_canopy - T_air (positive = stomatal closure / stress)
    soil_moisture_pct: Optional[float] = 22.0  # Volumetric water content %
    recent_rainfall_mm: float = 4.0
    forecast_rainfall_48h_mm: float = 0.0
    crop_stage: str = "Grain Filling"  # Vegetative, Flowering, Grain Filling, Maturity
    days_since_last_irrigation: int = 6
    irrigation_method: str = "Drip"  # Drip, Sprinkler, Surface Flood


@dataclass
class ZoneWaterStressResult:
    """Comprehensive zonal water-stress assessment and decision support."""
    zone_id: str
    status: str  # "ADEQUATE", "MODERATE_STRESS", "HIGH_STRESS", "POSSIBLE_WATERLOGGING"
    water_stress_score: int  # 0 to 100
    cwsi_index: float  # 0.00 to 1.00 (Crop Water Stress Index)
    irrigation_priority: str  # "NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL", "DRAINAGE_ATTENTION"
    canopy_air_temp_diff_c: float
    soil_moisture_pct: Optional[float]
    decision_support_guidance: str
    decision_factors: Dict[str, Any]


def evaluate_zonal_water_stress(
    zone_id: str, inputs: WaterStressInputs
) -> ZoneWaterStressResult:
    """
    Computes precision Crop Water Stress Index (CWSI) and irrigation decision priority.
    
    Status Categories:
    - ADEQUATE: CWSI < 0.30
    - MODERATE_STRESS: CWSI 0.30 - 0.59
    - HIGH_STRESS: CWSI >= 0.60
    - POSSIBLE_WATERLOGGING: Soil moisture > 42% or heavy rain with canopy chlorosis
    """
    # 1. Detect Waterlogging / Saturation
    is_waterlogged = False
    if inputs.soil_moisture_pct is not None and inputs.soil_moisture_pct >= 42.0:
        is_waterlogged = True
    elif inputs.recent_rainfall_mm >= 65.0 and inputs.crop_health_score < 60.0:
        is_waterlogged = True

    if is_waterlogged:
        return ZoneWaterStressResult(
            zone_id=zone_id,
            status="POSSIBLE_WATERLOGGING",
            water_stress_score=85,
            cwsi_index=0.85,
            irrigation_priority="DRAINAGE_ATTENTION",
            canopy_air_temp_diff_c=inputs.canopy_air_temp_diff_c or -1.5,
            soil_moisture_pct=inputs.soil_moisture_pct or 45.0,
            decision_support_guidance=(
                "Possible root-zone waterlogging detected. Halt all irrigation immediately. "
                "Inspect drainage swales and monitor for anaerobic root rot/pythium vulnerability."
            ),
            decision_factors={
                "waterlogging_indicator": True,
                "soil_moisture_pct": inputs.soil_moisture_pct,
                "recent_rainfall_mm": inputs.recent_rainfall_mm,
            },
        )

    # 2. Calculate Base CWSI Index from Thermal & Soil Moisture
    # Thermal component: warm canopy (T_canopy > T_air) indicates stomata closed due to moisture deficit
    thermal_diff = inputs.canopy_air_temp_diff_c if inputs.canopy_air_temp_diff_c is not None else 0.5
    # Normalized thermal CWSI contribution (typically ranges from -3.0C to +6.0C)
    cwsi_thermal = max(0.0, min(1.0, (thermal_diff + 2.0) / 7.0))

    # Soil moisture contribution: 10% = arid (1.0), 30% = field capacity (0.1)
    if inputs.soil_moisture_pct is not None:
        cwsi_soil = max(0.0, min(1.0, (32.0 - inputs.soil_moisture_pct) / 24.0))
    else:
        # Infer from days since irrigation and rainfall
        inferred = (inputs.days_since_last_irrigation * 0.1) - (inputs.recent_rainfall_mm * 0.03)
        cwsi_soil = max(0.05, min(0.95, inferred))

    # Vegetative vitality influence
    vitality_factor = max(0.0, (100.0 - inputs.crop_health_score) / 100.0)

    # Composite Crop Water Stress Index [0.0 - 1.0]
    cwsi = (cwsi_thermal * 0.45) + (cwsi_soil * 0.40) + (vitality_factor * 0.15)
    cwsi = round(max(0.02, min(0.98, cwsi)), 2)
    water_stress_score = int(round(cwsi * 100))

    # 3. Categorize Status & Irrigation Priority
    if cwsi >= 0.60:
        status_category = "HIGH_STRESS"
        priority = "CRITICAL" if "flowering" in inputs.crop_stage.lower() or "grain" in inputs.crop_stage.lower() else "HIGH"
        if inputs.forecast_rainfall_48h_mm >= 15.0:
            guidance = (
                f"High water deficit (CWSI: {cwsi:.2f}). However, {inputs.forecast_rainfall_48h_mm:.0f}mm rainfall "
                f"is forecasted within 48h. Hold scheduled irrigation and re-evaluate post-precipitation."
            )
        else:
            guidance = (
                f"High crop water deficit (CWSI: {cwsi:.2f}). Stomatal closure observed (+{thermal_diff:.1f}°C canopy diff). "
                f"Schedule priority {inputs.irrigation_method} irrigation to avoid yield impairment during {inputs.crop_stage}."
            )
    elif cwsi >= 0.30:
        status_category = "MODERATE_STRESS"
        priority = "MEDIUM"
        if inputs.forecast_rainfall_48h_mm >= 10.0:
            guidance = f"Moderate water stress (CWSI: {cwsi:.2f}). Forecasted rainfall ({inputs.forecast_rainfall_48h_mm:.0f}mm) expected to replenish root zone."
        else:
            guidance = f"Moderate water stress (CWSI: {cwsi:.2f}). Plan regular {inputs.irrigation_method} cycle within the next 48 hours."
    else:
        status_category = "ADEQUATE"
        priority = "NONE"
        guidance = f"Adequate root-zone soil moisture and transpiration (CWSI: {cwsi:.2f}). No supplemental irrigation required."

    return ZoneWaterStressResult(
        zone_id=zone_id,
        status=status_category,
        water_stress_score=water_stress_score,
        cwsi_index=cwsi,
        irrigation_priority=priority,
        canopy_air_temp_diff_c=thermal_diff,
        soil_moisture_pct=inputs.soil_moisture_pct,
        decision_support_guidance=guidance,
        decision_factors={
            "cwsi_index": cwsi,
            "canopy_air_temp_diff_c": thermal_diff,
            "soil_moisture_pct": inputs.soil_moisture_pct,
            "days_since_irrigation": inputs.days_since_last_irrigation,
            "forecast_rainfall_48h_mm": inputs.forecast_rainfall_48h_mm,
            "crop_stage": inputs.crop_stage,
        },
    )
