import pytest
from fastapi.testclient import TestClient
import io

def test_rice_predict_endpoint_missing_file():
    from app.main import app
    client = TestClient(app)
    response = client.post("/api/v1/diagnosis/rice")
    assert response.status_code == 422 # Unprocessable Entity (Missing file)

def test_rice_predict_endpoint_invalid_file():
    from app.main import app
    client = TestClient(app)
    # Send a text file instead of image
    files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
    response = client.post("/api/v1/diagnosis/rice", files=files)
    assert response.status_code in [400, 422, 500, 503] # Depending on whether the model is loaded or validation fails
