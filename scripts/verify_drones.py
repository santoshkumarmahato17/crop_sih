#!/usr/bin/env python3
"""
KISAN SATHI — Step 7 Drone Monitoring Management Verification Script.
Validates:
1. Decoupled DroneProvider interface and MockDroneProvider simulation
2. Drone model construction with sensors and battery telemetry
3. DroneMission model construction with PostGIS polygon corridor
4. Target zones flight boundary union math
5. Priority and status lifecycle transitions
"""

import sys
import asyncio
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from shapely.geometry import Polygon
from shapely.ops import unary_union
from geoalchemy2.elements import WKTElement

from app.models.drone import Drone, DroneMission, DroneStatus, MissionStatus
from app.providers.drone.mock import MockDroneProvider
from app.spatial.geometry import calculate_geodesic_area_hectares, shapely_to_wkt_element


async def test_mock_drone_provider() -> bool:
    print("\n--- 1. Testing Decoupled MockDroneProvider ---")
    provider = MockDroneProvider()
    mission_id = "test-mission-mock-01"

    # Schedule
    flight_geom = {
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
    sched = await provider.schedule_mission(
        mission_id=mission_id,
        flight_boundary=flight_geom,
        altitude_meters=50.0,
        speed_mps=5.0,
    )
    assert sched["status"] == "SCHEDULED"
    print(f"  [PASS] Mission scheduled in mock provider ({sched['waypoints_count']} waypoints generated)")

    # Start
    start = await provider.start_mission(mission_id)
    assert start["status"] == "IN_PROGRESS"
    print(f"  [PASS] Mock takeoff simulated: Status={start['status']}, Battery={start['live_battery_percentage']}%")

    # Telemetry
    telem = await provider.get_telemetry(mission_id)
    assert telem["status"] == "IN_PROGRESS"
    print(f"  [PASS] Telemetry query verified: Satellites={telem.get('satellites_connected', 'N/A')}")

    # Complete
    comp = await provider.complete_mission(mission_id)
    assert comp["status"] == "COMPLETED"
    assert comp["coverage_percentage"] == 100.0
    print(f"  [PASS] Mission completed in mock provider: Coverage={comp['coverage_percentage']}%, Frames={comp['captured_frames_count']}")
    return True


def test_drone_and_mission_models() -> bool:
    print("\n--- 2. Testing Drone & DroneMission ORM Models ---")
    
    # 1. Drone
    drone = Drone(
        id="drone-001",
        name="AgriFlyer Matrice-1",
        serial_number="DJI-M350-99214",
        manufacturer="DJI Enterprise",
        model_name="Matrice 350 RTK",
        camera_type="Zenmuse P1 + Multispectral",
        sensor_capabilities=["RGB", "RedEdge", "NIR", "Thermal_LWIR"],
        battery_percentage=94.0,
        battery_cycle_count=18,
        operational_status="AVAILABLE",
        status=DroneStatus.IDLE,
    )
    assert drone.name == "AgriFlyer Matrice-1"
    assert drone.battery_percentage == 94.0
    print(f"  [PASS] Drone model instantiated: {drone.name} ({drone.manufacturer} {drone.model_name})")

    # 2. Drone Mission with PostGIS Polygon
    coords = [
        (73.8500, 18.5200),
        (73.8560, 18.5200),
        (73.8560, 18.5250),
        (73.8500, 18.5250),
        (73.8500, 18.5200),
    ]
    poly = Polygon(coords)
    postgis_corridor = shapely_to_wkt_element(poly, srid=4326)

    mission = DroneMission(
        id="mission-001",
        farm_id="farm-001",
        drone_id=drone.id,
        flight_boundary=postgis_corridor,
        target_zones=["Z01", "Z02", "Z03"],
        mission_date=datetime.now(timezone.utc),
        altitude_meters=50.0,
        flight_speed_mps=5.0,
        overlap_percentage=75.0,
        coverage_percentage=0.0,
        priority="HIGH",
        status=MissionStatus.SCHEDULED,
    )
    assert mission.flight_boundary.srid == 4326
    assert mission.priority == "HIGH"
    assert len(mission.target_zones) == 3
    print(f"  [PASS] DroneMission model instantiated: Priority={mission.priority}, Status={mission.status.name}, Target Zones={mission.target_zones}")
    return True


def test_target_zones_flight_corridor_merging() -> bool:
    print("\n--- 3. Testing Target Zones Flight Corridor Merging ---")
    
    # 2 adjacent zones
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
    
    area_1 = calculate_geodesic_area_hectares(p1)
    area_2 = calculate_geodesic_area_hectares(p2)
    merged_area = calculate_geodesic_area_hectares(merged)
    
    print(f"  Zone 1 Area: {area_1:.2f} ha, Zone 2 Area: {area_2:.2f} ha")
    print(f"  Merged Flight Boundary Corridor: {merged_area:.2f} ha")
    
    if abs(merged_area - (area_1 + area_2)) < 0.2:
        print("  [PASS] Flight corridor spatial union verified without overlapping artifacts.")
        return True
    else:
        print("  [FAIL] Merged area mismatch!")
        return False


async def main():
    print("==========================================================")
    print("KISAN SATHI: Step 7 Drone Monitoring Management Verification")
    print("==========================================================")

    p_ok = await test_mock_drone_provider()
    m_ok = test_drone_and_mission_models()
    c_ok = test_target_zones_flight_corridor_merging()

    print("\n==========================================================")
    if p_ok and m_ok and c_ok:
        print("ALL DRONE MONITORING MANAGEMENT CHECKS PASSED!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("DRONE MANAGEMENT VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
