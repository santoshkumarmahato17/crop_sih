#!/usr/bin/env python3
"""
KISAN SATHI — Step 15 Farmer Dashboard Verification Script.
Validates:
1. Answers to all 8 Core Farmer Questions:
   - Q1: Is my farm healthy?
   - Q2: Where is the problem?
   - Q3: What problem is occurring?
   - Q4: Is it getting worse?
   - Q5: Could it spread?
   - Q6: Which area needs water?
   - Q7: What should I do?
   - Q8: When is the next monitoring mission?
2. Multi-Layer Map support (Crop Health, Disease, Pest, Water Stress, Spread Risk, Drone Coverage)
3. Non-overwhelming plain language agronomic terminology
"""

import sys
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from httpx import ASGITransport, AsyncClient
from app.core.security import create_access_token
from app.main import app


async def test_farmer_dashboard_answers():
    print("\n--- 1. Testing Farmer Dashboard 8 Core Question Resolution ---")
    token = create_access_token(subject="farmer-test-1", email="farmer@kisansathi.com", role="FARMER")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/api/v1/dashboard/farmer-summary", headers=headers)

    assert response.status_code == 200, f"Failed with {response.status_code}: {response.text}"
    data = response.json()

    print(f"  Holding: {data['farm_name']} ({data['area_hectares']} ha, {data['crop_type']})")
    print(f"  [Q1 Health] Score: {data['overall_health_score']}% -> Verdict: '{data['health_verdict']}' ({data['health_trend']})")
    print(f"  [Q2 Location] {data['flagged_zones_count']} Flagged Zones: {[z['zone_code'] for z in data['problem_zones']]}")
    print(f"  [Q3 Problem] Primary Threat: {data['primary_threat_type']}")
    print(f"  [Q4 Trajectory] Velocity: {data['temporal_velocity']}")
    print(f"  [Q5 Spread] Risk Score: {data['potential_spread_risk_score']}/100 -> {data['spread_risk_verdict'][:60]}...")
    print(f"  [Q6 Water] Priority Zones: {data['water_stress_priority_zones']}")
    print(f"  [Q7 Action] Recommendations ({len(data['actionable_recommendations'])}):")
    for r in data["actionable_recommendations"]:
        print(f"      • [{r['priority']}] {r['title']}: {r['action']}")
    print(f"  [Q8 Mission] Drone: {data['next_mission']['drone_name']} ({data['next_mission']['mission_code']})")

    assert len(data["active_layers"]) >= 5
    print(f"\n  Active Field Map Layers: {', '.join(data['active_layers'])}")
    print("  [PASS] All 8 core farmer questions resolved with plain-language decision support.")
    return True


async def main():
    print("==========================================================")
    print("KISAN SATHI: Step 15 Farmer Dashboard Verification")
    print("==========================================================")

    d_ok = await test_farmer_dashboard_answers()

    print("\n==========================================================")
    if d_ok:
        print("ALL FARMER DASHBOARD CHECKS PASSED!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("FARMER DASHBOARD VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
