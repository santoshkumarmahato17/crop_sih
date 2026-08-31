import io
import pytest
from PIL import Image
from shapely.geometry import Point, Polygon

from app.core.storage import storage_service
from app.services.image_ingestion import ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES
from app.workers.tasks.image_tasks import extract_gps_and_resolution


def test_storage_service_path_and_sanitization():
    """Test safe filename sanitization and deterministic object path generation."""
    dirty_name = "../../../malicious-payload#42.tif"
    clean_name = storage_service.sanitize_filename(dirty_name)
    assert ".." not in clean_name
    assert "/" not in clean_name
    assert "\\" not in clean_name

    obj_path = storage_service.generate_object_path("mission-123", "drone_frame.jpg")
    assert obj_path.startswith("missions/mission-123/")
    assert obj_path.endswith("_drone_frame.jpg")


@pytest.mark.asyncio
async def test_storage_upload_and_read():
    """Test storing and reading binary image data."""
    test_payload = b"FAKE_GEOTIFF_DATA_STREAM_FOR_TESTING"
    path = "missions/test-mission/sample.tif"
    uri = await storage_service.upload_file_bytes(
        file_bytes=test_payload,
        object_path=path,
        content_type="image/tiff",
    )
    assert uri is not None
    assert "sample.tif" in uri

    retrieved = storage_service.get_file_bytes(uri)
    assert retrieved == test_payload


def test_image_format_validation():
    """Test supported MIME types and extensions for JPEG, PNG, and GeoTIFF."""
    assert ".jpg" in ALLOWED_EXTENSIONS
    assert ".png" in ALLOWED_EXTENSIONS
    assert ".tif" in ALLOWED_EXTENSIONS
    assert ".tiff" in ALLOWED_EXTENSIONS
    assert ".exe" not in ALLOWED_EXTENSIONS
    assert ".pdf" not in ALLOWED_EXTENSIONS

    assert "image/jpeg" in ALLOWED_MIME_TYPES
    assert "image/png" in ALLOWED_MIME_TYPES
    assert "image/tiff" in ALLOWED_MIME_TYPES


def test_synthetic_image_metadata_extraction():
    """Test dimension and metadata extraction from synthetic raster."""
    # Create synthetic test image in memory
    img = Image.new("RGB", (800, 600), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    raw_bytes = buf.getvalue()

    gps, alt, width, height = extract_gps_and_resolution(raw_bytes)
    assert width == 800
    assert height == 600


def test_point_in_polygon_zone_matching():
    """Test spatial matching of image GPS point within target FarmZone."""
    zone_poly = Polygon([
        (73.8500, 18.5200),
        (73.8550, 18.5200),
        (73.8550, 18.5250),
        (73.8500, 18.5250),
        (73.8500, 18.5200),
    ])

    inside_pt = Point(73.8525, 18.5225)
    outside_pt = Point(73.8600, 18.5300)

    assert zone_poly.contains(inside_pt) is True
    assert zone_poly.contains(outside_pt) is False
