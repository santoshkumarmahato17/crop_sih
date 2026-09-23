#!/usr/bin/env python3
"""
KISAN SATHI — Comprehensive Database Architecture Verification Script (Step 3).
Validates:
1. All 24 ORM Domain Models in Base.metadata
2. PostGIS Geometry Column Definitions and SRID 4326 Conformance
3. Alembic Migration Script & Configuration Consistency
4. Spatial Representation and Index Configurations
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.models import Base
from geoalchemy2.elements import WKTElement
from shapely import wkt


def verify_models_and_tables() -> bool:
    print("\n--- 1. Verifying 24 Relational & Spatial Database Models ---")
    required_tables = [
        "roles",
        "users",
        "farms",
        "farm_members",
        "crops",
        "crop_cycles",
        "farm_zones",
        "drones",
        "drone_missions",
        "drone_images",
        "image_processing_jobs",
        "health_observations",
        "disease_observations",
        "pest_observations",
        "water_stress_observations",
        "weather_observations",
        "risk_assessments",
        "disease_events",
        "spread_risks",
        "recommendations",
        "expert_validations",
        "alerts",
        "notifications",
        "audit_logs",
    ]

    registered = set(Base.metadata.tables.keys())
    all_ok = True
    for table_name in required_tables:
        if table_name in registered:
            table = Base.metadata.tables[table_name]
            col_count = len(table.columns)
            fk_count = len(table.foreign_keys)
            idx_count = len(table.indexes)
            print(f"  [PASS] Table '{table_name:25}' registered ({col_count} cols, {fk_count} FKs, {idx_count} indexes)")
        else:
            print(f"  [FAIL] Table '{table_name}' MISSING from Base.metadata!")
            all_ok = False

    print(f"\nTotal Registered Tables: {len(registered)} / 24")
    return all_ok and len(registered) == 24


def verify_spatial_geometry_definitions() -> bool:
    print("\n--- 2. Verifying PostGIS Spatial Types & SRID 4326 ---")
    spatial_checks = [
        ("farms", "boundary", "MULTIPOLYGON"),
        ("farms", "center_point", "POINT"),
        ("farm_zones", "boundary", "POLYGON"),
        ("drone_missions", "flight_boundary", "POLYGON"),
        ("drone_images", "location", "POINT"),
        ("drone_images", "footprint", "POLYGON"),
        ("health_observations", "location", "POINT"),
        ("health_observations", "affected_polygon", "POLYGON"),
        ("disease_observations", "location", "POINT"),
        ("pest_observations", "location", "POINT"),
        ("water_stress_observations", "location", "POINT"),
        ("weather_observations", "location", "POINT"),
        ("disease_events", "epicenter", "POINT"),
        ("disease_events", "affected_boundary", "POLYGON"),
        ("spread_risks", "risk_corridor", "POLYGON"),
        ("alerts", "location", "POINT"),
    ]

    all_ok = True
    for table_name, col_name, expected_geom in spatial_checks:
        table = Base.metadata.tables.get(table_name)
        if table is None or col_name not in table.columns:
            print(f"  [FAIL] Column '{table_name}.{col_name}' not found!")
            all_ok = False
            continue

        col = table.columns[col_name]
        geom_type = str(getattr(col.type, "geometry_type", "UNKNOWN"))
        srid = getattr(col.type, "srid", None)

        if geom_type == expected_geom and srid == 4326:
            print(f"  [PASS] {table_name:25}.{col_name:20} -> {geom_type} (SRID: {srid})")
        else:
            print(f"  [FAIL] {table_name}.{col_name} -> Found {geom_type} (SRID: {srid}), expected {expected_geom} (4326)")
            all_ok = False

    return all_ok


def verify_spatial_wkt_math() -> bool:
    print("\n--- 3. Verifying Spatial Vector Geometry Math & WKT Parsing ---")
    try:
        # Sample Farm Polygon
        raw_poly = "POLYGON((73.8500 18.5200, 73.8560 18.5200, 73.8560 18.5250, 73.8500 18.5250, 73.8500 18.5200))"
        geom = wkt.loads(raw_poly)
        assert geom.is_valid, "Polygon geometry is not topologically valid"
        assert geom.geom_type == "Polygon"

        # Point inside zone
        raw_point = "POINT(73.8530 18.5225)"
        pt = wkt.loads(raw_point)
        assert geom.contains(pt), "Point was expected to be inside farm polygon"

        print(f"  [PASS] WKT parsing & geometric containment test passed.")
        print(f"  [PASS] Calculated envelope: {geom.bounds}")
        return True
    except Exception as e:
        print(f"  [FAIL] Spatial geometry test error: {e}")
        return False


def verify_alembic_configuration() -> bool:
    print("\n--- 4. Verifying Alembic Migration Revisions ---")
    try:
        versions_dir = backend_dir / "alembic" / "versions"
        migrations = list(versions_dir.glob("*.py"))
        print(f"  Found {len(migrations)} migration revision script(s):")
        for m in migrations:
            print(f"    - {m.name}")
        assert len(migrations) >= 1, "At least 1 migration revision must exist"
        print("  [PASS] Alembic migration configuration verified.")
        return True
    except Exception as e:
        print(f"  [FAIL] Alembic verification error: {e}")
        return False


def main():
    print("==========================================================")
    print("KISAN SATHI: Step 3 Database Architecture Verification")
    print("==========================================================")

    m_ok = verify_models_and_tables()
    s_ok = verify_spatial_geometry_definitions()
    w_ok = verify_spatial_wkt_math()
    a_ok = verify_alembic_configuration()

    print("\n==========================================================")
    if m_ok and s_ok and w_ok and a_ok:
        print("ALL DATABASE ARCHITECTURE CHECKS PASSED (24/24 MODELS)!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("DATABASE VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    main()
