"""
AGRI SHIELD — Geospatial Processing & Analysis Package.
Provides coordinate transformations, vector sanitization, raster index math, grid-based intelligent zoning, and PostGIS helpers.
"""

from app.spatial.crs import CoordinateReferenceSystem
from app.spatial.geometry import (
    calculate_geodesic_area_hectares,
    extract_centroid,
    geometry_to_geojson_dict,
    shapely_to_wkt_element,
    validate_and_sanitize_boundary,
)
from app.spatial.zoning import generate_farm_grid_zones

__all__ = [
    "CoordinateReferenceSystem",
    "validate_and_sanitize_boundary",
    "calculate_geodesic_area_hectares",
    "extract_centroid",
    "shapely_to_wkt_element",
    "geometry_to_geojson_dict",
    "generate_farm_grid_zones",
]
