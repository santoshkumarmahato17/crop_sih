from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class DroneProvider(ABC):
    """
    Abstract Drone Hardware & Telemetry Integration Provider.
    Encapsulates all communication with physical or simulated drone flight stacks
    (e.g., DJI Cloud API, MAVLink/PX4, Parrot FreeFlight, or Development Mock).
    """

    @abstractmethod
    async def schedule_mission(
        self,
        mission_id: str,
        flight_boundary: Dict[str, Any],
        altitude_meters: float,
        speed_mps: float,
    ) -> Dict[str, Any]:
        """Uploads flight plan waypoints to the drone provider."""
        pass

    @abstractmethod
    async def start_mission(self, mission_id: str) -> Dict[str, Any]:
        """Commands drone airframe to initiate mission takeoff and execute flight plan."""
        pass

    @abstractmethod
    async def complete_mission(self, mission_id: str) -> Dict[str, Any]:
        """Concludes mission, triggers landing, and bundles captured telemetry packages."""
        pass

    @abstractmethod
    async def get_telemetry(self, mission_id: str) -> Dict[str, Any]:
        """Queries live telemetry, battery voltage, GPS position, and waypoint progress."""
        pass
