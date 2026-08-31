import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token
from app.main import app


@pytest.mark.asyncio
async def test_assistant_chat_queries():
    """Test AI assistant answering prompt benchmark questions in English and Tamil."""
    farmer_token = create_access_token(
        subject="farmer-101", email="farmer@agrishield.com", role="FARMER"
    )
    headers = {"Authorization": f"Bearer {farmer_token}"}

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # 1. Tools listing
        tools_res = await ac.get("/api/v1/assistant/tools", headers=headers)
        assert tools_res.status_code == 200
        tools = tools_res.json()
        assert len(tools) >= 8

        # 2. English Queries
        queries_en = [
            ("Why is Zone Z03 red?", "get_zone_status", "Yellow Rust"),
            ("Which zone needs water?", "get_zone_status", "Z04"),
            ("Is the crop getting worse?", "get_zone_history", "DECLINING"),
            ("Which nearby farms have elevated risk?", "get_neighbor_risk", "Spread Risk"),
            ("When is the next monitoring mission?", "get_monitoring_schedule", "MSN-"),
            ("What should I inspect?", "get_recommendations", "Irrigation"),
        ]

        for q, expected_tool, expected_kw in queries_en:
            res = await ac.post(
                "/api/v1/assistant/chat",
                json={"message": q, "language": "en"},
                headers=headers,
            )
            assert res.status_code == 200
            data = res.json()
            assert expected_tool in data["tools_used"]
            assert expected_kw.lower() in data["response_text"].lower()

        # 3. Tamil Query
        res_ta = await ac.post(
            "/api/v1/assistant/chat",
            json={"message": "எந்த மண்டலத்திற்கு தண்ணீர் தேவை?", "language": "ta"},
            headers=headers,
        )
        assert res_ta.status_code == 200
        data_ta = res_ta.json()
        assert "get_zone_status" in data_ta["tools_used"]
        assert "Z04" in data_ta["response_text"]
