from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.community import (
    CommunityCommentCreate,
    CommunityCommentResponse,
    CommunityPostCreate,
    CommunityPostListResponse,
    CommunityPostResponse,
)
from app.services.community_service import community_service

router = APIRouter(prefix="/community", tags=["Farmer Community & Disease Discussion"])


@router.get(
    "/posts",
    response_model=CommunityPostListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Community Posts & Disease Discussions",
)
async def list_posts(
    crop: Optional[str] = Query(default=None, description="Filter by crop type (Wheat, Rice, Corn, etc.)"),
    disease: Optional[str] = Query(default=None, description="Filter by disease tag"),
) -> CommunityPostListResponse:
    return community_service.list_posts(crop=crop, disease=disease)


@router.post(
    "/posts",
    response_model=CommunityPostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new Farmer Community Post / Disease Question",
)
async def create_post(payload: CommunityPostCreate) -> CommunityPostResponse:
    return community_service.create_post(payload)


@router.post(
    "/posts/{post_id}/comments",
    response_model=CommunityCommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Reply / Comment on a Community Post",
)
async def add_comment(post_id: str, payload: CommunityCommentCreate) -> CommunityCommentResponse:
    try:
        return community_service.add_comment(post_id, payload)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")


@router.post(
    "/posts/{post_id}/like",
    status_code=status.HTTP_200_OK,
    summary="Like a Community Post",
)
async def like_post(post_id: str):
    try:
        return community_service.like_post(post_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")


@router.post(
    "/posts/{post_id}/downvote",
    status_code=status.HTTP_200_OK,
    summary="Downvote a Community Post",
)
async def downvote_post(post_id: str):
    try:
        return community_service.downvote_post(post_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")


@router.post(
    "/posts/{post_id}/share",
    status_code=status.HTTP_200_OK,
    summary="Share a Community Post",
)
async def share_post(post_id: str):
    try:
        return community_service.share_post(post_id)
    except KeyError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
