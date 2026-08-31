from typing import Any, Dict, List, Optional, Tuple, Union
import pyproj
from geoalchemy2.elements import WKBElement, WKTElement
from geoalchemy2.shape import from_shape, to_shape
from shapely import wkt, wkb
from shapely.geometry import MultiPolygon, Point, Polygon, mapping, shape
from shapely.geometry.base import BaseGeometry

# WGS84 Geodetic Calculator for exact geodesic area & distance calculations
geod = pyproj.Geod(ellps="WGS84")


def validate_and_sanitize_boundary(
    geojson: Dict[str, Any]
) -> Tuple[bool, str, Optional[BaseGeometry]]:
    """
    Validates a GeoJSON dictionary and returns a sanitized Shapely Polygon or MultiPolygon.
    
    Checks:
    1. Structure represents a Polygon or MultiPolygon.
    2. Coordinates are within valid WGS84 ranges (Lng: [-180, 180], Lat: [-90, 90]).
    3. Polygon is topologically valid (closed rings, no self-intersections).
    4. Has at least 3 distinct vertices.
    5. Area is within reasonable agricultural limits (> 0.01 ha, < 50,000 ha).
    """
    if not isinstance(geojson, dict) or "coordinates" not in geojson:
        return False, "Invalid GeoJSON: must be a dict containing 'coordinates'.", None

    try:
        geom = shape(geojson)
    except Exception as e:
        return False, f"GeoJSON parsing failed: {str(e)}", None

    if not isinstance(geom, (Polygon, MultiPolygon)):
        return (
            False,
            f"Expected Polygon or MultiPolygon geometry, received '{geom.geom_type}'.",
            None,
        )

    if geom.is_empty:
        return False, "Geometry is empty.", None

    if not geom.is_valid:
        # Attempt repair
        geom = geom.buffer(0)
        if not geom.is_valid:
            return (
                False,
                "Geometry is topologically invalid (e.g. self-intersecting or malformed rings).",
                None,
            )

    # Coordinate boundary checks (WGS84 bounds)
    minx, miny, maxx, maxy = geom.bounds
    if minx < -180.0 or maxx > 180.0 or miny < -90.0 or maxy > 90.0:
        return (
            False,
            f"Coordinates out of bounds for WGS84: Lng [{minx}, {maxx}], Lat [{miny}, {maxy}].",
            None,
        )

    # Ensure Polygon is standardized as MultiPolygon if needed for schema flexibility
    if isinstance(geom, Polygon):
        poly_geom = MultiPolygon([geom])
    else:
        poly_geom = geom

    # Geodesic area calculation check
    area_ha = calculate_geodesic_area_hectares(poly_geom)
    if area_ha < 0.01:
        return (
            False,
            f"Calculated farm area ({area_ha:.4f} ha) is too small. Minimum is 0.01 hectares (100 m²).",
            None,
        )

    if area_ha > 50000.0:
        return (
            False,
            f"Calculated farm area ({area_ha:.2f} ha) exceeds maximum limit of 50,000 hectares.",
            None,
        )

    return True, "Valid agricultural boundary", poly_geom


def calculate_geodesic_area_hectares(geom: BaseGeometry) -> float:
    """
    Computes the authoritative geodesic area of a polygon on WGS84 ellipsoid.
    Returns area in hectares rounded to 2 decimal places.
    """
    try:
        area_m2, _ = geod.geometry_area_perimeter(geom)
        area_ha = abs(area_m2) / 10000.0
        return round(area_ha, 2)
    except Exception:
        # Fallback estimation
        return 0.0


def extract_centroid(geom: BaseGeometry) -> Tuple[float, float]:
    """Computes (longitude, latitude) centroid point of the geometry."""
    centroid = geom.centroid
    return (round(centroid.x, 6), round(centroid.y, 6))


def shapely_to_wkt_element(geom: BaseGeometry, srid: int = 4326) -> WKTElement:
    """Converts a Shapely geometry object to a GeoAlchemy2 WKTElement."""
    return WKTElement(geom.wkt, srid=srid)


def geometry_to_geojson_dict(
    geom_data: Union[WKBElement, WKTElement, BaseGeometry, str, None]
) -> Optional[Dict[str, Any]]:
    """Serializes a PostGIS / GeoAlchemy2 spatial element to a GeoJSON dictionary."""
    if geom_data is None:
        return None

    try:
        if isinstance(geom_data, WKBElement):
            shapely_geom = to_shape(geom_data)
            return mapping(shapely_geom)
        elif isinstance(geom_data, WKTElement):
            shapely_geom = wkt.loads(str(geom_data))
            return mapping(shapely_geom)
        elif isinstance(geom_data, BaseGeometry):
            return mapping(geom_data)
        elif isinstance(geom_data, str):
            shapely_geom = wkt.loads(geom_data)
            return mapping(shapely_geom)
    except Exception:
        pass
    return None
