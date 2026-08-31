import pytest
from shapely.geometry import Polygon

from app.spatial.geometry import (
    calculate_geodesic_area_hectares,
    extract_centroid,
    validate_and_sanitize_boundary,
)


def test_calculate_geodesic_area_known_square():
    """
    Verify geodesic area calculation on a 0.01 x 0.01 degree square (~1.1 km x 1.1 km).
    Expected ~120 - 125 hectares near 18 deg latitude.
    """
    # 0.01 deg x 0.01 deg around Pune, India (18.52 N, 73.85 E)
    square_coords = [
        (73.85, 18.52),
        (73.86, 18.52),
        (73.86, 18.53),
        (73.85, 18.53),
        (73.85, 18.52),
    ]
    poly = Polygon(square_coords)
    area_ha = calculate_geodesic_area_hectares(poly)
    assert 115.0 <= area_ha <= 130.0, f"Area {area_ha} ha is outside expected geodesic bounds"


def test_extract_centroid():
    """Verify centroid extraction precision."""
    coords = [
        (73.85, 18.52),
        (73.87, 18.52),
        (73.87, 18.54),
        (73.85, 18.54),
        (73.85, 18.52),
    ]
    poly = Polygon(coords)
    lng, lat = extract_centroid(poly)
    assert abs(lng - 73.86) < 0.001
    assert abs(lat - 18.53) < 0.001


def test_validate_and_sanitize_boundary_valid():
    """Verify valid GeoJSON boundary succeeds with reasonable area."""
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
    assert is_valid is True
    assert geom is not None
    assert geom.geom_type in ["Polygon", "MultiPolygon"]


def test_validate_and_sanitize_boundary_self_intersecting():
    """Verify self-intersecting hourglass polygon is caught or sanitized."""
    bowtie_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [73.8500, 18.5200],
                [73.8600, 18.5300],
                [73.8500, 18.5300],
                [73.8600, 18.5200],
                [73.8500, 18.5200],
            ]
        ],
    }
    # Should either report or repair to valid multi-polygon
    is_valid, msg, geom = validate_and_sanitize_boundary(bowtie_geojson)
    if is_valid:
        assert geom.is_valid is True


def test_validate_and_sanitize_boundary_out_of_bounds():
    """Verify invalid geographic coordinates fail validation."""
    out_of_bounds_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [200.0, 18.5200], # Longitude > 180
                [200.1, 18.5200],
                [200.1, 18.5300],
                [200.0, 18.5300],
                [200.0, 18.5200],
            ]
        ],
    }
    is_valid, msg, geom = validate_and_sanitize_boundary(out_of_bounds_geojson)
    assert is_valid is False
    assert "out of bounds" in msg.lower()
