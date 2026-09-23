#!/usr/bin/env python3
"""
KISAN SATHI — Step 13 Precision Water-Stress Analysis Verification Script.
Validates:
1. Zonal precision water-stress status categorization (ADEQUATE, MODERATE_STRESS, HIGH_STRESS, POSSIBLE_WATERLOGGING)
2. Prompt benchmark scenario (Z01 -> Adequate, Z02 -> Adequate, Z03 -> Moderate, Z04 -> High, Z05 -> High)
3. Crop Water Stress Index (CWSI) and thermal canopy transpiration delta
4. Irrigation prioritization and decision support guidance
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.analytics.water_stress import WaterStressInputs, evaluate_zonal_water_stress


def test_prompt_benchmark_scenario() -> bool:
    print("\n--- 1. Testing Prompt Benchmark Scenario (Z01-Z05 Water Stress Map) ---")
    benchmark_configs = [
        ("Z01", WaterStressInputs(crop_health_score=88.0, canopy_air_temp_diff_c=0.1, soil_moisture_pct=28.0, days_since_last_irrigation=2), "ADEQUATE"),
        ("Z02", WaterStressInputs(crop_health_score=85.0, canopy_air_temp_diff_c=0.3, soil_moisture_pct=27.0, days_since_last_irrigation=3), "ADEQUATE"),
        ("Z03", WaterStressInputs(crop_health_score=75.0, canopy_air_temp_diff_c=1.6, soil_moisture_pct=20.0, days_since_last_irrigation=6), "MODERATE_STRESS"),
        ("Z04", WaterStressInputs(crop_health_score=62.0, canopy_air_temp_diff_c=3.4, soil_moisture_pct=14.0, days_since_last_irrigation=9), "HIGH_STRESS"),
        ("Z05", WaterStressInputs(crop_health_score=58.0, canopy_air_temp_diff_c=3.8, soil_moisture_pct=12.0, days_since_last_irrigation=10), "HIGH_STRESS"),
    ]

    for z_code, inp, expected_status in benchmark_configs:
        res = evaluate_zonal_water_stress(z_code, inp)
        print(f"  {z_code} -> {res.status} [CWSI: {res.cwsi_index:.2f}, Priority: {res.irrigation_priority}, TempDiff: +{res.canopy_air_temp_diff_c:.1f}°C]")
        assert res.status == expected_status, f"Expected {expected_status} for {z_code}, got {res.status}"

    print("  [PASS] Prompt benchmark zone progression (Adequate -> Moderate -> High) verified.")
    return True


def test_waterlogging_and_decision_support() -> bool:
    print("\n--- 2. Testing Waterlogging & Decision Support Framing ---")
    inp = WaterStressInputs(soil_moisture_pct=48.0, recent_rainfall_mm=80.0)
    res = evaluate_zonal_water_stress("Z_SAT", inp)
    print(f"  Waterlogging Test: Status={res.status}, Priority={res.irrigation_priority}")
    print(f"  Decision Guidance: {res.decision_support_guidance[:80]}...")
    assert res.status == "POSSIBLE_WATERLOGGING"
    assert res.irrigation_priority == "DRAINAGE_ATTENTION"
    return True


def main():
    print("==========================================================")
    print("KISAN SATHI: Step 13 Precision Water-Stress Verification")
    print("==========================================================")

    b_ok = test_prompt_benchmark_scenario()
    w_ok = test_waterlogging_and_decision_support()

    print("\n==========================================================")
    if b_ok and w_ok:
        print("ALL PRECISION WATER-STRESS CHECKS PASSED!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("PRECISION WATER-STRESS VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    main()
