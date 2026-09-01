import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_community_posts_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. List seed posts
        res = await ac.get("/api/v1/community/posts")
        assert res.status_code == 200
        data = res.json()
        assert "posts" in data
        assert len(data["posts"]) >= 3

        # 2. Create new post
        post_payload = {
            "title": "Severe Leaf Tip Drying in Paddy Field",
            "content": "Noticed whitening of leaf tips after heavy fertilizer application. Need advice on micronutrients.",
            "crop_type": "Rice",
            "disease_tag": "Nutrient Burn / Blight",
            "author_name": "Farmer Selvan",
            "author_role": "Farmer",
            "author_location": "Delta Sector 3",
        }
        create_res = await ac.post("/api/v1/community/posts", json=post_payload)
        assert create_res.status_code == 201
        created_post = create_res.json()
        post_id = created_post["id"]
        assert created_post["title"] == post_payload["title"]
        assert created_post["crop_type"] == "Rice"

        # 3. Add comment
        comment_payload = {
            "author_name": "Agronomist Ramesh",
            "author_role": "Extension Agronomist",
            "content": "Apply Zinc sulphate and flush standing field water.",
        }
        comment_res = await ac.post(f"/api/v1/community/posts/{post_id}/comments", json=comment_payload)
        assert comment_res.status_code == 201
        comment_data = comment_res.json()
        assert comment_data["content"] == comment_payload["content"]

        # 4. Like post
        like_res = await ac.post(f"/api/v1/community/posts/{post_id}/like")
        assert like_res.status_code == 200
        assert like_res.json()["likes_count"] >= 1

        # 5. Share post
        share_res = await ac.post(f"/api/v1/community/posts/{post_id}/share")
        assert share_res.status_code == 200
        assert share_res.json()["shares_count"] == 1
