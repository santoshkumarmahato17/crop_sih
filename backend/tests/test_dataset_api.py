import io
import os
import pytest
from httpx import AsyncClient
from PIL import Image

from app.main import app
from app.api.deps import get_current_active_user, get_current_user
from app.models.auth import User
from app.core.permissions import RoleType


@pytest.fixture(autouse=True)
def override_auth():
    """Mock authenticated active farmer user for dataset endpoint tests."""
    mock_user = User(
        id="mock-farmer-id-123",
        email="farmer@agrishield.internal",
        hashed_password="hashed_password",
        full_name="Rajesh Patil",
        role=RoleType.FARMER,
        is_active=True,
    )
    app.dependency_overrides[get_current_active_user] = lambda: mock_user
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    app.dependency_overrides.pop(get_current_active_user, None)
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_dataset_summary_and_classes(async_client: AsyncClient):
    """Test the dataset summary and taxonomy endpoints."""
    # 1. Test summary endpoint
    res = await async_client.get("/api/v1/dataset/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_name"] == "CCMT Crop Pest and Disease Detection Dataset"
    assert data["total_classes"] == 22
    assert "Cashew" in data["crops"]
    assert "Cassava" in data["crops"]
    assert "Maize" in data["crops"]
    assert "Tomato" in data["crops"]

    # 2. Test classes endpoint
    classes_res = await async_client.get("/api/v1/dataset/classes")
    assert classes_res.status_code == 200
    classes = classes_res.json()
    assert len(classes) == 22

    # Verify key metadata fields
    first_class = classes[0]
    assert "class_key" in first_class
    assert "pathogen_type" in first_class
    assert "ipm_recommendations" in first_class

    # Test filtering by crop
    cashew_res = await async_client.get("/api/v1/dataset/classes?crop=Cashew")
    assert cashew_res.status_code == 200
    assert len(cashew_res.json()) == 5


@pytest.mark.asyncio
async def test_dataset_sample_images_and_inference(async_client: AsyncClient):
    """Test sample images listing and direct vision analysis."""
    # 1. Fetch sample images
    samples_res = await async_client.get("/api/v1/dataset/sample-images?limit_per_class=1")
    assert samples_res.status_code == 200
    samples = samples_res.json()
    assert len(samples) > 0

    # 2. Test analyze-image direct endpoint with synthetic image
    img = Image.new("RGB", (224, 224), color=(40, 180, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    analyze_res = await async_client.post(
        "/api/v1/ai/analyze-image",
        files={"file": ("test_leaf.jpg", buf.getvalue(), "image/jpeg")},
    )
    assert analyze_res.status_code == 200
    result = analyze_res.json()
    assert 0.0 <= result["health_score"] <= 1.0
    assert 0.0 <= result["confidence"] <= 1.0
    assert "detected_crop" in result["prediction_metadata"]
    assert "detected_condition" in result["prediction_metadata"]
    assert "top_candidates" in result["prediction_metadata"]
