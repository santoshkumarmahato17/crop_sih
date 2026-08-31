import pytest

from app.analytics.adaptive_monitoring import (
    AdaptiveMonitoringInputs,
    AdaptivePolicyConfig,
    calculate_adaptive_monitoring_schedule,
)


def test_high_risk_prompt_benchmark_scenario():
    """
    Test user prompt benchmark scenario:
    Farm A: Risk HIGH -> Recommended 2-day targeted monitoring for Z17, Z18, Z19.
    Reason: Disease indicators increased during consecutive observations.
    """
    inputs = AdaptiveMonitoringInputs(
        overall_risk_score=78,
        overall_risk_level="HIGH",
        disease_risk_score=82,
        health_trend="DECLINING",
        problem_zone_codes=["Z17", "Z18", "Z19"],
    )

    policy = AdaptivePolicyConfig(low_risk_days=7, medium_risk_days=4, high_risk_days=2, critical_risk_hours=24)
    res = calculate_adaptive_monitoring_schedule(inputs, policy)

    assert res.monitoring_priority == "URGENT"
    assert res.interval_days == 2.0
    assert res.target_zones == ["Z17", "Z18", "Z19"]
    assert "consecutive observations" in res.reason_for_monitoring
    assert "Multispectral" in res.recommended_sensor_payload[0]


def test_critical_risk_immediate_inspection():
    """Test Critical tier triggers <=24h immediate inspection."""
    inputs = AdaptiveMonitoringInputs(
        overall_risk_score=90,
        overall_risk_level="CRITICAL",
        health_trend="RAPIDLY_DECLINING",
        problem_zone_codes=["Z01", "Z02"],
    )

    res = calculate_adaptive_monitoring_schedule(inputs)
    assert res.monitoring_priority == "IMMEDIATE_TARGETED"
    assert res.interval_days <= 1.0
    assert "Thermal IR" in res.recommended_sensor_payload


def test_low_and_medium_risk_intervals():
    """Test standard 7-day and 4-day policy cadences."""
    low_inp = AdaptiveMonitoringInputs(overall_risk_score=15, overall_risk_level="LOW", health_trend="STABLE")
    low_res = calculate_adaptive_monitoring_schedule(low_inp)
    assert low_res.interval_days == 7.0
    assert low_res.monitoring_priority == "ROUTINE"

    med_inp = AdaptiveMonitoringInputs(overall_risk_score=40, overall_risk_level="MEDIUM", health_trend="STABLE")
    med_res = calculate_adaptive_monitoring_schedule(med_inp)
    assert med_res.interval_days == 4.0
    assert med_res.monitoring_priority == "ELEVATED"
