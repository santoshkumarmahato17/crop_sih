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
        self._posts: Dict[str, dict] = {}
        self._seed_initial_posts()

    def _seed_initial_posts(self):
        # 1. Screenshot Example 1: Laxmi Narayan Sharma (Banana, text-only Hindi question)
        p_laxmi = "post-ban-01"
        self._posts[p_laxmi] = {
            "id": p_laxmi,
            "title": "केले के अंदर छोटे-छोटे फल आते हैं वह बड़े नहीं ...",
            "content": "छोटी कीड़ा जैसे है",
            "translation": "Small fruits are appearing inside the banana plant bunches but they are not growing bigger... looks like a small insect/pest infestation.",
            "crop_type": "Banana",
            "disease_tag": "Fruit Borer / Stunting",
            "image_url": None,
            "author_name": "Laxmi Narayan Sharm...",
            "author_role": "Farmer",
            "author_location": "India",
            "created_at": "7 h ago",
            "likes_count": 0,
            "downvotes_count": 0,
            "shares_count": 0,
            "comments": [],
        }

        # 2. Screenshot Example 2: Sandeep (Banana with Leaf Photo)
        p_sandeep = "post-ban-02"
        self._posts[p_sandeep] = {
            "id": p_sandeep,
            "title": "मेरे केला के साथ समस्या...",
            "content": "प्लांटिक्स को मेरे केला में कुछ समस्याएं दिखाई गई थीं: !!! #स्वस्थ पौधे । क्या यह पनामा विल्ट है या पोटाश की कमी?",
            "translation": "Some issues were detected on my banana crop foliage. Is this Panama Wilt (Fusarium) or Potassium deficiency? Leaf margins are turning yellow.",
            "crop_type": "Banana",
            "disease_tag": "Leaf Spot & Marginal Yellowing",
            "image_url": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
            "author_name": "Sandeep",
            "author_role": "Farmer",
            "author_location": "India",
            "created_at": "14 h ago",
            "likes_count": 12,
            "downvotes_count": 1,
            "shares_count": 4,
            "comments": [
                {
                    "id": "comm-san-1",
                    "post_id": p_sandeep,
                    "author_name": "Dr. R. K. Verma",
                    "author_role": "Extension Agronomist",
                    "content": "This is Sigatoka leaf spot in early initiation. Apply Propiconazole 25% EC @ 1ml per litre mixed with mineral oil spray.",
                    "created_at": "10 h ago",
                    "likes_count": 5,
                }
            ],
        }

        # 3. Broad Bean Example
        p_bean = "post-bean-01"
        self._posts[p_bean] = {
            "id": p_bean,
            "title": "Broad Bean Chocolate Spot disease on lower foliage",
            "content": "Brown reddish circular lesions expanding on Vicia faba foliage after continuous rainfall. How to control spore spread?",
            "translation": "Broad bean chocolate spot (Botrytis fabae) expanding on lower canopy foliage after high humidity.",
            "crop_type": "Broad Bean",
            "disease_tag": "Botrytis Fabae (Chocolate Spot)",
            "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
            "author_name": "Rameshwar Patel",
            "author_role": "Farmer",
            "author_location": "India",
            "created_at": "1 d ago",
            "likes_count": 8,
            "downvotes_count": 0,
            "shares_count": 2,
            "comments": [],
        }

        # 4. Wheat Rust Example (Tamil Nadu / Coimbatore)
        p1_id = "post-101"
        self._posts[p1_id] = {
            "id": p1_id,
            "title": "Yellow Rust pustules appearing on Winter Wheat leaves (Zone Z03)",
            "content": "Noticed linear yellow-orange powder pustules on upper leaves after heavy morning fog. Is immediate systemic fungicide necessary, or can bio-controls handle this stage?",
            "translation": "கோவையில் கோதுமை இலைகளில் மஞ்சள் துரு நோய் தென்படுகிறது. உயிர் உர தெளிப்பு போதுமா?",
            "crop_type": "Wheat",
            "disease_tag": "Yellow Rust (Puccinia striiformis)",
            "image_url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
            "author_name": "Ramanathan K.",
            "author_role": "Farmer",
            "author_location": "India",
            "created_at": "1 d ago",
            "likes_count": 14,
            "downvotes_count": 0,
            "shares_count": 5,
            "comments": [
                {
                    "id": "comm-1",
                    "post_id": p1_id,
                    "author_name": "Dr. Meenakshi Sundaram",
                    "author_role": "Extension Agronomist",
                    "content": "Yellow rust spreads rapidly in 10-18°C with high humidity. If over 5% leaves show pustules, apply Tebuconazole or Propiconazole @ 1ml/L immediately. Avoid excess nitrogen top-dressing.",
                    "created_at": "18 h ago",
                    "likes_count": 8,
                },
                {
                    "id": "comm-2",
                    "post_id": p1_id,
                    "author_name": "Murugan Velu",
                    "author_role": "Farmer",
                    "content": "I had this last week in Holding #4. Drone spray of bio-formulation Pseudomonas fluorescens helped arrest early sporulation around perimeter buffer.",
                    "created_at": "12 h ago",
                    "likes_count": 4,
                },
            ],
        }

        # 5. Rice Blast Example
        p2_id = "post-102"
        self._posts[p2_id] = {
            "id": p2_id,
            "title": "Bacterial Leaf Blight vs Blast symptoms in Paddy?",
            "content": "Tips of rice leaves turn translucent white and curl downwards along margins. Water droplets in the morning look milky. How to confirm Bacterial Blight before full panicle emergence?",
            "translation": "நெல் பயிரில் பாக்டீரியா இலைக்கருகல் நோய் அறிகுறிகள் தென்படுகின்றன.",
            "crop_type": "Rice",
            "disease_tag": "Bacterial Blight (Xanthomonas)",
            "image_url": "https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=800&q=80",
            "author_name": "Anitha Rajendran",
            "author_role": "Farmer",
            "author_location": "India",
            "created_at": "2 d ago",
            "likes_count": 22,
            "downvotes_count": 0,
            "shares_count": 9,
            "comments": [
                {
                    "id": "comm-3",
                    "post_id": p2_id,
                    "author_name": "Officer S. Kumar",
                    "author_role": "Extension Officer",
                    "content": "Cut leaf tip and submerge in clear water test tube. If bacterial ooze streams out within 2 minutes, it is Xanthomonas blight. Drain standing water from field for 48 hours.",
                    "created_at": "1 d ago",
                    "likes_count": 12,
                }
            ],
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
