import math
from typing import Any, Dict, List, Optional, Tuple, Union
from shapely.geometry import MultiPolygon, Polygon, box
from shapely.geometry.base import BaseGeometry

from app.spatial.geometry import (
    calculate_geodesic_area_hectares,
    extract_centroid,
    shapely_to_wkt_element,
)


def generate_farm_grid_zones(
    farm_boundary: BaseGeometry,
    target_zone_count: int = 4,
    grid_size_meters: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """
    Intelligent Grid-Based Farm Zoning Algorithm.
    
    Steps:
    1. Computes parent farm bounding envelope (minx, miny, maxx, maxy).
    2. Constructs a regular grid based on target zone count or meter dimension.
    3. Performs spatial intersection: cell.intersection(farm_boundary).
    4. Eliminates empty geometries and microscopic slivers (< 0.001 ha).
    5. Enforces strict boundary containment (zones never extend outside the farm).
    6. Sorts zones geographically (Top-to-Bottom, Left-to-Right).
    7. Assigns sequential identifiers: Z01, Z02, ... Z99.
    
    Returns list of zone dictionaries with Shapely polygon, WKT, area, and centroid.
    """
    if farm_boundary.is_empty or not farm_boundary.is_valid:
        farm_boundary = farm_boundary.buffer(0)

    minx, miny, maxx, maxy = farm_boundary.bounds
    width_deg = maxx - minx
    height_deg = maxy - miny

    if width_deg <= 0 or height_deg <= 0:
        return []

    # Determine grid resolution (rows & columns)
    if grid_size_meters and grid_size_meters > 0:
        # Approximate degree conversion at center latitude
        mid_lat = (miny + maxy) / 2.0
        deg_lat_per_m = 1.0 / 111320.0
        deg_lng_per_m = 1.0 / (111320.0 * math.cos(math.radians(mid_lat)))

        step_x = grid_size_meters * deg_lng_per_m
        step_y = grid_size_meters * deg_lat_per_m

        cols = max(1, math.ceil(width_deg / step_x))
        rows = max(1, math.ceil(height_deg / step_y))
    else:
        target_count = max(1, min(100, target_zone_count))
        # Optimal aspect-ratio grid partitioning
        aspect_ratio = width_deg / height_deg if height_deg > 0 else 1.0
        cols = max(1, round(math.sqrt(target_count * aspect_ratio)))
        rows = max(1, math.ceil(target_count / cols))

    dx = width_deg / cols
    dy = height_deg / rows

    raw_zones: List[Tuple[Polygon, float, Tuple[float, float]]] = []

    for i in range(rows):
        for j in range(cols):
            cell_minx = minx + j * dx
            cell_maxx = minx + (j + 1) * dx
            cell_miny = miny + (rows - 1 - i) * dy
            cell_maxy = miny + (rows - i) * dy

            cell_box = box(cell_minx, cell_miny, cell_maxx, cell_maxy)

            # Spatial Intersection: Clip cell strictly to farm boundary
            clipped = cell_box.intersection(farm_boundary)

            if clipped.is_empty:
                continue

            # Extract individual polygons from MultiPolygon / GeometryCollection
            polygons_to_process: List[Polygon] = []
            if isinstance(clipped, Polygon):
                polygons_to_process.append(clipped)
            elif isinstance(clipped, MultiPolygon):
                polygons_to_process.extend(list(clipped.geoms))
            elif hasattr(clipped, "geoms"):
                for g in clipped.geoms:
                    if isinstance(g, Polygon):
                        polygons_to_process.append(g)

            for poly in polygons_to_process:
                if not poly.is_valid:
                    poly = poly.buffer(0)
                if not isinstance(poly, Polygon) or poly.is_empty:
                    continue

                area_ha = calculate_geodesic_area_hectares(poly)
                # Filter microscopic intersection slivers (< 0.001 ha = 10 m²)
                if area_ha < 0.001:
                    continue

                centroid = extract_centroid(poly)
                raw_zones.append((poly, area_ha, centroid))

    if not raw_zones:
        # Fallback: single zone matching entire boundary
        if isinstance(farm_boundary, Polygon):
            area_ha = calculate_geodesic_area_hectares(farm_boundary)
            centroid = extract_centroid(farm_boundary)
            raw_zones = [(farm_boundary, area_ha, centroid)]
        elif isinstance(farm_boundary, MultiPolygon) and len(farm_boundary.geoms) > 0:
            p = farm_boundary.geoms[0]
            area_ha = calculate_geodesic_area_hectares(p)
            centroid = extract_centroid(p)
            raw_zones = [(p, area_ha, centroid)]

    # Sort zones spatially: Top to Bottom (-lat), then Left to Right (+lng)
    raw_zones.sort(key=lambda item: (-item[2][1], item[2][0]))

    # Assign sequential codes (Z01, Z02, ... Z99)
    formatted_zones: List[Dict[str, Any]] = []
    for idx, (poly, area_ha, centroid) in enumerate(raw_zones, start=1):
        zone_code = f"Z{idx:02d}"
        formatted_zones.append({
            "zone_code": zone_code,
            "name": f"Zone {zone_code}",
            "geometry": poly,
            "wkt_element": shapely_to_wkt_element(poly, srid=4326),
            "area_hectares": area_ha,
            "centroid": centroid,
            "monitoring_status": "active",
            "health_status": "healthy",
            "risk_status": "low",
        })

    return formatted_zones
