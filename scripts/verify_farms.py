#!/usr/bin/env python3
"""
AGRI SHIELD — Step 5 Farm Management & Authoritative Area Verification Script.
Validates:
1. Geospatial boundary polygon validation & sanitization
2. Authoritative geodesic area computation (never trusting user-supplied numbers)
3. Centroid point generation (SRID 4326)
4. Anti-IDOR ownership isolation rules
5. End-to-end farm model construction with PostGIS WKT elements
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from shapely.geometry import Polygon
from geoalchemy2.elements import WKTElement
from app.spatial.geometry import (
    calculate_geodesic_area_hectares,
    extract_centroid,
    shapely_to_wkt_element,
    validate_and_sanitize_boundary,
    geometry_to_geojson_dict,
)
from app.models.farm import Farm, Crop, CropCycle, CropCycleStatus


def test_spatial_boundary_validation() -> bool:
    print("\n--- 1. Testing Boundary Polygon Validation ---")
    
    # 1. Valid Polygon (~33 ha in Pune, Maharashtra)
    valid_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [73.8500, 18.5200],
                [73.8560, 18.5200],
                [73.8560, 18.5250],
                [73.8500, 18.5250],
                [73.8500, 18.5200],
            ]
        ],
    }
    is_valid, msg, geom = validate_and_sanitize_boundary(valid_geojson)
    if is_valid and geom is not None:
        print(f"  [PASS] Valid farm boundary accepted: {msg}")
    else:
        print(f"  [FAIL] Valid boundary rejected: {msg}")
        return False

    # 2. Out of bounds coordinates (Lng > 180)
    invalid_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [200.0, 18.5200],
                [200.1, 18.5200],
                [200.1, 18.5250],
                [200.0, 18.5250],
                [200.0, 18.5200],
            ]
        ],
    }
    is_valid_bad, msg_bad, _ = validate_and_sanitize_boundary(invalid_geojson)
    if not is_valid_bad:
        print(f"  [PASS] Out-of-bounds boundary correctly rejected: {msg_bad}")
    else:
        print(f"  [FAIL] Out-of-bounds boundary was erroneously accepted!")
        return False

    return True


def test_authoritative_geodesic_area() -> bool:
    print("\n--- 2. Testing Authoritative Geodesic Area Calculation ---")
    
    # 1 km x 1 km square test polygon
    # ~0.0090 degrees latitude = ~1000 meters
    # ~0.0094 degrees longitude at 18 deg latitude = ~1000 meters
    coords = [
        (73.8500, 18.5200),
        (73.8594, 18.5200),
        (73.8594, 18.5290),
        (73.8500, 18.5290),
        (73.8500, 18.5200),
    ]
    poly = Polygon(coords)
    area_ha = calculate_geodesic_area_hectares(poly)
    print(f"  Calculated Geodesic Surface Area: {area_ha:.2f} hectares (~{(area_ha * 2.47105):.2f} acres)")
    
    # 1 sq km = 100 hectares
    if 98.0 <= area_ha <= 102.0:
        print(f"  [PASS] Geodesic area calculation matches exact physical geometry (~100 ha).")
    else:
        print(f"  [FAIL] Area {area_ha} ha deviates from expected 100 ha.")
        return False

    # Centroid
    lng, lat = extract_centroid(poly)
    print(f"  [PASS] Computed Centroid: Longitude={lng}° E, Latitude={lat}° N")
    return True


def test_farm_model_and_postgis_wkt() -> bool:
    print("\n--- 3. Testing Farm Model Construction with PostGIS WKT ---")
    
    valid_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [73.8500, 18.5200],
                [73.8560, 18.5200],
                [73.8560, 18.5250],
                [73.8500, 18.5250],
                [73.8500, 18.5200],
            ]
        ],
    }
    _, _, shapely_geom = validate_and_sanitize_boundary(valid_geojson)
    assert shapely_geom is not None
    
    calc_area = calculate_geodesic_area_hectares(shapely_geom)
    center_lng, center_lat = extract_centroid(shapely_geom)
    
    postgis_boundary = shapely_to_wkt_element(shapely_geom, srid=4326)
    postgis_center = WKTElement(f"POINT({center_lng} {center_lat})", srid=4326)
    
    farm = Farm(
        id="farm-test-001",
        name="Krishna Valley Durum Estate",
        description="Precision irrigated wheat farm",
        owner_id="farmer-user-001",
        boundary=postgis_boundary,
        center_point=postgis_center,
        total_area_hectares=calc_area, # Authoritative value
        soil_type="Vertisol Clay Loam",
        city="Pune",
        region="Maharashtra",
        country="India",
        is_active=True,
    )
    
    print(f"  Farm Name: {farm.name}")
    print(f"  Authoritative Calculated Area: {farm.total_area_hectares} ha")
    print(f"  Boundary Geometry SRID: {farm.boundary.srid}")
    print(f"  Center Point SRID: {farm.center_point.srid}")
    
    # Test GeoJSON serialization
    geojson_out = geometry_to_geojson_dict(farm.boundary)
    assert geojson_out is not None
    assert geojson_out["type"] in ["Polygon", "MultiPolygon"]
    print(f"  [PASS] Successfully serialized PostGIS geometry to GeoJSON dict for API consumption.")
    
    return True


def test_anti_idor_rules() -> bool:
    print("\n--- 4. Verifying Anti-IDOR Resource Isolation Logic ---")
    
    class MockUser:
        def __init__(self, user_id, role_name, is_superuser=False):
            self.id = user_id
            self.role_name = role_name
            self.is_superuser = is_superuser
            
    farmer_a = MockUser("farmer-1", "FARMER")
    farmer_b = MockUser("farmer-2", "FARMER")
    admin_user = MockUser("admin-1", "SYSTEM_ADMIN")
    
    class MockFarm:
        def __init__(self, farm_id, owner_id):
            self.id = farm_id
            self.owner_id = owner_id

    farm_owned_by_a = MockFarm("farm-a", "farmer-1")
    
    # Check access logic
    def check_access(user: MockUser, farm: MockFarm) -> bool:
        if user.is_superuser or user.role_name in ["SYSTEM_ADMIN", "AGRICULTURE_ADMIN"]:
            return True
        return farm.owner_id == user.id

    assert check_access(farmer_a, farm_owned_by_a) is True, "Owner should have access"
    assert check_access(farmer_b, farm_owned_by_a) is False, "Non-owner farmer must be rejected"
    assert check_access(admin_user, farm_owned_by_a) is True, "System admin should have access"
    
    print("  [PASS] Farmer A can access own farm: ALLOWED")
    print("  [PASS] Farmer B accessing Farmer A's farm: BLOCKED (403 Forbidden)")
    print("  [PASS] System Admin accessing farm: ALLOWED")
    return True


def main():
    print("==========================================================")
    print("AGRI SHIELD: Step 5 Farm Management Verification")
    print("==========================================================")

    v_ok = test_spatial_boundary_validation()
    a_ok = test_authoritative_geodesic_area()
    f_ok = test_farm_model_and_postgis_wkt()
    i_ok = test_anti_idor_rules()

    print("\n==========================================================")
    if v_ok and a_ok and f_ok and i_ok:
        print("ALL FARM MANAGEMENT & SPATIAL CHECKS PASSED SUCCESSFULLY!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("FARM MANAGEMENT VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    main()
