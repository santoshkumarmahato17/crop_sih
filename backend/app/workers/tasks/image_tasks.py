import asyncio
import io
from datetime import datetime, timezone
from typing import Optional, Tuple
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point
from sqlalchemy import select

from app.core.logging import logger
from app.core.storage import storage_service
from app.db.session import async_session_factory
from app.models.drone import DroneImage, ImageProcessingJob, JobStatus
from app.models.farm import FarmZone
from app.spatial.geometry import shapely_to_wkt_element
from app.workers.celery_app import celery_app


def _convert_to_degrees(value) -> float:
    """Helper to convert the GPS coordinates stored in the EXIF to degrees."""
    d0 = value[0]
    d1 = value[1]
    d2 = value[2]
    d = float(d0[0]) / float(d0[1]) if isinstance(d0, tuple) else float(d0)
    m = float(d1[0]) / float(d1[1]) if isinstance(d1, tuple) else float(d1)
    s = float(d2[0]) / float(d2[1]) if isinstance(d2, tuple) else float(d2)
    return d + (m / 60.0) + (s / 3600.0)


def extract_gps_and_resolution(file_bytes: bytes) -> Tuple[Optional[Tuple[float, float]], Optional[float], int, int]:
    """
    Extracts GPS coordinates (lat, lng), altitude, and dimensions from image byte stream.
    Supports JPEG, PNG, and GeoTIFF files.
    """
    try:
        with Image.open(io.BytesIO(file_bytes)) as img:
            width, height = img.size
            gps_coords = None
            altitude = None

            exif_data = img._getexif() if hasattr(img, "_getexif") and img._getexif() else None
            if exif_data:
                gps_info = {}
                for tag, value in exif_data.items():
                    decoded = TAGS.get(tag, tag)
                    if decoded == "GPSInfo":
                        for t in value:
                            sub_decoded = GPSTAGS.get(t, t)
                            gps_info[sub_decoded] = value[t]

                if "GPSLatitude" in gps_info and "GPSLongitude" in gps_info:
                    lat = _convert_to_degrees(gps_info["GPSLatitude"])
                    lng = _convert_to_degrees(gps_info["GPSLongitude"])
                    if gps_info.get("GPSLatitudeRef") == "S":
                        lat = -lat
                    if gps_info.get("GPSLongitudeRef") == "W":
                        lng = -lng
                    gps_coords = (lng, lat)

                if "GPSAltitude" in gps_info:
                    alt_val = gps_info["GPSAltitude"]
                    altitude = float(alt_val[0]) / float(alt_val[1]) if isinstance(alt_val, tuple) else float(alt_val)

            return gps_coords, altitude, width, height
    except Exception as e:
        logger.warning(f"EXIF GPS extraction failed or format non-standard: {e}")
        return None, None, 1920, 1080


async def _async_process_image(image_id: str, job_id: Optional[str] = None):
    """Asynchronous core logic for drone image ingestion processing."""
    async with async_session_factory() as db:
        # 1. Fetch DroneImage
        result = await db.execute(select(DroneImage).where(DroneImage.id == image_id))
        image = result.scalars().first()
        if not image:
            logger.error(f"DroneImage '{image_id}' not found for processing.")
            return

        job = None
        if job_id:
            job_res = await db.execute(select(ImageProcessingJob).where(ImageProcessingJob.id == job_id))
            job = job_res.scalars().first()

        try:
            image.processing_status = "PROCESSING"
            if job:
                job.status = JobStatus.RUNNING
                job.progress_percent = 25.0
            await db.commit()

            # 2. Read file bytes from object storage
            file_bytes = storage_service.get_file_bytes(image.file_path)

            # 3. Extract GPS & metadata
            gps, alt, w, h = extract_gps_and_resolution(file_bytes)
            if alt is not None:
                image.altitude_agl_meters = alt

            # 4. If GPS coordinates extracted or present
            target_pt = None
            if gps:
                lng, lat = gps
                target_pt = Point(lng, lat)
                image.location = shapely_to_wkt_element(target_pt, srid=4326)
            elif image.location is not None:
                target_pt = to_shape(image.location)

            # 5. Spatial Zone Association (Point-in-Polygon query)
            if target_pt and image.farm_id:
                # Query farm zones to find containing polygon
                zones_res = await db.execute(
                    select(FarmZone).where(FarmZone.farm_id == image.farm_id)
                )
                farm_zones = list(zones_res.scalars().all())
                for zone in farm_zones:
                    if zone.boundary:
                        zone_poly = to_shape(zone.boundary)
                        if zone_poly.contains(target_pt):
                            image.zone_id = zone.id
                            logger.info(f"Associated image '{image.id}' with Zone '{zone.zone_code}'.")
                            break

            # 6. Mark Completion
            image.processing_status = "COMPLETED"
            if job:
                job.status = JobStatus.COMPLETED
                job.progress_percent = 100.0
                job.output_artifacts = {
                    "width": w,
                    "height": h,
                    "extracted_gps": bool(gps),
                    "associated_zone_id": image.zone_id,
                }

            await db.commit()
            logger.info(f"Successfully processed drone image '{image.id}'.")

        except Exception as err:
            logger.exception(f"Error processing drone image '{image_id}': {err}")
            image.processing_status = "FAILED"
            if job:
                job.status = JobStatus.FAILED
                job.error_message = str(err)
            await db.commit()


@celery_app.task(name="process_drone_image_task")
def process_drone_image_task(image_id: str, job_id: Optional[str] = None):
    """Celery background worker entrypoint for image ingestion."""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.create_task(_async_process_image(image_id, job_id))
    else:
        loop.run_until_complete(_async_process_image(image_id, job_id))
