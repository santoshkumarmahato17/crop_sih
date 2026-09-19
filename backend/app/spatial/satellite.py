import base64
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

import httpx
from geoalchemy2.elements import WKBElement, WKTElement
from geoalchemy2.shape import to_shape
from shapely.geometry.base import BaseGeometry

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Sentinel Hub API Endpoints
SH_OAUTH_URL = "https://services.sentinel-hub.com/oauth/token"
SH_PROCESS_URL = "https://services.sentinel-hub.com/api/v1/process"
SH_STATISTICS_URL = "https://services.sentinel-hub.com/api/v1/statistics"


class SatelliteImageryService:
    def __init__(self):
        self.client_id = getattr(settings, "SENTINEL_HUB_CLIENT_ID", None)

        self.client_secret = getattr(settings, "SENTINEL_HUB_CLIENT_SECRET", None)
        self._access_token = None
        self._token_expires_at = None

    def is_configured(self) -> bool:
        """Check if Sentinel Hub API credentials are provided."""
        return bool(self.client_id and self.client_secret)

    async def _get_access_token(self) -> str:
        """Fetch or return the cached OAuth token for Sentinel Hub."""
        if not self.is_configured():
            raise ValueError("Sentinel Hub credentials not configured.")

        now = datetime.now(timezone.utc)
        if self._access_token and self._token_expires_at and now < self._token_expires_at:
            return self._access_token

        payload = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(SH_OAUTH_URL, data=payload)
            resp.raise_for_status()
            data = resp.json()
            self._access_token = data["access_token"]
            expires_in = data.get("expires_in", 3600)
            self._token_expires_at = now + timedelta(seconds=expires_in - 60)
            return self._access_token

    def _extract_shapely_geom(self, boundary: Any) -> BaseGeometry:
        """Convert a DB spatial boundary to a Shapely geometry."""
        if isinstance(boundary, (WKBElement, WKTElement)):
            return to_shape(boundary)
        elif isinstance(boundary, BaseGeometry):
            return boundary
        else:
            raise ValueError("Unsupported geometry type.")

    def _get_evalscript(self, layer: str) -> str:
        """Return the standard evalscript for the requested layer."""
        if layer == "ndvi":
            return """
            //VERSION=3
            function setup() {
              return { input: ["B04", "B08", "dataMask"], output: { bands: 4 } };
            }
            function evaluatePixel(sample) {
              let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
              if (sample.dataMask === 0) return [0, 0, 0, 0];
              // Map NDVI to a color gradient from red (-1) to green (1)
              let val = ndvi;
              if (val < 0) return [0.8, 0.8, 0.8, 1];
              if (val < 0.2) return [0.8, 0, 0, 1];
              if (val < 0.4) return [1, 0.5, 0, 1];
              if (val < 0.6) return [1, 1, 0, 1];
              if (val < 0.8) return [0.5, 1, 0, 1];
              return [0, 0.8, 0, 1];
            }
            """
        elif layer == "ndwi":
            return """
            //VERSION=3
            function setup() {
              return { input: ["B03", "B08", "dataMask"], output: { bands: 4 } };
            }
            function evaluatePixel(sample) {
              let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08);
              if (sample.dataMask === 0) return [0, 0, 0, 0];
              if (ndwi < -0.3) return [0.5, 0, 0, 1];
              if (ndwi < 0) return [1, 0.5, 0, 1];
              if (ndwi < 0.3) return [0, 0.8, 1, 1];
              return [0, 0, 1, 1];
            }
            """
        else: # true_color
            return """
            //VERSION=3
            function setup() {
              return { input: ["B02", "B03", "B04", "dataMask"], output: { bands: 4 } };
            }
            function evaluatePixel(sample) {
              if (sample.dataMask === 0) return [0, 0, 0, 0];
              return [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5, 1];
            }
            """

    async def get_farm_imagery(
        self, boundary: Any, layer: str = "true_color", date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch satellite imagery for a farm boundary.
        Returns a base64 encoded PNG and metadata.
        Uses fallback mock data if not configured.
        """
        geom = self._extract_shapely_geom(boundary)
        minx, miny, maxx, maxy = geom.bounds
        
        # Calculate image size (max 512x512, keeping aspect ratio)
        width = 512
        height = int(width * ((maxy - miny) / (maxx - minx)))
        if height > 512:
            height = 512
            width = int(height * ((maxx - minx) / (maxy - miny)))
            
        target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        if not self.is_configured():
            logger.info("Sentinel Hub not configured. Returning mock satellite imagery.")
            return self._generate_mock_imagery(layer, target_date)

        token = await self._get_access_token()
        
        payload = {
            "input": {
                "bounds": {
                    "bbox": [minx, miny, maxx, maxy],
                    "geometry": geom.__geo_interface__
                },
                "data": [
                    {
                        "dataFilter": {
                            "timeRange": {
                                "from": f"{target_date}T00:00:00Z",
                                "to": f"{target_date}T23:59:59Z"
                            },
                            "maxCloudCoverage": 20,
                        },
                        "type": "sentinel-2-l2a"
                    }
                ]
            },
            "output": {
                "width": width,
                "height": height,
                "responses": [{"identifier": "default", "format": {"type": "image/png"}}]
            },
            "evalscript": self._get_evalscript(layer)
        }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/tar"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(SH_PROCESS_URL, headers=headers, json=payload)
                resp.raise_for_status()
                # Sentinel Hub process API returns the image directly when single response is requested
                img_data = resp.content
                b64_img = base64.b64encode(img_data).decode('utf-8')
                return {
                    "layer": layer,
                    "date": target_date,
                    "content_type": "image/png",
                    "data": b64_img,
                    "source": "Sentinel-2 L2A",
                    "is_mock": False
                }
        except Exception as e:
            logger.error(f"Failed to fetch satellite imagery: {e}")
            # Fallback to mock on error so UI doesn't break
            return self._generate_mock_imagery(layer, target_date)

    async def get_farm_statistics(
        self, boundary: Any, days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Fetch NDVI statistical time series for the farm polygon over a period.
        """
        geom = self._extract_shapely_geom(boundary)
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days_back)
        
        if not self.is_configured():
            logger.info("Sentinel Hub not configured. Returning mock satellite statistics.")
            return self._generate_mock_statistics(start_date, end_date)
            
        token = await self._get_access_token()
        
        # Evalscript for statistics requires returning the raw values
        evalscript = """
        //VERSION=3
        function setup() {
          return { input: ["B04", "B08", "dataMask"], output: [{ id: "NDVI", bands: 1 }, { id: "dataMask", bands: 1 }] };
        }
        function evaluatePixel(sample) {
          let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
          return { NDVI: [ndvi], dataMask: [sample.dataMask] };
        }
        """
        
        payload = {
            "input": {
                "bounds": {
                    "geometry": geom.__geo_interface__
                },
                "data": [
                    {
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                                "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
                            }
                        }
                    }
                ]
            },
            "aggregation": {
                "timeRange": {
                    "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                    "to": end_date.strftime("%Y-%m-%dT23:59:59Z")
                },
                "aggregationInterval": {
                    "of": "P5D" # 5-day intervals
                },
                "evalscript": evalscript,
                "resx": 10,
                "resy": 10
            }
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(SH_STATISTICS_URL, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                
                series = []
                for interval in data.get("data", []):
                    dt = interval.get("interval", {}).get("from")
                    outputs = interval.get("outputs", {}).get("NDVI", {}).get("bands", {}).get("B0", {}).get("stats", {})
                    if outputs and outputs.get("sampleCount", 0) > 0:
                        series.append({
                            "date": dt,
                            "min": outputs.get("min", 0),
                            "max": outputs.get("max", 0),
                            "mean": outputs.get("mean", 0),
                        })
                return {
                    "source": "Sentinel-2 L2A",
                    "index": "NDVI",
                    "series": series,
                    "is_mock": False
                }
        except Exception as e:
            logger.error(f"Failed to fetch satellite statistics: {e}")
            return self._generate_mock_statistics(start_date, end_date)

    def _generate_mock_imagery(self, layer: str, target_date: str) -> Dict[str, Any]:
        """Generates a highly-compressed 1x1 transparent/colored pixel for mock purposes, or a real placeholder."""
        # For a truly realistic demo, you'd return a pre-computed base64 image or a static asset URL.
        # Here we return a simple 1x1 transparent PNG encoded in base64.
        # In a real app, the frontend could fall back to rendering a local asset if is_mock is true.
        mock_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        return {
            "layer": layer,
            "date": target_date,
            "content_type": "image/png",
            "data": mock_png,
            "source": "Sentinel-2 L2A (Mock)",
            "is_mock": True
        }

    def _generate_mock_statistics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generates realistic-looking mock NDVI statistics."""
        series = []
        current = start_date
        import random
        base_ndvi = 0.65
        
        while current <= end_date:
            trend = random.uniform(-0.05, 0.05)
            base_ndvi = max(0.2, min(0.9, base_ndvi + trend))
            series.append({
                "date": current.isoformat(),
                "min": round(max(0.1, base_ndvi - 0.15), 3),
                "max": round(min(0.95, base_ndvi + 0.1), 3),
                "mean": round(base_ndvi, 3),
            })
            current += timedelta(days=5)
            
        return {
            "source": "Sentinel-2 L2A (Mock)",
            "index": "NDVI",
            "series": series,
            "is_mock": True
        }

satellite_imagery_service = SatelliteImageryService()
