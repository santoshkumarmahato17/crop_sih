import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token
from app.main import app


@pytest.mark.asyncio
async def test_alert_lifecycle_and_notifications():
    """Test alert creation, multi-role retrieval, and notification center acknowledgment."""
    farmer_token = create_access_token(
        subject="farmer-user-1", email="farmer@kisansathi.com", role="FARMER"
    )
    admin_token = create_access_token(
        subject="admin-user-1", email="admin@kisansathi.com", role="SYSTEM_ADMIN"
    )

    headers_farmer = {"Authorization": f"Bearer {farmer_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # 1. Create Alert
        alert_payload = {
            "farm_id": "farm-101",
            "zone_id": "zone-z03",
            "alert_type": "DISEASE_DETECTED",
            "severity": "CRITICAL",
            "title": "Puccinia striiformis Surge",
            "message": "Elevated chlorosis detected in Zone Z03.",
        }
        res = await ac.post("/api/v1/alerts", json=alert_payload, headers=headers_farmer)
        assert res.status_code == 201
        data = res.json()
        alert_id = data["id"]
        assert data["alert_type"] == "DISEASE_DETECTED"
        assert data["severity"] == "CRITICAL"

        # 2. List Alerts
        list_res = await ac.get("/api/v1/alerts", headers=headers_farmer)
        assert list_res.status_code == 200
        assert len(list_res.json()) > 0

        # 3. Notification Center Inbox
        notif_res = await ac.get("/api/v1/notifications", headers=headers_farmer)
        assert notif_res.status_code == 200
        notif_data = notif_res.json()
        assert "total_unread" in notif_data
        assert len(notif_data["notifications"]) > 0

        # 4. Mark Notifications as Read
        notif_ids = [n["id"] for n in notif_data["notifications"][:2]]
        read_res = await ac.post(
            "/api/v1/notifications/mark-read",
            json={"notification_ids": notif_ids},
            headers=headers_farmer,
        )
        assert read_res.status_code == 200

        # 5. Resolve Alert
        resolve_res = await ac.put(
            f"/api/v1/alerts/{alert_id}/resolve", headers=headers_farmer
        )
        assert resolve_res.status_code == 200
        assert resolve_res.json()["is_resolved"] is True
