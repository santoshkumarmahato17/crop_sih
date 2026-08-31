from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock
import pytest
from httpx import ASGITransport, AsyncClient

from app.db.session import get_db
from app.main import app
from app.models.auth import Role, User
from app.models.farm import Crop, CropCycle, CropCycleStatus, Farm


@pytest.fixture(scope="session")
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Provides an asynchronous HTTP test client for the FastAPI application."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
