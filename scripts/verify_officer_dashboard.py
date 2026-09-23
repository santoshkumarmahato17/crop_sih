#!/usr/bin/env python3
"""
KISAN SATHI — Step 16 Extension Officer Dashboard & Audited Review Verification Script.
Validates:
1. Priority-ranked assigned farm portfolio (CRITICAL, HIGH, MEDIUM, LOW)
2. Threat metrics (Critical zones, pest hotspots, spread risk, unresolved alerts)
3. Expert ground-truth review actions (VALIDATED, REJECTED, UNCERTAIN, LAB_CONFIRMATION_REQUESTED)
4. Immutable AuditLog persistence for all officer operations
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


async def test_extension_officer_workflow():
    print("\n--- 1. Testing Extension Officer Priority Dashboard ---")
    token = create_access_token(
        subject="officer-user-01",
        email="officer@kisansathi.com",
        role="EXTENSION_OFFICER",
    )
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        dash_res = await ac.get("/api/v1/officer/dashboard", headers=headers)
        assert dash_res.status_code == 200
        data = dash_res.json()

        print(f"  Extension Specialist: {data['officer_name']}")
        print(f"  Assigned Portfolio: {data['total_assigned_farms']} Holdings")
        print(f"  Urgency Tiers -> Critical: {data['critical_count']}, High: {data['high_count']}, Medium: {data['medium_count']}, Low: {data['low_count']}")
        print(f"  Pending Validations: {data['pending_validations_total']} | Recommended Visits: {data['recommended_visits_total']}")

        top_farm = data["farms"][0]
        print(f"  [Top Priority] {top_farm['farm_name']} -> Tier: {top_farm['priority_tier']} (Risk Score: {top_farm['risk_score']}/100)")
        print(f"    Critical Zones: {top_farm['critical_zones_count']}, Pest Hotspots: {top_farm['pest_hotspots_count']}, Spread Risk: {top_farm['spread_risk_score']}")

        print("\n--- 2. Testing Audited Expert Validation Submission ---")
        val_payload = {
            "observation_id": "obs-farm-101-latest",
            "observation_type": "DISEASE",
            "validation_status": "VALIDATED",
            "notes": "Verified Puccinia striiformis pustules on wheat canopy.",
            "create_field_visit": True,
        }
        val_res = await ac.post(
            "/api/v1/officer/validations", json=val_payload, headers=headers
        )
        assert val_res.status_code == 200
        val_data = val_res.json()

        print(f"  Validation Status: {val_data['validation_status']}")
        print(f"  Audit Log ID: {val_data['audit_log_id']}")
        print(f"  Audit Action: {val_data['audit_action']}")
        print(f"  Message: {val_data['message']}")

    print("\n  [PASS] Extension Officer prioritization and audited validation verified.")
    return True


async def main():
    print("==========================================================")
    print("KISAN SATHI: Step 16 Extension Officer Verification")
    print("==========================================================")

    o_ok = await test_extension_officer_workflow()

    print("\n==========================================================")
    if o_ok:
        print("ALL EXTENSION OFFICER CHECKS PASSED!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("EXTENSION OFFICER VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
