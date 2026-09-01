from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional
from app.weather.provider import WeatherDataPoint


class WeatherSignal(str, Enum):
    HIGH_HUMIDITY = "HIGH_HUMIDITY"
    HEAVY_RAIN = "HEAVY_RAIN"
    PROLONGED_RAIN = "PROLONGED_RAIN"
    HIGH_TEMPERATURE = "HIGH_TEMPERATURE"
    LOW_TEMPERATURE = "LOW_TEMPERATURE"
    RAPID_TEMPERATURE_CHANGE = "RAPID_TEMPERATURE_CHANGE"
    HIGH_WIND = "HIGH_WIND"
    LOW_RAINFALL = "LOW_RAINFALL"
    DRY_PERIOD = "DRY_PERIOD"
    HIGH_HEAT = "HIGH_HEAT"
    WET_PERIOD = "WET_PERIOD"


@dataclass
class EnvironmentalSignalAnalysis:
    """Detected agronomic environmental signals and severity attributions."""
    signals: List[WeatherSignal] = field(default_factory=list)
    signal_explanations: List[str] = field(default_factory=list)
    leaf_wetness_hours_estimate: float = 0.0
    evapotranspiration_stress_factor: float = 1.0
    microclimate_disease_suitability: float = 0.0  # 0.0 to 1.0
    microclimate_pest_suitability: float = 0.0  # 0.0 to 1.0
    microclimate_water_deficit: float = 0.0  # 0.0 to 1.0


class WeatherConditionAnalyzer:
    """Analyzes weather telemetry time-series to detect physical microclimate signals."""

    @staticmethod
    def analyze_point(point: WeatherDataPoint, prev_point: Optional[WeatherDataPoint] = None) -> EnvironmentalSignalAnalysis:
        signals: List[WeatherSignal] = []
        explanations: List[str] = []

        # 1. Humidity Analysis
        if point.relative_humidity_percent >= 80.0:
            signals.append(WeatherSignal.HIGH_HUMIDITY)
            explanations.append(f"Elevated canopy humidity ({point.relative_humidity_percent:.1f}%) creates high sporulation risk.")

        # 2. Rainfall Severity
        if point.rainfall_mm >= 25.0:
            signals.append(WeatherSignal.HEAVY_RAIN)
            explanations.append(f"Heavy rainfall event ({point.rainfall_mm:.1f}mm) promotes soil saturation and splash dispersal.")
        elif point.rainfall_mm <= 1.0:
            signals.append(WeatherSignal.LOW_RAINFALL)

        # 3. Wet Period Persistence
        if point.relative_humidity_percent >= 75.0 and point.rainfall_mm >= 5.0:
            signals.append(WeatherSignal.WET_PERIOD)
            explanations.append("Combined canopy wetness and rainfall sustain prolonged leaf surface moisture.")

        if (point.rainfall_duration_hours or 0.0) >= 4.0 or (point.rainfall_mm >= 15.0 and point.relative_humidity_percent >= 82.0):
            signals.append(WeatherSignal.PROLONGED_RAIN)

        # 4. Thermal Stress
        if point.temperature_c >= 35.0 or (point.max_temperature_c and point.max_temperature_c >= 35.0):
            signals.append(WeatherSignal.HIGH_TEMPERATURE)
            explanations.append(f"High daytime thermal peaks ({point.temperature_c:.1f}°C) accelerate plant evapotranspiration.")
        
        if (point.max_temperature_c and point.max_temperature_c >= 38.0) or point.temperature_c >= 38.0:
            signals.append(WeatherSignal.HIGH_HEAT)

        if point.temperature_c <= 12.0 or (point.min_temperature_c and point.min_temperature_c <= 10.0):
            signals.append(WeatherSignal.LOW_TEMPERATURE)
            explanations.append(f"Low temperature threshold ({point.temperature_c:.1f}°C) may induce chilling stress or slow vegetative vigor.")

        # 5. Rapid Temperature Delta
        if prev_point:
            temp_delta = abs(point.temperature_c - prev_point.temperature_c)
            if temp_delta >= 6.0:
                signals.append(WeatherSignal.RAPID_TEMPERATURE_CHANGE)
                explanations.append(f"Abrupt temperature shift (Δ{temp_delta:.1f}°C) induces crop physiological stress.")

        # 6. High Wind
        if point.wind_speed_mps >= 7.0:  # >= 25 km/h
            signals.append(WeatherSignal.HIGH_WIND)
            explanations.append(f"Elevated wind velocity ({point.wind_speed_mps:.1f} m/s) facilitates aerial pathogen and pest dispersal.")

        # 7. Dry Period
        if point.rainfall_mm < 1.0 and point.temperature_c >= 30.0 and point.relative_humidity_percent <= 50.0:
            signals.append(WeatherSignal.DRY_PERIOD)
            explanations.append("Persistent dry microclimate with high solar radiation increases soil water depletion.")

        # Compute Microclimate Suitability Indices
        # Disease: Optimal in 18°C-28°C with high humidity & rain
        temp_disease_factor = max(0.0, 1.0 - abs(point.temperature_c - 23.0) / 15.0)
        hum_disease_factor = max(0.0, (point.relative_humidity_percent - 50.0) / 50.0)
        rain_disease_factor = min(1.0, point.rainfall_mm / 20.0)
        disease_suitability = min(1.0, temp_disease_factor * 0.4 + hum_disease_factor * 0.4 + rain_disease_factor * 0.2)

        # Pest: Optimal in 24°C-34°C with moderate humidity
        temp_pest_factor = max(0.0, 1.0 - abs(point.temperature_c - 28.0) / 12.0)
        pest_suitability = min(1.0, temp_pest_factor * 0.6 + (point.relative_humidity_percent / 100.0) * 0.4)

        # Water Deficit
        water_deficit = max(0.0, min(1.0, (point.temperature_c - 24.0) / 16.0 * 0.6 + (1.0 - point.relative_humidity_percent / 100.0) * 0.4 - min(1.0, point.rainfall_mm / 15.0)))

        return EnvironmentalSignalAnalysis(
            signals=signals,
            signal_explanations=explanations,
            leaf_wetness_hours_estimate=getattr(point, "leaf_wetness_hours", None) or (point.relative_humidity_percent * 0.1 if point.relative_humidity_percent >= 75 else 1.0),
            evapotranspiration_stress_factor=1.0 + max(0.0, (point.temperature_c - 25.0) * 0.05),
            microclimate_disease_suitability=round(disease_suitability, 3),
            microclimate_pest_suitability=round(pest_suitability, 3),
            microclimate_water_deficit=round(water_deficit, 3),
        )
