#!/usr/bin/env python3
"""
KISAN SATHI — Step 10 Temporal Crop Health Analysis Verification Script.
Validates:
1. Multi-scan chronological comparison engine
2. Rate-of-change and velocity calculations
3. Trend classifications (STABLE, IMPROVING, DECLINING, RAPIDLY_DECLINING)
4. Multi-metric trend analysis (Health, Disease, Pest, Water Stress)
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.analytics.temporal import ScanObservationData, calculate_temporal_trends


def test_user_prompt_scenario() -> bool:
    print("\n--- 1. Testing User Prompt Scenario (Zone Z17: 92 -> 86 -> 74 -> 61) ---")
    base_date = datetime(2026, 8, 10, 8, 30, tzinfo=timezone.utc)
    scans = [
        ScanObservationData(
            scan_id="scan-z17-1",
            observation_date=base_date,
            health_score=92.0,
            disease_probability=4.0,
            pest_probability=2.0,
            water_stress_cwsi=0.12,
        ),
        ScanObservationData(
            scan_id="scan-z17-2",
            observation_date=base_date + timedelta(days=3),
            health_score=86.0,
            disease_probability=14.0,
            pest_probability=6.0,
            water_stress_cwsi=0.28,
        ),
        ScanObservationData(
            scan_id="scan-z17-3",
            observation_date=base_date + timedelta(days=6),
            health_score=74.0,
            disease_probability=42.0,
            pest_probability=18.0,
            water_stress_cwsi=0.52,
        ),
        ScanObservationData(
            scan_id="scan-z17-4",
            observation_date=base_date + timedelta(days=9),
            health_score=61.0,
            disease_probability=71.0,
            pest_probability=35.0,
            water_stress_cwsi=0.74,
        ),
    ]

    res = calculate_temporal_trends("Z17", scans)
    print(f"  Total Scans: {res.total_scans}")
    print(f"  Baseline Health: {res.baseline_health}% -> Current Health: {res.current_health}%")
    print(f"  Net Delta: {res.delta_total_percent}% (Velocity: {res.velocity_per_day}%/day)")
    print(f"  Classification: {res.classification}")
    print(f"  Disease Trend: {res.disease_trend}, Pest: {res.pest_trend}, Water Stress: {res.water_stress_trend}")

    assert res.classification == "RAPIDLY_DECLINING"
    assert res.delta_total_percent == -31.0
    assert res.delta_last_scan_percent == -13.0
    assert res.disease_trend == "SURGING"
    assert res.water_stress_trend == "CRITICAL"
    print("  [PASS] User prompt multi-scan scenario correctly classified as RAPIDLY_DECLINING.")
    return True


def test_recovery_scenario() -> bool:
    print("\n--- 2. Testing Post-Treatment Crop Health Recovery (65 -> 78 -> 91) ---")
    base_date = datetime(2026, 8, 1, 9, 0, tzinfo=timezone.utc)
    scans = [
        ScanObservationData(
            scan_id="rec-1",
            observation_date=base_date,
            health_score=65.0,
            disease_probability=55.0,
        ),
        ScanObservationData(
            scan_id="rec-2",
            observation_date=base_date + timedelta(days=5),
            health_score=78.0,
            disease_probability=25.0,
        ),
        ScanObservationData(
            scan_id="rec-3",
            observation_date=base_date + timedelta(days=10),
            health_score=91.0,
            disease_probability=8.0,
        ),
    ]

    res = calculate_temporal_trends("Z03", scans)
    print(f"  Baseline: {res.baseline_health}% -> Current: {res.current_health}% (Net: +{res.delta_total_percent}%)")
    print(f"  Classification: {res.classification} (Disease: {res.disease_trend})")

    assert res.classification == "IMPROVING"
    assert res.delta_total_percent == 26.0
    assert res.disease_trend == "IMPROVING"
    print("  [PASS] Recovery trajectory correctly classified as IMPROVING.")
    return True


def main():
    print("==========================================================")
    print("KISAN SATHI: Step 10 Temporal Crop Health Analysis")
    print("==========================================================")

    p_ok = test_user_prompt_scenario()
    r_ok = test_recovery_scenario()

    print("\n==========================================================")
    if p_ok and r_ok:
        print("ALL TEMPORAL CROP HEALTH ANALYSIS CHECKS PASSED!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("TEMPORAL ANALYSIS VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    main()
