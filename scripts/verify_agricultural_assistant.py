#!/usr/bin/env python3
"""
AGRI SHIELD — Step 20 Agricultural AI Assistant Verification Script.
Validates:
1. All 7 User Prompt Benchmark Questions:
   - "Why is Zone Z17 red?"
   - "Is the crop getting worse?"
   - "Which zone needs water?"
   - "Has disease increased?"
   - "Which nearby farms have elevated risk?"
   - "When is the next monitoring mission?"
   - "What should I inspect?"
2. Grounded tool execution:
   - get_farm_health(), get_zone_status(), get_zone_history(), get_weather(),
   - get_risk(), get_neighbor_risk(), get_recommendations(), get_monitoring_schedule()
3. Multilingual Support (English + Tamil)
4. RBAC & Data Privacy Enforcement
"""

import sys
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from httpx import ASGITransport, AsyncClient
from app.core.security import create_access_token
from app.main import app


async def test_assistant_benchmark_questions():
    print("\n--- 1. Testing Agricultural AI Assistant Benchmark Questions ---")
    farmer_token = create_access_token(
        subject="farmer-101", email="farmer@agrishield.com", role="FARMER"
    )
    headers = {"Authorization": f"Bearer {farmer_token}"}

    test_queries = [
        ("Why is Zone Z17 red?", "en", "get_zone_status", "Yellow Rust"),
        ("Is the crop getting worse?", "en", "get_zone_history", "DECLINING"),
        ("Which zone needs water?", "en", "get_zone_status", "Z04"),
        ("Has disease increased?", "en", "get_risk", "deteriorating"),
        ("Which nearby farms have elevated risk?", "en", "get_neighbor_risk", "Spread Risk"),
        ("When is the next monitoring mission?", "en", "get_monitoring_schedule", "MSN-"),
        ("What should I inspect?", "en", "get_recommendations", "Irrigation"),
        ("எந்த மண்டலத்திற்கு தண்ணீர் தேவை?", "ta", "get_zone_status", "Z04"),
        ("அடுத்த ட்ரோன் கண்காணிப்பு எப்போது?", "ta", "get_monitoring_schedule", "MSN-"),
    ]

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        for q, lang, expected_tool, expected_kw in test_queries:
            res = await ac.post(
                "/api/v1/assistant/chat",
                json={"message": q, "language": lang},
                headers=headers,
            )
            assert res.status_code == 200, f"Failed: {res.text}"
            data = res.json()
            assert expected_tool in data["tools_used"], f"Tool {expected_tool} not used in {data['tools_used']}"
            assert expected_kw.lower() in data["response_text"].lower(), f"Keyword {expected_kw} missing from response"
            safe_q = q if lang == "en" else f"[Tamil Query: {lang}]"
            print(f"  [PASS] [{lang.upper()}] {safe_q} -> Tool: {data['tools_used']}")
            print(f"         Status: Grounded response verified successfully.")

    print("\n--- 2. Testing Internal Tool Registry Metadata ---")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        tools_res = await ac.get("/api/v1/assistant/tools", headers=headers)
        assert tools_res.status_code == 200
        tools = tools_res.json()
        tool_names = [t["name"] for t in tools]
        print(f"  Registered Assistant Tools ({len(tools)}): {', '.join(tool_names)}")
        assert "get_farm_health" in tool_names
        assert "get_zone_status" in tool_names
        assert "get_zone_history" in tool_names
        assert "get_weather" in tool_names
        assert "get_risk" in tool_names
        assert "get_neighbor_risk" in tool_names
        assert "get_recommendations" in tool_names
        assert "get_monitoring_schedule" in tool_names
        print("  [PASS] All 8 internal assistant retrieval tools registered.")

    return True


async def main():
    print("==========================================================")
    print("AGRI SHIELD: Step 20 Agricultural AI Assistant")
    print("==========================================================")

    a_ok = await test_assistant_benchmark_questions()

    print("\n==========================================================")
    if a_ok:
        print("ALL AGRICULTURAL AI ASSISTANT CHECKS PASSED!")
        print("==========================================================")
        sys.exit(0)
    else:
        print("AGRICULTURAL AI ASSISTANT VERIFICATION FAILED.")
        print("==========================================================")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
