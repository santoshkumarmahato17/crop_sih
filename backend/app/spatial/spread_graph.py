import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class FarmNode:
    """Node in the Regional Farm Risk Graph."""
    farm_id: str
    farm_name: str
    latitude: float
    longitude: float
    crop_type: str
    growth_stage: str
    active_disease_score: float  # 0 to 100
    active_pathogen: Optional[str] = None
    is_authorized_owner: bool = False


@dataclass
class WindVector:
    """Anemometric dispersion parameters."""
    direction_degrees: float  # 0 to 360 (degrees from which wind originates)
    speed_kmh: float  # wind speed in km/h


@dataclass
class RiskGraphEdge:
    """Directed edge in the Farm Risk Graph representing potential transmission risk."""
    source_farm_id: str
    source_farm_name: str
    target_farm_id: str
    target_farm_name: str
    distance_km: float
    wind_alignment_factor: float  # -1.0 to 1.0
    crop_similarity_score: float  # 0.0 to 1.0
    estimated_spread_risk: int  # 0 to 100
    spread_risk_tier: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    source_pathogen: str
    estimated_arrival_days: Optional[int] = None
    explanation: str = ""


def calculate_haversine_distance_km(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculates geodesic great-circle distance between two GPS coordinates in km."""
    R = 6371.0  # Earth's mean radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)


def calculate_bearing_degrees(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the compass bearing from Source coordinate to Target coordinate."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    theta = math.atan2(y, x)
    bearing = (math.degrees(theta) + 360.0) % 360.0
    return round(bearing, 1)


def calculate_crop_similarity(crop1: str, crop2: str) -> float:
    """Computes host compatibility and cross-inoculation index."""
    c1 = crop1.lower().strip()
    c2 = crop2.lower().strip()

    if c1 == c2:
        return 1.0

    # Botanical family compatibility
    cereal_grains = {"wheat", "barley", "oats", "rye"}
    solanaceae = {"tomato", "potato", "pepper", "eggplant"}
    legumes = {"soybean", "chickpea", "lentil", "pea", "bean"}

    if c1 in cereal_grains and c2 in cereal_grains:
        return 0.75
    if c1 in solanaceae and c2 in solanaceae:
        return 0.80
    if c1 in legumes and c2 in legumes:
        return 0.70

    return 0.20


def evaluate_spread_risk_edge(
    source: FarmNode,
    target: FarmNode,
    wind: WindVector,
) -> RiskGraphEdge:
    """
    Computes directed Potential Spread Risk from an active source farm to a target farm.
    
    Terminology:
    - Potential Spread Risk
    - Transmission Risk Indicator
    - Estimated Spread Risk
    """
    dist_km = calculate_haversine_distance_km(
        source.latitude, source.longitude, target.latitude, target.longitude
    )

    # Calculate bearing from Source -> Target
    bearing = calculate_bearing_degrees(
        source.latitude, source.longitude, target.latitude, target.longitude
    )

    # Wind blow vector is wind.direction_degrees + 180 (where wind travels towards)
    wind_blow_direction = (wind.direction_degrees + 180.0) % 360.0
    angle_diff = math.radians(abs(bearing - wind_blow_direction))
    wind_alignment = round(math.cos(angle_diff), 2)  # 1.0 = direct downwind, -1.0 = direct upwind

    # Distance attenuation factor (decay over distance)
    # Beyond 15km, airborne transmission diminishes sharply
    dist_factor = math.exp(-dist_km / 5.0)

    # Crop similarity factor
    crop_sim = calculate_crop_similarity(source.crop_type, target.crop_type)

    # Base transmission pressure from source active disease score
    base_pressure = source.active_disease_score  # 0 to 100

    # Wind boost: downwind adds up to +30% pressure
    wind_multiplier = 1.0 + (max(0.0, wind_alignment) * min(1.0, wind.speed_kmh / 30.0) * 0.4)

    # Composite Potential Spread Risk Score (0 to 100)
    raw_risk = base_pressure * dist_factor * crop_sim * wind_multiplier
    spread_score = int(round(max(0.0, min(100.0, raw_risk))))

    # Classify Spread Risk Tier
    if spread_score >= 70:
        tier = "CRITICAL"
    elif spread_score >= 45:
        tier = "HIGH"
    elif spread_score >= 20:
        tier = "MEDIUM"
    else:
        tier = "LOW"

    # Estimated arrival window based on distance and wind speed
    arrival_days = None
    if spread_score >= 20 and wind.speed_kmh > 0:
        eff_speed = max(2.0, wind.speed_kmh * max(0.2, wind_alignment))
        arrival_hours = (dist_km / eff_speed) * 24.0
        arrival_days = max(1, int(math.ceil(arrival_hours / 24.0)))

    pathogen_label = source.active_pathogen or "Airborne Fungal Inoculum"

    explanation = (
        f"Estimated Spread Risk of {spread_score}/100 ({tier}) from {source.farm_name} ({dist_km:.1f}km away). "
        f"Wind vector ({wind.speed_kmh:.0f}km/h from {wind.direction_degrees:.0f}°) alignment: {wind_alignment:+.2f}. "
        f"Host crop similarity ({source.crop_type} -> {target.crop_type}): {int(crop_sim * 100)}%."
    )

    return RiskGraphEdge(
        source_farm_id=source.farm_id,
        source_farm_name=source.farm_name,
        target_farm_id=target.farm_id,
        target_farm_name=target.farm_name,
        distance_km=dist_km,
        wind_alignment_factor=wind_alignment,
        crop_similarity_score=crop_sim,
        estimated_spread_risk=spread_score,
        spread_risk_tier=tier,
        source_pathogen=pathogen_label,
        estimated_arrival_days=arrival_days,
        explanation=explanation,
    )
