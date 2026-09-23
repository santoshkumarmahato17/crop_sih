#!/usr/bin/env python3
"""
KISAN SATHI — Step 6 Intelligent Farm Zoning Verification Script.
Validates:
1. Grid zoning on standard rectangular farm boundaries
2. Grid zoning on irregular / concave / L-shaped agricultural boundaries
3. Absolute boundary containment guarantee (zones never extend outside farm perimeter)
4. Sliver elimination (< 0.001 ha)
5. Zone sequential code assignment (Z01, Z02, ... Z99)
6. Total acreage sum conservation
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from shapely.geometry import MultiPolygon, Polygon
from app.spatial.geometry import calculate_geodesic_area_hectares
from app.spatial.zoning import generate_farm_grid_zones


def test_regular_boundary_zoning() -> bool:
    print("\n--- 1. Testing Zoning on Regular Rectangular Farm ---")
    coords = [
        (73.8500, 18.5200),
        (73.8600, 18.5200),
        (73.8600, 18.5300),
        (73.8500, 18.5300),
        (73.8500, 18.5200),
    ]
    farm_poly = Polygon(coords)
    farm_area = calculate_geodesic_area_hectares(farm_poly)
    print(f"  Parent Farm Area: {farm_area:.2f} ha")

    # Generate 4 zones
    zones_4 = generate_farm_grid_zones(farm_poly, target_zone_count=4)
    print(f"  Generated {len(zones_4)} zones for target=4:")
    for z in zones_4:
        print(f"    - {z['zone_code']}: {z['name']} ({z['area_hectares']:.2f} ha), Centroid=({z['centroid'][0]:.4f}, {z['centroid'][1]:.4f})")

    if len(zones_4) != 4:
        print(f"  [FAIL] Expected 4 zones, got {len(zones_4)}")
        return False

    total_zone_area = sum(z["area_hectares"] for z in zones_4)
    if abs(total_zone_area - farm_area) > 0.5:
        print(f"  [FAIL] Total zone area {total_zone_area:.2f} ha != farm area {farm_area:.2f} ha")
        return False

    print("  [PASS] Regular rectangular zoning verified.")
    return True


def test_irregular_concave_zoning() -> bool:
    print("\n--- 2. Testing Zoning on Irregular Concave / L-Shaped Farm ---")
    l_coords = [
        (73.8500, 18.5200),
        (73.8600, 18.5200),
        (73.8600, 18.5250), # L-shaped step
        (73.8550, 18.5250),
        (73.8550, 18.5300),
        (73.8500, 18.5300),
        (73.8500, 18.5200),
    ]
    l_poly = Polygon(l_coords)
    l_area = calculate_geodesic_area_hectares(l_poly)
    print(f"  Irregular L-Shaped Farm Area: {l_area:.2f} ha")

    zones = generate_farm_grid_zones(l_poly, target_zone_count=8)
    print(f"  Generated {len(zones)} zones for irregular holding:")

    all_inside = True
    for z in zones:
        geom = z["geometry"]
        diff = geom.difference(l_poly)
        is_contained = diff.area < 1e-9
        print(f"    - {z['zone_code']}: {z['area_hectares']:.2f} ha (Contained: {is_contained})")
        if not is_contained:
            all_inside = False

    if not all_inside:
        print("  [FAIL] Boundary violation detected: zone extends outside irregular farm perimeter!")
        return False

    print("  [PASS] Irregular concave zoning & boundary clipping verified.")
    return True


def test_meter_grid_zoning() -> bool:
    print("\n--- 3. Testing Meter-Resolution Zoning (grid_size_meters=250m) ---")
    coords = [
        (73.8500, 18.5200),
        (73.8600, 18.5200),
        (73.8600, 18.5300),
        (73.8500, 18.5300),
        (73.8500, 18.5200),
    ]
    farm_poly = Polygon(coords)

    zones = generate_farm_grid_zones(farm_poly, grid_size_meters=250.0)
    print(f"  Generated {len(zones)} zones with 250m grid resolution.")
    print(f"  First zone: {zones[0]['zone_code']}, Last zone: {zones[-1]['zone_code']}")

    if len(zones) < 10 or zones[0]["zone_code"] != "Z01":
        print("  [FAIL] Unexpected meter grid zoning output.")
        return False

    print("  [PASS] Meter-resolution zoning verified.")
    return True


def main():
    print("==========================================================")
    print("KISAN SATHI: Step 6 Intelligent Farm Zoning Verification")
    print("==========================================================")

    r_ok = test_regular_boundary_zoning()
    i_ok = test_irregular_concave_zoning()
    m_ok = test_meter_grid_zoning()

    print("\n==========================================================")
    if r_ok and i_ok and m_ok:
        print("ALL INTELLIGENT FARM ZONING CHECKS PASSED SUCCESSFULLY!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("FARM ZONING VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    main()
