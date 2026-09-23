import uuid
from datetime import datetime
from typing import Dict, List, Optional
from app.schemas.community import (
    CommunityCommentCreate,
    CommunityCommentResponse,
    CommunityPostCreate,
    CommunityPostListResponse,
    CommunityPostResponse,
)


class CommunityService:
    def __init__(self):
        self._posts: Dict[str, dict] = {
            "post-1": {
                "id": "post-1",
                "title": "Tomato Early Blight Outbreak Control",
                "content": "Concentric rings observed on lower leaves following monsoon rain. Recommended copper fungicide.",
                "crop_type": "Tomato",
                "disease_tag": "Early Blight",
                "image_url": "https://images.unsplash.com/photo-1592417817098-8f3d6eb22509",
                "author_name": "Dr. Sharma",
                "author_role": "Agronomist",
                "author_location": "Nashik Region",
                "created_at": "2 hours ago",
                "likes_count": 14,
                "downvotes_count": 0,
                "shares_count": 3,
                "comments": [],
            },
            "post-2": {
                "id": "post-2",
                "title": "Maize Fall Armyworm Monitoring",
                "content": "Yellow sticky trap counts increasing near field borders. Pheromone trap deployment active.",
                "crop_type": "Maize",
                "disease_tag": "Fall Armyworm",
                "image_url": None,
                "author_name": "Ravi Kumar",
                "author_role": "Extension Officer",
                "author_location": "Pune Sector",
                "created_at": "5 hours ago",
                "likes_count": 8,
                "downvotes_count": 0,
                "shares_count": 1,
                "comments": [],
            },
            "post-3": {
                "id": "post-3",
                "title": "Rice Blast Management Guidelines",
                "content": "Spindle-shaped lesions found on leaf blades. Maintain 5cm water level and avoid excess nitrogen.",
                "crop_type": "Rice",
                "disease_tag": "Rice Blast",
                "image_url": None,
                "author_name": "Priya Patil",
                "author_role": "Farmer Lead",
                "author_location": "Kolhapur Cluster",
                "created_at": "1 day ago",
                "likes_count": 22,
                "downvotes_count": 1,
                "shares_count": 6,
                "comments": [],
            },
        }

    def list_posts(self, crop: Optional[str] = None, disease: Optional[str] = None) -> CommunityPostListResponse:
        posts = list(self._posts.values())
        if crop and crop.lower() not in ["all", "popular"]:
            posts = [p for p in posts if p["crop_type"].lower() == crop.lower()]
        if disease and disease.lower() != "all":
            posts = [p for p in posts if disease.lower() in p["disease_tag"].lower()]

        result = []
        for p in posts:
            result.append(
                CommunityPostResponse(
                    id=p["id"],
                    title=p["title"],
                    content=p["content"],
                    crop_type=p["crop_type"],
                    disease_tag=p["disease_tag"],
                    image_url=p.get("image_url"),
                    author_name=p["author_name"],
                    author_role=p["author_role"],
                    author_location=p["author_location"],
                    created_at=p["created_at"],
                    likes_count=p.get("likes_count", 0),
                    downvotes_count=p.get("downvotes_count", 0),
                    shares_count=p.get("shares_count", 0),
                    comments_count=len(p.get("comments", [])),
                    translation=p.get("translation"),
                    comments=[
                        CommunityCommentResponse(
                            id=c["id"],
                            post_id=c["post_id"],
                            author_name=c["author_name"],
                            author_role=c["author_role"],
                            content=c["content"],
                            created_at=c["created_at"],
                            likes_count=c.get("likes_count", 0),
                        )
                        for c in p.get("comments", [])
                    ],
                )
            )
        return CommunityPostListResponse(total=len(result), posts=result)

    def create_post(self, payload: CommunityPostCreate) -> CommunityPostResponse:
        post_id = f"post-{uuid.uuid4().hex[:8]}"
        new_post = {
            "id": post_id,
            "title": payload.title,
            "content": payload.content,
            "crop_type": payload.crop_type,
            "disease_tag": payload.disease_tag,
            "image_url": payload.image_url,
            "author_name": payload.author_name,
            "author_role": payload.author_role,
            "author_location": payload.author_location,
            "created_at": "Just now",
            "likes_count": 0,
            "downvotes_count": 0,
            "shares_count": 0,
            "translation": None,
            "comments": [],
        }
        self._posts[post_id] = new_post
        return CommunityPostResponse(
            id=new_post["id"],
            title=new_post["title"],
            content=new_post["content"],
            crop_type=new_post["crop_type"],
            disease_tag=new_post["disease_tag"],
            image_url=new_post["image_url"],
            author_name=new_post["author_name"],
            author_role=new_post["author_role"],
            author_location=new_post["author_location"],
            created_at=new_post["created_at"],
            likes_count=0,
            downvotes_count=0,
            shares_count=0,
            comments_count=0,
            translation=None,
            comments=[],
        )

    def add_comment(self, post_id: str, payload: CommunityCommentCreate) -> CommunityCommentResponse:
        if post_id not in self._posts:
            raise KeyError("Post not found")
        comment_id = f"comm-{uuid.uuid4().hex[:8]}"
        new_comment = {
            "id": comment_id,
            "post_id": post_id,
            "author_name": payload.author_name,
            "author_role": payload.author_role,
            "content": payload.content,
            "created_at": "Just now",
            "likes_count": 0,
        }
        self._posts[post_id]["comments"].append(new_comment)
        return CommunityCommentResponse(**new_comment)

    def like_post(self, post_id: str) -> dict:
        if post_id in self._posts:
            self._posts[post_id]["likes_count"] = self._posts[post_id].get("likes_count", 0) + 1
            return {"post_id": post_id, "likes_count": self._posts[post_id]["likes_count"]}
        raise KeyError("Post not found")

    def downvote_post(self, post_id: str) -> dict:
        if post_id in self._posts:
            self._posts[post_id]["downvotes_count"] = self._posts[post_id].get("downvotes_count", 0) + 1
            return {"post_id": post_id, "downvotes_count": self._posts[post_id]["downvotes_count"]}
        raise KeyError("Post not found")

    def share_post(self, post_id: str) -> dict:
        if post_id in self._posts:
            self._posts[post_id]["shares_count"] = self._posts[post_id].get("shares_count", 0) + 1
            return {"post_id": post_id, "shares_count": self._posts[post_id]["shares_count"]}
        raise KeyError("Post not found")


community_service = CommunityService()
