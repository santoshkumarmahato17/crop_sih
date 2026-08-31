import pytest
from shapely.geometry import MultiPolygon, Polygon

from app.spatial.geometry import calculate_geodesic_area_hectares
from app.spatial.zoning import generate_farm_grid_zones


def test_grid_zoning_rectangular_farm():
    """Test generating 4 zones on a standard rectangular farm holding."""
    rect_coords = [
        (73.8500, 18.5200),
        (73.8600, 18.5200),
        (73.8600, 18.5300),
        (73.8500, 18.5300),
        (73.8500, 18.5200),
    ]
    farm_poly = Polygon(rect_coords)
    farm_area = calculate_geodesic_area_hectares(farm_poly)

    zones = generate_farm_grid_zones(farm_poly, target_zone_count=4)

    assert len(zones) == 4, f"Expected 4 zones, got {len(zones)}"
    assert zones[0]["zone_code"] == "Z01"
    assert zones[1]["zone_code"] == "Z02"
    assert zones[2]["zone_code"] == "Z03"
    assert zones[3]["zone_code"] == "Z04"

    # Verify that each zone is inside the farm boundary
    for z in zones:
        geom = z["geometry"]
        assert geom.is_valid
        # Zone difference from parent farm must be empty / negligible
        diff_area = geom.difference(farm_poly).area
        assert diff_area < 1e-8, "Zone extends outside farm boundary!"

    # Verify total zone area matches parent farm area
    total_zone_area = sum(z["area_hectares"] for z in zones)
    assert abs(total_zone_area - farm_area) < 0.5, "Zone areas do not sum to total farm area"


def test_grid_zoning_irregular_l_shaped_farm():
    """
    Test zoning on an irregular concave / L-shaped farm boundary.
    Crucial check: Zones must NEVER extend outside the concave notch of the L-shape!
    """
    # L-shaped polygon vertices
    l_coords = [
        (73.8500, 18.5200),
        (73.8600, 18.5200),
        (73.8600, 18.5250), # L-corner step
        (73.8550, 18.5250),
        (73.8550, 18.5300),
        (73.8500, 18.5300),
        (73.8500, 18.5200),
    ]
    l_poly = Polygon(l_coords)
    assert l_poly.is_valid

    zones = generate_farm_grid_zones(l_poly, target_zone_count=8)

    assert len(zones) >= 3, "Should generate multiple zones for L-shaped holding"

    for z in zones:
        geom = z["geometry"]
        assert geom.is_valid
        # Absolute containment check: No zone point outside L-polygon
        diff = geom.difference(l_poly)
        assert diff.area < 1e-9, f"Zone {z['zone_code']} violates farm perimeter boundary!"

    print(f"\nGenerated {len(zones)} valid zones for irregular L-shaped farm.")


def test_grid_zoning_trapezoidal_farm():
    """Test zoning on an irregular slanted trapezoidal boundary."""
    trapezoid_coords = [
        (73.8500, 18.5200),
        (73.8650, 18.5220), # Slanted base
        (73.8580, 18.5300), # Narrow top
        (73.8510, 18.5280),
        (73.8500, 18.5200),
    ]
    trap_poly = Polygon(trapezoid_coords)
    assert trap_poly.is_valid

    zones = generate_farm_grid_zones(trap_poly, target_zone_count=6)
    assert len(zones) >= 4

    for z in zones:
        geom = z["geometry"]
        assert geom.is_valid
        assert geom.difference(trap_poly).area < 1e-9


def test_grid_zoning_meter_resolution():
    """Test generating zones with explicit grid size in meters."""
    rect_coords = [
        (73.8500, 18.5200),
        (73.8600, 18.5200),
        (73.8600, 18.5300),
        (73.8500, 18.5300),
        (73.8500, 18.5200),
    ]
    farm_poly = Polygon(rect_coords)
    # ~1.1 km x 1.1 km -> 300m cells should yield approx 12-16 zones
    zones = generate_farm_grid_zones(farm_poly, grid_size_meters=300.0)
    assert 9 <= len(zones) <= 20
    assert zones[0]["zone_code"] == "Z01"
