from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.providers.drone.base import DroneProvider


class MockDroneProvider(DroneProvider):
    """
    Simulated Drone Hardware Provider for Local Development & Testing.
    
    Simulates:
    1. Mission waypoint grid generation.
    2. Autonomous mission takeoff and in-flight telemetry.
    3. Multi-spectral camera trigger frames with GPS coordinates.
    4. Mission completion and landing telemetry.
    
    NOTE: Explicitly identified as a development simulation (not real flight hardware).
    """

    def __init__(self):
        self.active_simulations: Dict[str, Dict[str, Any]] = {}

    async def schedule_mission(
        self,
        mission_id: str,
        flight_boundary: Dict[str, Any],
        altitude_meters: float,
        speed_mps: float,
    ) -> Dict[str, Any]:
        """Simulates flight plan compilation and onboard waypoint sync."""
        sim_data = {
            "mission_id": mission_id,
            "status": "SCHEDULED",
            "provider": "MockDroneProvider (Simulation Mode)",
            "altitude_meters": altitude_meters,
            "speed_mps": speed_mps,
            "waypoints_count": 24,
            "estimated_flight_minutes": 14.5,
            "battery_consumption_forecast_percent": 35.0,
            "scheduled_at": datetime.now(timezone.utc).isoformat(),
        }
        self.active_simulations[mission_id] = sim_data
        return sim_data

    async def start_mission(self, mission_id: str) -> Dict[str, Any]:
        """Simulates autonomous drone takeoff and survey initiation."""
        now = datetime.now(timezone.utc)
        sim_data = self.active_simulations.get(mission_id, {})
        sim_data.update({
            "status": "IN_PROGRESS",
            "takeoff_time": now.isoformat(),
            "live_battery_percentage": 98.5,
            "gps_fix_quality": "RTK_FIXED",
            "satellites_connected": 28,
            "current_altitude_m": 50.0,
            "current_speed_mps": 5.0,
            "camera_status": "TRIGGERING_MULTISPECTRAL",
            "log": "[SIMULATION] Drone airframe cleared motors, ascended to 50m AGL, initiating serpentine grid scan.",
        })
        self.active_simulations[mission_id] = sim_data
        return sim_data

    async def complete_mission(self, mission_id: str) -> Dict[str, Any]:
        """Simulates flight completion, return-to-home landing, and image payload capture."""
        now = datetime.now(timezone.utc)
        sim_data = self.active_simulations.get(mission_id, {})
        sim_data.update({
            "status": "COMPLETED",
            "completion_time": now.isoformat(),
            "final_battery_percentage": 68.0,
            "coverage_percentage": 100.0,
            "captured_frames_count": 48,
            "optical_bands": ["RGB", "RedEdge", "NIR", "Thermal_LWIR"],
            "ground_sampling_distance_cm_per_px": 2.4,
            "log": "[SIMULATION] Flight scan completed 100% boundary coverage. Airframe executed safe RTH landing.",
        })
        self.active_simulations[mission_id] = sim_data
        return sim_data

    async def get_telemetry(self, mission_id: str) -> Dict[str, Any]:
        """Returns synthetic development flight telemetry."""
        return self.active_simulations.get(
            mission_id,
            {
                "mission_id": mission_id,
                "status": "IDLE",
                "provider": "MockDroneProvider (Simulation Mode)",
                "live_battery_percentage": 100.0,
            },
        )


mock_drone_provider = MockDroneProvider()
