import pytest

from app.analytics.water_stress import WaterStressInputs, evaluate_zonal_water_stress


def test_adequate_water_status():
    """Test Z01/Z02 Adequate moisture scenario."""
    inputs = WaterStressInputs(
        crop_health_score=88.0,
        mean_ndvi=0.82,
        canopy_air_temp_diff_c=0.1,
        soil_moisture_pct=28.0,
        recent_rainfall_mm=8.0,
        days_since_last_irrigation=2,
    )

    res = evaluate_zonal_water_stress("Z01", inputs)

    assert res.status == "ADEQUATE"
    assert res.cwsi_index < 0.30
    assert res.irrigation_priority == "NONE"


def test_moderate_water_stress():
    """Test Z03 Moderate stress scenario."""
    inputs = WaterStressInputs(
        crop_health_score=75.0,
        mean_ndvi=0.68,
        canopy_air_temp_diff_c=1.5,
        soil_moisture_pct=20.0,
        recent_rainfall_mm=2.0,
        days_since_last_irrigation=6,
    )

    res = evaluate_zonal_water_stress("Z03", inputs)

    assert res.status == "MODERATE_STRESS"
    assert 0.30 <= res.cwsi_index < 0.60
    assert res.irrigation_priority == "MEDIUM"


def test_high_water_stress():
    """Test Z04/Z05 High deficit stress scenario."""
    inputs = WaterStressInputs(
        crop_health_score=62.0,
        mean_ndvi=0.52,
        canopy_air_temp_diff_c=3.6,
        soil_moisture_pct=13.0,
        recent_rainfall_mm=0.0,
        days_since_last_irrigation=10,
    )

    res = evaluate_zonal_water_stress("Z04", inputs)

    assert res.status == "HIGH_STRESS"
    assert res.cwsi_index >= 0.60
    assert res.irrigation_priority in ["HIGH", "CRITICAL"]


def test_waterlogging_detection():
    """Test root-zone saturation and waterlogging detection."""
    inputs = WaterStressInputs(
        crop_health_score=55.0,
        soil_moisture_pct=46.0,  # Saturated soil
        recent_rainfall_mm=75.0,
    )

    res = evaluate_zonal_water_stress("Z09", inputs)

    assert res.status == "POSSIBLE_WATERLOGGING"
    assert res.irrigation_priority == "DRAINAGE_ATTENTION"
    assert "waterlogging" in res.decision_support_guidance.lower()
