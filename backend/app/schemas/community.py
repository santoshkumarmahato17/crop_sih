from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CommunityCommentCreate(BaseModel):
    author_name: str = Field(..., description="Name of the commenter")
    author_role: str = Field(default="Farmer", description="Role (Farmer, Extension Officer, Agronomist)")
    content: str = Field(..., min_length=1, description="Reply content or agronomic advice")


class CommunityCommentResponse(BaseModel):
    id: str
    post_id: str
    author_name: str
    author_role: str
    content: str
    created_at: str
    likes_count: int = 0


class CommunityPostCreate(BaseModel):
    title: str = Field(..., min_length=2, description="Post title or question")
    content: str = Field(..., min_length=5, description="Detailed problem description or disease observation")
    crop_type: str = Field(default="General", description="Associated crop (Wheat, Rice, Corn, Cotton, Tomato, etc.)")
    disease_tag: str = Field(default="General Health", description="Suspected disease or topic tag")
    image_url: Optional[str] = Field(default=None, description="Optional uploaded disease photo URL")
    author_name: str = Field(default="Anonymous Farmer", description="Poster name")
    author_role: str = Field(default="Farmer", description="Poster role")
    author_location: str = Field(default="Regional Agro Zone", description="Geographic district/holding")


class CommunityPostResponse(BaseModel):
    id: str
    title: str
    content: str
    crop_type: str
    disease_tag: str
    image_url: Optional[str] = None
    author_name: str
    author_role: str
    author_location: str
    created_at: str
    likes_count: int = 0
    downvotes_count: int = 0
    shares_count: int = 0
    comments_count: int = 0
    translation: Optional[str] = None
    comments: List[CommunityCommentResponse] = []


class CommunityPostListResponse(BaseModel):
    total: int
    posts: List[CommunityPostResponse]
