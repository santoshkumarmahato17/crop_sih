from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.auth import User
from app.schemas.auth import (
    LogoutResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserPasswordUpdateRequest,
    UserProfileUpdateRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication & Identity"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User Account",
    description="Registers a new Farmer, Agronomist, or Agricultural Authority account.",
)
async def register(
    req: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    return await auth_service.register_user(db, req)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates credentials and issues signed JWT access and refresh token pair.",
)
async def login(
    req: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await auth_service.authenticate_user(db, req.email, req.password)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token",
    description="Exchanges an unexpired refresh token for a newly rotated access & refresh token pair.",
)
async def refresh_token(
    req: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await auth_service.refresh_token(db, req.refresh_token)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    description="Invalidates current client session.",
)
async def logout(
    current_user: User = Depends(get_current_active_user),
) -> LogoutResponse:
    return LogoutResponse(
        success=True,
        message=f"Session for user '{current_user.email}' terminated successfully.",
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile",
    description="Returns the profile and role metadata of the authenticated user.",
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.put(
    "/profile",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update User Profile",
    description="Updates user email, full name, phone number, and address.",
)
async def update_profile(
    req: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    return await auth_service.update_profile(db, current_user.id, req)


@router.put(
    "/password",
    status_code=status.HTTP_200_OK,
    summary="Change User Password",
    description="Updates user password after verifying current password.",
)
async def update_password(
    req: UserPasswordUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    return await auth_service.update_password(db, current_user.id, req)
