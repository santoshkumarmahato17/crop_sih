import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(async_client: AsyncClient) -> None:
    """Verifies that the health check endpoint returns 200 and expected metadata."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["system"] == "AGRI SHIELD"
    assert "version" in data
    assert "status" in data
    assert "subsystems" in data
    assert "redis" in data["subsystems"]
    assert "minio_storage" in data["subsystems"]
