from datetime import datetime, timezone
from typing import Dict, Any, Tuple
from app.models.sensor import SensorType, DataQualityStatus, FreshnessStatus

# Configurable bounds to avoid inventing strict biological thresholds
# that could break the application
SENSOR_VALIDATION_BOUNDS = {
    SensorType.TEMPERATURE: {"min": -20.0, "max": 65.0, "unit": "C"},
    SensorType.HUMIDITY: {"min": 0.0, "max": 100.0, "unit": "%"},
    SensorType.SOIL_MOISTURE: {"min": 0.0, "max": 100.0, "unit": "%"},
    SensorType.SOIL_TEMPERATURE: {"min": -15.0, "max": 50.0, "unit": "C"},
    SensorType.LEAF_WETNESS: {"min": 0.0, "max": 24.0, "unit": "hours"},
}

class SensorEngine:
    """
    Validates IoT Field Sensor readings and calculates temporal freshness.
    """
    
    @staticmethod
    def validate_reading(sensor_type: SensorType, measurement: float, unit: str) -> DataQualityStatus:
        """
        Validates whether a measurement falls within physically possible bounds.
        Invalid readings will not override Risk Engine calculations.
        """
        bounds = SENSOR_VALIDATION_BOUNDS.get(sensor_type)
        if not bounds:
            # If unknown sensor type, fallback to VALID but could flag warning
            return DataQualityStatus.VALID
            
        if unit.upper() != bounds["unit"].upper() and unit not in ["C", "F", "%", "hours", "hrs"]:
            return DataQualityStatus.QUALITY_WARNING
            
        # Basic sanity checks for physical impossibility
        if measurement < bounds["min"] or measurement > bounds["max"]:
            return DataQualityStatus.INVALID
            
        return DataQualityStatus.VALID

    @staticmethod
    def calculate_freshness(timestamp: datetime, current_time: datetime = None) -> FreshnessStatus:
        """
        Determines the freshness of a reading.
        CURRENT: < 12 hours
        RECENT: < 48 hours
        STALE: > 48 hours
        """
        if current_time is None:
            current_time = datetime.now(timezone.utc)
            
        # Ensure timestamp is timezone-aware for math
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
            
        diff_hours = (current_time - timestamp).total_seconds() / 3600.0
        
        if diff_hours < 0:
            # Futuristic timestamp
            return FreshnessStatus.STALE # Or invalid, but we'll mark it stale so it's distrusted
            
        if diff_hours <= 12:
            return FreshnessStatus.CURRENT
        elif diff_hours <= 48:
            return FreshnessStatus.RECENT
        else:
            return FreshnessStatus.STALE

sensor_engine = SensorEngine()
