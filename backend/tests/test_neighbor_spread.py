import pytest

from app.spatial.spread_graph import (
    FarmNode,
    WindVector,
    calculate_bearing_degrees,
    calculate_crop_similarity,
    calculate_haversine_distance_km,
    evaluate_spread_risk_edge,
)


def test_haversine_and_bearing():
    """Test geodesic distance and bearing calculations between geographic coordinates."""
    # Pune to approx 5.5km East
    lat1, lon1 = 18.5225, 73.8525
    lat2, lon2 = 18.5225, 73.9050

    dist = calculate_haversine_distance_km(lat1, lon1, lat2, lon2)
    assert 5.0 <= dist <= 6.0

    bearing = calculate_bearing_degrees(lat1, lon1, lat2, lon2)
    # Target is directly East (~90 degrees)
    assert 85.0 <= bearing <= 95.0


def test_crop_similarity():
    """Test botanical family host susceptibility."""
    assert calculate_crop_similarity("Wheat", "Wheat") == 1.0
    assert calculate_crop_similarity("Wheat", "Barley") == 0.75
    assert calculate_crop_similarity("Tomato", "Potato") == 0.80
    assert calculate_crop_similarity("Wheat", "Tomato") == 0.20


def test_spread_risk_edge_evaluation():
    """
    Test directed contagion vector calculation with anemometric wind vector:
    Source: High active disease (85/100)
    Wind: Direct downwind towards target
    Distance: ~3.4km
    """
    source = FarmNode(
        farm_id="farm-src",
        farm_name="Source Holding",
        latitude=18.5200,
        longitude=73.8400,
        crop_type="Wheat",
        growth_stage="Grain Filling",
        active_disease_score=85.0,
        active_pathogen="Yellow Rust",
    )

    target = FarmNode(
        farm_id="farm-tgt",
        farm_name="Target Holding",
        latitude=18.5260,
        longitude=73.8650,
        crop_type="Wheat",
        growth_stage="Grain Filling",
        active_disease_score=0.0,
    )

    wind = WindVector(direction_degrees=225.0, speed_kmh=20.0)  # SW -> NE blow

    edge = evaluate_spread_risk_edge(source, target, wind)

    assert 0 <= edge.estimated_spread_risk <= 100
    assert edge.estimated_spread_risk > 30
    assert edge.wind_alignment_factor > 0.0
    assert edge.source_pathogen == "Yellow Rust"
    assert "Estimated Spread Risk" in edge.explanation
