import pytest

from app.analytics.risk_engine import RiskEngineInputs, evaluate_crop_health_risk


def test_user_prompt_explainable_risk_calculation():
    """
    Test user prompt example:
    Disease Risk = 82
    Contributing factors:
    - High humidity: +20
    - Recent rainfall: +18
    - Increasing disease trend: +25
    - Nearby disease activity: +12
    - Crop growth stage: +7
    """
    inputs = RiskEngineInputs(
        crop_type="Wheat",
        growth_stage="Grain Filling",
        relative_humidity_pct=84.0,  # +20 pts
        recent_rainfall_mm=20.0,     # +18 pts
        temperature_c=26.0,
        current_health_score=62.0,
        health_trend="RAPIDLY_DECLINING",  # +25 pts
        has_disease_history=False,
        nearby_disease_activity_km=3.2,    # +12 pts
        cwsi_water_stress=0.20,
    )

    result = evaluate_crop_health_risk("zone-test-1", inputs)

    # Base (10) + 20 + 18 + 25 + 12 + 7 = 92 (capped or bounded near ~85-92)
    assert result.disease_risk_score >= 80
    assert result.overall_crop_risk >= 76
    assert result.risk_level == "CRITICAL"
    assert result.rule_version == "v1.2.0-explainable-ipm"

    # Verify explainable factor names and points
    factor_names = [f.factor_name for f in result.contributing_factors]
    assert any("Humidity" in name for name in factor_names)
    assert any("Rainfall" in name for name in factor_names)
    assert any("Declining" in name for name in factor_names)
    assert any("Nearby" in name for name in factor_names)
    assert any("Growth Stage" in name for name in factor_names)

    # Ensure point attributions are exact numbers
    points_dict = {f.factor_name: f.points for f in result.contributing_factors}
    assert any(pts == 20 for pts in points_dict.values())
    assert any(pts == 18 for pts in points_dict.values())
    assert any(pts == 25 for pts in points_dict.values())
    assert any(pts == 12 for pts in points_dict.values())
    assert any(pts == 7 for pts in points_dict.values())


def test_low_risk_scenario():
    """Test low risk condition (arid, sunny, improving crop, no outbreaks)."""
    inputs = RiskEngineInputs(
        crop_type="Barley",
        growth_stage="Vegetative",
        relative_humidity_pct=40.0,
        recent_rainfall_mm=0.0,
        temperature_c=22.0,
        current_health_score=95.0,
        health_trend="IMPROVING",  # -10 pts
        has_disease_history=False,
        nearby_disease_activity_km=None,
        cwsi_water_stress=0.10,
    )

    result = evaluate_crop_health_risk("zone-test-2", inputs)

    assert result.disease_risk_score <= 25
    assert result.risk_level == "LOW"
