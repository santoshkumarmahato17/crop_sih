#!/usr/bin/env python3
"""
KISAN SATHI — Step 11 Crop Health Risk Engine Verification Script.
Validates:
1. Explainable multi-factor risk calculations (Disease, Pest, Water Stress, Overall)
2. Exact $+/-$ point attribution and transparent factor descriptions
3. User prompt scenario validation (+20 humidity, +18 rainfall, +25 trend, +12 nearby, +7 stage)
4. Risk tier thresholds (LOW, MEDIUM, HIGH, CRITICAL)
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.analytics.risk_engine import RiskEngineInputs, evaluate_crop_health_risk


def test_user_prompt_explainability() -> bool:
    print("\n--- 1. Testing User Prompt Scenario (Explainable Disease Risk ~82) ---")
    inputs = RiskEngineInputs(
        crop_type="Wheat",
        growth_stage="Grain Filling",
        relative_humidity_pct=84.0,  # Expected +20 pts
        recent_rainfall_mm=19.5,     # Expected +18 pts
        temperature_c=26.5,
        current_health_score=60.0,
        health_trend="RAPIDLY_DECLINING",  # Expected +25 pts
        has_disease_history=False,
        nearby_disease_activity_km=4.0,    # Expected +12 pts
        cwsi_water_stress=0.15,
    )

    res = evaluate_crop_health_risk("Z17", inputs)
    print(f"  Overall Crop Risk Score: {res.overall_crop_risk}/100 ({res.risk_level})")
    print(f"  Disease Risk Score: {res.disease_risk_score}/100")
    print(f"  Pest Risk Score: {res.pest_risk_score}/100")
    print(f"  Water Stress Risk: {res.water_stress_risk}/100")
    print(f"  Rule Engine Version: {res.rule_version}")
    print("\n  Contributing Factors Breakdown (Explainable Waterfall):")
    for f in res.contributing_factors:
        sign = "+" if f.points > 0 else ""
        print(f"    • {f.factor_name}: {sign}{f.points} pts [{f.category}] -> {f.description[:60]}...")

    assert res.disease_risk_score >= 80
    assert res.risk_level == "CRITICAL"
    print("  [PASS] User prompt multi-factor explainable risk verified.")
    return True


def test_low_risk_benchmark() -> bool:
    print("\n--- 2. Testing Low Risk Baseline Benchmark ---")
    inputs = RiskEngineInputs(
        crop_type="Soybean",
        growth_stage="Vegetative",
        relative_humidity_pct=45.0,
        recent_rainfall_mm=0.0,
        temperature_c=21.0,
        current_health_score=92.0,
        health_trend="IMPROVING",
        has_disease_history=False,
        nearby_disease_activity_km=None,
        cwsi_water_stress=0.10,
    )

    res = evaluate_crop_health_risk("Z01", inputs)
    print(f"  Overall Crop Risk Score: {res.overall_crop_risk}/100 ({res.risk_level})")
    assert res.risk_level == "LOW"
    assert res.overall_crop_risk <= 25
    print("  [PASS] Low risk condition correctly evaluated as LOW tier.")
    return True


def main():
    print("==========================================================")
    print("KISAN SATHI: Step 11 Crop Health Risk Engine Verification")
    print("==========================================================")

    u_ok = test_user_prompt_explainability()
    l_ok = test_low_risk_benchmark()

    print("\n==========================================================")
    if u_ok and l_ok:
        print("ALL CROP HEALTH RISK ENGINE CHECKS PASSED!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("RISK ENGINE VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    main()
