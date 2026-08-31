import uuid
from typing import Tuple
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AgriShieldException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.auth import Role, User
from app.repositories.user import UserRepository
from app.schemas.auth import (
    TokenResponse,
    UserPasswordUpdateRequest,
    UserProfileUpdateRequest,
    UserRegisterRequest,
    UserResponse,
)

settings = get_settings()


class AuthService:
    """Authentication and identity lifecycle service."""

    def __init__(self, user_repo: UserRepository = UserRepository()):
        self.user_repo = user_repo

    async def register_user(
        self, db: AsyncSession, req: UserRegisterRequest
    ) -> UserResponse:
        """Registers a new user account."""
        existing = await self.user_repo.get_by_email(db, req.email)
        if existing:
            raise AgriShieldException(
                message=f"An account with email '{req.email}' already exists.",
                status_code=status.HTTP_409_CONFLICT,
            )

        role_name = req.role_name.upper().strip()
        role = await self.user_repo.get_role_by_name(db, role_name)
        if not role:
            # Fallback: create role if missing
            role = Role(id=str(uuid.uuid4()), name=role_name, description=f"Role {role_name}")
            db.add(role)
            await db.flush()

        user = User(
            id=str(uuid.uuid4()),
            email=req.email.lower().strip(),
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name.strip(),
            phone_number=req.phone_number.strip() if req.phone_number else None,
            address=req.address.strip() if req.address else None,
            is_active=True,
            role_id=role.id,
        )
        db.add(user)
        await db.commit()

        user_with_role = await self.user_repo.get_with_role(db, user.id)
        assert user_with_role is not None
        return UserResponse.model_validate(user_with_role)

    async def update_profile(
        self, db: AsyncSession, user_id: str, req: "UserProfileUpdateRequest"
    ) -> UserResponse:
        """Updates user profile information."""
        user = await self.user_repo.get_with_role(db, user_id)
        if not user:
            raise AgriShieldException(
                message="User not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if req.email and req.email.lower().strip() != user.email:
            existing = await self.user_repo.get_by_email(db, req.email)
            if existing and existing.id != user.id:
                raise AgriShieldException(
                    message=f"Email '{req.email}' is already in use by another account.",
                    status_code=status.HTTP_409_CONFLICT,
                )
            user.email = req.email.lower().strip()

        if req.full_name is not None:
            user.full_name = req.full_name.strip()
        if req.phone_number is not None:
            user.phone_number = req.phone_number.strip() if req.phone_number else None
        if req.address is not None:
            user.address = req.address.strip() if req.address else None

        await db.commit()
        await db.refresh(user)
        return UserResponse.model_validate(user)

    async def update_password(
        self, db: AsyncSession, user_id: str, req: "UserPasswordUpdateRequest"
    ) -> dict:
        """Updates user password after verifying current password."""
        user = await self.user_repo.get(db, user_id)
        if not user or not verify_password(req.current_password, user.hashed_password):
            raise AgriShieldException(
                message="Current password is incorrect.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user.hashed_password = get_password_hash(req.new_password)
        await db.commit()
        return {"success": True, "message": "Password updated successfully."}

    async def authenticate_user(
        self, db: AsyncSession, email: str, password: str
    ) -> TokenResponse:
        """Verifies credentials and generates JWT token pair."""
        user = await self.user_repo.get_by_email(db, email)
        if not user or not verify_password(password, user.hashed_password):
            raise AgriShieldException(
                message="Invalid email or password.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            raise AgriShieldException(
                message="User account is deactivated. Contact system administrator.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        role_name = user.role.name if user.role else "FARMER"
        access_token = create_access_token(user.id, user.email, role_name)
        refresh_token = create_refresh_token(user.id, user.email, role_name)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    async def refresh_token(
        self, db: AsyncSession, refresh_token: str
    ) -> TokenResponse:
        """Exchanges a valid refresh token for a new access & refresh token pair."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise AgriShieldException(
                message="Invalid or expired refresh token.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        user_id = payload.get("sub")
        user = await self.user_repo.get_with_role(db, user_id)
        if not user or not user.is_active:
            raise AgriShieldException(
                message="User associated with token no longer active.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        role_name = user.role.name if user.role else "FARMER"
        new_access_token = create_access_token(user.id, user.email, role_name)
        new_refresh_token = create_refresh_token(user.id, user.email, role_name)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )


auth_service = AuthService()
