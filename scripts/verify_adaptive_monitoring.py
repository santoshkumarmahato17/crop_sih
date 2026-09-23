#!/usr/bin/env python3
"""
KISAN SATHI — Step 17 Risk-Adaptive Monitoring Verification Script.
Validates:
1. Dynamic monitoring schedule adjustment based on multi-factor risk
2. Prompt benchmark scenario:
   - Farm A: Risk HIGH
   - Recommended: Targeted monitoring in 2 days
   - Zones: Z17, Z18, Z19
   - Reason: Disease indicators increased during three consecutive observations
3. Configurable policy intervals (LOW: 7d, MEDIUM: 4d, HIGH: 2d, CRITICAL: <=24h)
4. Recommended drone mission proposal generation
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.analytics.adaptive_monitoring import (
    AdaptiveMonitoringInputs,
    AdaptivePolicyConfig,
    calculate_adaptive_monitoring_schedule,
)


def test_prompt_benchmark_scenario() -> bool:
    print("\n--- 1. Testing Prompt Benchmark Scenario (Farm A High Risk) ---")
    inputs = AdaptiveMonitoringInputs(
        overall_risk_score=78,
        overall_risk_level="HIGH",
        disease_risk_score=82,
        health_trend="DECLINING",
        problem_zone_codes=["Z17", "Z18", "Z19"],
    )

    policy = AdaptivePolicyConfig(
        low_risk_days=7,
        medium_risk_days=4,
        high_risk_days=2,
        critical_risk_hours=24,
    )

    res = calculate_adaptive_monitoring_schedule(inputs, policy)

    print(f"  Farm Threat Level: {inputs.overall_risk_level} ({inputs.overall_risk_score}/100)")
    print(f"  Monitoring Priority: {res.monitoring_priority} (Cycle Interval: {res.interval_days:.0f} days)")
    print(f"  Target Zones: {res.target_zones}")
    print(f"  Reason: {res.reason_for_monitoring}")
    print(f"  Recommended Sensor Payload: {res.recommended_sensor_payload}")
    print(f"  Recommended Flight Altitude: {res.recommended_flight_altitude_m}m")

    assert res.interval_days == 2.0
    assert res.target_zones == ["Z17", "Z18", "Z19"]
    assert "consecutive observations" in res.reason_for_monitoring
    print("  [PASS] User prompt benchmark scenario verified.")
    return True


def test_configurable_policy_tiers() -> bool:
    print("\n--- 2. Testing Configurable Policy Cadences (LOW, MED, HIGH, CRITICAL) ---")
    policy = AdaptivePolicyConfig(low_risk_days=7, medium_risk_days=4, high_risk_days=2, critical_risk_hours=24)

    tiers = [
        ("LOW", 10, 7.0, "ROUTINE"),
        ("MEDIUM", 40, 4.0, "ELEVATED"),
        ("HIGH", 70, 2.0, "URGENT"),
        ("CRITICAL", 92, 1.0, "IMMEDIATE_TARGETED"),
    ]

    for tier, score, expected_days, expected_prio in tiers:
        inp = AdaptiveMonitoringInputs(overall_risk_level=tier, overall_risk_score=score)
        res = calculate_adaptive_monitoring_schedule(inp, policy)
        print(f"  Tier [{tier:8s} | Score: {score:2d}] -> Interval: {res.interval_days:3.1f}d | Priority: {res.monitoring_priority}")
        assert res.interval_days == expected_days
        assert res.monitoring_priority == expected_prio

    print("  [PASS] Configurable policy intervals verified.")
    return True


def main():
    print("==========================================================")
    print("KISAN SATHI: Step 17 Risk-Adaptive Monitoring Verification")
    print("==========================================================")

    b_ok = test_prompt_benchmark_scenario()
    p_ok = test_configurable_policy_tiers()

    print("\n==========================================================")
    if b_ok and p_ok:
        print("ALL RISK-ADAPTIVE MONITORING CHECKS PASSED!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("RISK-ADAPTIVE MONITORING VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    main()
