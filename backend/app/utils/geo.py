from typing import List, Tuple


def calculate_bounding_box(coordinates: List[Tuple[float, float]]) -> Tuple[float, float, float, float]:
    """
    Computes (min_lng, min_lat, max_lng, max_lat) from a list of (longitude, latitude) pairs.
    """
    if not coordinates:
        return (0.0, 0.0, 0.0, 0.0)

    lngs = [p[0] for p in coordinates]
    lats = [p[1] for p in coordinates]
    return (min(lngs), min(lats), max(lngs), max(lats))


def format_hectares(area_sq_meters: float) -> float:
    """Converts square meters to hectares rounded to 2 decimal places."""
    return round(area_sq_meters / 10000.0, 2)
