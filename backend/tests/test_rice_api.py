import pytest
from fastapi.testclient import TestClient
import io
from app.api.deps import get_current_user
from app.models.auth import User
from app.core.permissions import RoleType

mock_user = User(id="test-user-rice-id", email="test@agrishield.farm", role=RoleType.FARMER, full_name="Test Rice Farmer")

def test_rice_predict_endpoint_missing_file():
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        client = TestClient(app)
        response = client.post("/api/v1/diagnosis/rice")
        assert response.status_code == 422 # Unprocessable Entity (Missing file)
    finally:
        app.dependency_overrides.pop(get_current_user, None)

def test_rice_predict_endpoint_invalid_file():
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: mock_user
    try:
        client = TestClient(app)
        # Send a text file instead of image
        files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
        response = client.post("/api/v1/diagnosis/rice", files=files)
        assert response.status_code in [400, 422, 500, 503] # Depending on whether the model is loaded or validation fails
    finally:
        app.dependency_overrides.pop(get_current_user, None)

