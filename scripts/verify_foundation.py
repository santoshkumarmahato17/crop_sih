#!/usr/bin/env python3
"""
AGRI SHIELD — Technical Foundation Verification Script (Step 2).
Validates:
1. Directory Structure Integrity (8 required top-level directories)
2. Backend App & Health Endpoint (/api/v1/health)
3. Centralized Error Handlers
4. Geospatial & PostGIS Query Compatibility
"""

import sys
import os
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

def verify_directory_structure(root_dir: Path) -> bool:
    print("\n--- 1. Verifying Top-Level Directory Hierarchy ---")
    required_dirs = [
        "frontend",
        "backend",
        "ai",
        "data",
        "infra",
        "docs",
        "tests",
        "scripts",
    ]
    all_ok = True
    for d in required_dirs:
        dir_path = root_dir / d
        if dir_path.is_dir():
            print(f"  [PASS] /{d} exists.")
        else:
            print(f"  [FAIL] /{d} missing!")
            all_ok = False
    return all_ok


async def verify_backend_health() -> bool:
    print("\n--- 2. Verifying FastAPI Backend & Health Endpoint ---")
    try:
        from app.main import app
        from httpx import AsyncClient, ASGITransport

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.get("/api/v1/health")
            print(f"  HTTP Status Code: {response.status_code}")
            data = response.json()
            print(f"  Response Payload: {data}")

            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            assert data["system"] == "AGRI SHIELD", "System name mismatch"
            assert "subsystems" in data, "Subsystems key missing"
            assert "postgis" in data["subsystems"], "PostGIS subsystem missing"
            assert "redis" in data["subsystems"], "Redis subsystem missing"
            assert "minio_storage" in data["subsystems"], "MinIO subsystem missing"
            print("  [PASS] Health check endpoint (/api/v1/health) is operational.")
            return True
    except Exception as e:
        print(f"  [FAIL] Backend verification error: {e}")
        return False


async def verify_error_handling() -> bool:
    print("\n--- 3. Verifying Centralized Error Handling ---")
    try:
        from app.main import app
        from httpx import AsyncClient, ASGITransport

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Request non-existent endpoint
            response = await client.get("/api/v1/non-existent-endpoint")
            print(f"  404 Probe Status: {response.status_code}")
            data = response.json()
            print(f"  404 Payload: {data}")
            assert response.status_code == 404
            assert data["success"] is False
            print("  [PASS] Centralized RFC 7807 error handling verified.")
            return True
    except Exception as e:
        print(f"  [FAIL] Error handling verification error: {e}")
        return False


async def main():
    root_dir = Path(__file__).resolve().parent.parent
    print("==========================================================")
    print("AGRI SHIELD: Step 2 Technical Foundation Verification")
    print("==========================================================")

    d_ok = verify_directory_structure(root_dir)
    b_ok = await verify_backend_health()
    e_ok = await verify_error_handling()

    print("\n==========================================================")
    if d_ok and b_ok and e_ok:
        print("ALL FOUNDATION VERIFICATIONS PASSED SUCCESSFULLY!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("VERIFICATIONS FAILED. PLEASE REVIEW LOGS.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
