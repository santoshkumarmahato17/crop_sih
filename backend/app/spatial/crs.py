"""
AGRI SHIELD — Coordinate Reference System (CRS) Management.
"""

from enum import Enum


class CoordinateReferenceSystem(str, Enum):
    """Standardized EPSG codes used across AGRI SHIELD."""

    WGS84 = "EPSG:4326"           # Standard GPS / GeoJSON coordinates (longitude, latitude)
    WEB_MERCATOR = "EPSG:3857"    # Planar projection for distance/area calculations
    UTM_DEFAULT = "EPSG:32632"    # Universal Transverse Mercator default zone


DEFAULT_STORAGE_SRID = 4326
DEFAULT_CALCULATION_SRID = 3857
