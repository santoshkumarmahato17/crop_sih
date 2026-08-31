import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.auth import Role, User


@pytest.mark.asyncio
async def test_farm_creation_and_authoritative_area(async_client: AsyncClient):
    """
    Test creating a farm with GeoJSON polygon, verifying that the system calculates
    authoritative area from the geometry rather than trusting user inputs.
    """
    # 1. Register and Login a test farmer
    register_payload = {
        "email": "farmanalyst@agrishield.internal",
        "password": "FarmerPassword123!",
        "full_name": "Kiran Agro",
        "phone_number": "+919876543299",
        "role_name": "FARMER",
    }
    try:
        reg_res = await async_client.post("/api/v1/auth/register", json=register_payload)
    except Exception as e:
        pytest.skip(f"Live database offline for API integration test ({e})")
    assert reg_res.status_code in (201, 409)

    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "farmanalyst@agrishield.internal", "password": "FarmerPassword123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Farm with Polygon
    # (~600m x 550m polygon around Pune -> ~33 hectares)
    farm_geojson = {
        "type": "Polygon",
        "coordinates": [
            [
                [73.8500, 18.5200],
                [73.8560, 18.5200],
                [73.8560, 18.5250],
                [73.8500, 18.5250],
                [73.8500, 18.5200],
            ]
        ],
    }

    create_payload = {
        "name": "Sahyadri Bio-Wheat Estate",
        "description": "High yield organic wheat field.",
        "boundary": farm_geojson,
        "address": "Gate 14, Agri Highway",
        "city": "Pune",
        "region": "Maharashtra",
        "country": "India",
        "soil_type": "Clay Loam",
        "soil_ph": 7.2,
        "irrigation_type": "drip",
        "farming_method": "organic",
        "crop_info": {
            "common_name": "Wheat",
            "variety": "PBW-343",
            "planting_date": "2026-06-01",
            "growth_stage": "Tillering",
            "target_yield_tonnes_per_hectare": 5.2,
        },
    }

    res = await async_client.post("/api/v1/farms", json=create_payload, headers=headers)
    assert res.status_code == 201, f"Farm creation failed: {res.text}"
    data = res.json()

    assert data["name"] == "Sahyadri Bio-Wheat Estate"
    assert data["total_area_hectares"] > 0.0, "Authoritative area must be strictly calculated"
    # Expected area is approx 34.0 ha
    assert 30.0 <= data["total_area_hectares"] <= 40.0
    assert data["boundary"] is not None
    assert data["center_point"] is not None
    assert data["active_crop"] is not None
    assert data["active_crop"]["crop_name"] == "Wheat"

    farm_id = data["id"]

    # 3. Retrieve Farm Details
    get_res = await async_client.get(f"/api/v1/farms/{farm_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == farm_id

    # 4. List Farms
    list_res = await async_client.get("/api/v1/farms", headers=headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(f["id"] == farm_id for f in list_data["farms"])

    # 5. Anti-IDOR Ownership Check: Register another farmer and verify they CANNOT access Farmer 1's farm
    farmer2_payload = {
        "email": "otherfarmer@agrishield.internal",
        "password": "FarmerPassword123!",
        "full_name": "Other Farmer",
        "role_name": "FARMER",
    }
    await async_client.post("/api/v1/auth/register", json=farmer2_payload)
    login2_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "otherfarmer@agrishield.internal", "password": "FarmerPassword123!"},
    )
    farmer2_token = login2_res.json()["access_token"]
    farmer2_headers = {"Authorization": f"Bearer {farmer2_token}"}

    # Attempt to view Farmer 1's farm -> Expected 403 Forbidden
    forbidden_res = await async_client.get(f"/api/v1/farms/{farm_id}", headers=farmer2_headers)
    assert forbidden_res.status_code == 403, "Access to another farmer's holding must return 403"

    # Attempt to delete Farmer 1's farm -> Expected 403 Forbidden
    delete_forbidden_res = await async_client.delete(f"/api/v1/farms/{farm_id}", headers=farmer2_headers)
    assert delete_forbidden_res.status_code == 403

    # 6. Delete Farm by legitimate owner
    del_res = await async_client.delete(f"/api/v1/farms/{farm_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"
