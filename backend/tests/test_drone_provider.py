import pytest
from shapely.geometry import Polygon
from shapely.ops import unary_union

from app.providers.drone.mock import MockDroneProvider
from app.spatial.geometry import calculate_geodesic_area_hectares


@pytest.mark.asyncio
async def test_mock_drone_provider_lifecycle():
    """Test MockDroneProvider scheduling, start, and completion phases."""
    provider = MockDroneProvider()
    mission_id = "test-mission-001"
    flight_boundary = {
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

    # 1. Schedule
    sched_res = await provider.schedule_mission(
        mission_id=mission_id,
        flight_boundary=flight_boundary,
        altitude_meters=50.0,
        speed_mps=5.0,
    )
    assert sched_res["status"] == "SCHEDULED"
    assert sched_res["waypoints_count"] > 0

    # 2. Start
    start_res = await provider.start_mission(mission_id)
    assert start_res["status"] == "IN_PROGRESS"
    assert "takeoff_time" in start_res
    assert start_res["live_battery_percentage"] > 90.0

    # 3. Telemetry
    telemetry = await provider.get_telemetry(mission_id)
    assert telemetry["status"] == "IN_PROGRESS"

    # 4. Complete
    comp_res = await provider.complete_mission(mission_id)
    assert comp_res["status"] == "COMPLETED"
    assert comp_res["coverage_percentage"] == 100.0
    assert comp_res["captured_frames_count"] > 0


def test_target_zones_flight_boundary_merging():
    """Test merging multiple target zone polygons into a unified flight corridor."""
    zone1_coords = [
        (73.8500, 18.5200),
        (73.8550, 18.5200),
        (73.8550, 18.5250),
        (73.8500, 18.5250),
        (73.8500, 18.5200),
    ]
    zone2_coords = [
        (73.8550, 18.5200),
        (73.8600, 18.5200),
        (73.8600, 18.5250),
        (73.8550, 18.5250),
        (73.8550, 18.5200),
    ]

    p1 = Polygon(zone1_coords)
    p2 = Polygon(zone2_coords)

    merged = unary_union([p1, p2])
    assert merged.is_valid
    assert merged.geom_type == "Polygon"

    merged_area = calculate_geodesic_area_hectares(merged)
    expected_area = calculate_geodesic_area_hectares(p1) + calculate_geodesic_area_hectares(p2)
    assert abs(merged_area - expected_area) < 0.2
