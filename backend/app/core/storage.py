import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Union

from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()


class StorageService:
    """
    MinIO / S3-Compatible Object Storage Service.
    Supports direct bucket streaming, secure filename sanitization,
    and resilient local filesystem fallback for offline development.
    """

    def __init__(self):
        self.bucket_raw = settings.MINIO_BUCKET_RAW_IMAGERY
        self.local_storage_dir = Path("data/storage")
        self.local_storage_dir.mkdir(parents=True, exist_ok=True)
        self._minio_client = None
        self._init_minio_client()

    def _init_minio_client(self):
        """Initializes MinIO S3 SDK client if available."""
        import socket
        try:
            host_port = settings.MINIO_ENDPOINT.split(":")
            host = host_port[0]
            port = int(host_port[1]) if len(host_port) > 1 else 9000
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.2)
            res = sock.connect_ex((host, port))
            sock.close()
            if res != 0:
                self._minio_client = None
                return
        except Exception:
            self._minio_client = None
            return

        try:
            from minio import Minio
            self._minio_client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_USE_SSL,
            )
            # Ensure bucket exists
            if not self._minio_client.bucket_exists(self.bucket_raw):
                self._minio_client.make_bucket(self.bucket_raw)
                logger.info(f"Created MinIO bucket '{self.bucket_raw}'.")
        except Exception as e:
            logger.warning(
                f"MinIO server not reachable at {settings.MINIO_ENDPOINT} ({e}). "
                "Operating with persistent local filesystem fallback at ./data/storage."
            )
            self._minio_client = None

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitizes user-provided filename to prevent path traversal and unsafe characters."""
        clean = Path(filename).name
        clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", clean)
        return clean or f"drone_frame_{uuid.uuid4().hex[:8]}.jpg"

    def generate_object_path(self, mission_id: str, filename: str) -> str:
        """Generates deterministic secure object storage path."""
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safe_name = self.sanitize_filename(filename)
        unique_token = uuid.uuid4().hex[:8]
        return f"missions/{mission_id}/{ts}_{unique_token}_{safe_name}"

    async def upload_file_bytes(
        self,
        file_bytes: bytes,
        object_path: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        """
        Stores file payload in MinIO bucket (or local filesystem fallback).
        Returns the persistent storage URI.
        """
        # 1. Try MinIO
        if self._minio_client is not None:
            try:
                import io
                stream = io.BytesIO(file_bytes)
                self._minio_client.put_object(
                    bucket_name=self.bucket_raw,
                    object_name=object_path,
                    data=stream,
                    length=len(file_bytes),
                    content_type=content_type,
                )
                return f"minio://{self.bucket_raw}/{object_path}"
            except Exception as e:
                logger.warning(f"MinIO put_object failed ({e}). Falling back to local storage.")

        # 2. Local Filesystem Fallback
        target_file = self.local_storage_dir / object_path
        target_file.parent.mkdir(parents=True, exist_ok=True)
        with open(target_file, "wb") as f:
            f.write(file_bytes)

        return f"local://{object_path}"

    def get_file_bytes(self, storage_uri: str) -> bytes:
        """Retrieves raw file bytes from storage URI."""
        if storage_uri.startswith("minio://") and self._minio_client is not None:
            parts = storage_uri.replace("minio://", "").split("/", 1)
            bucket, obj_name = parts[0], parts[1]
            response = self._minio_client.get_object(bucket, obj_name)
            try:
                return response.read()
            finally:
                response.close()
                response.release_conn()

        # Handle local or fallback
        clean_path = storage_uri.replace("local://", "").replace(f"minio://{self.bucket_raw}/", "")
        target_file = self.local_storage_dir / clean_path
        if target_file.exists():
            with open(target_file, "rb") as f:
                return f.read()

        raise FileNotFoundError(f"Storage object '{storage_uri}' not found.")


storage_service = StorageService()
