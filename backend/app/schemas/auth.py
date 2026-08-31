from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import BaseSchema


class RoleResponse(BaseSchema):
    """Role definition schema."""

    id: str
    name: str
    description: Optional[str] = None


class UserResponse(BaseSchema):
    """Public user identity schema."""

    id: str
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    is_superuser: bool
    role: Optional[RoleResponse] = None
    created_at: datetime


class UserRegisterRequest(BaseModel):
    """User self-registration payload."""

    email: EmailStr
    password: str = Field(min_length=8, description="Password must be at least 8 characters long")
    full_name: str = Field(min_length=2, max_length=150)
    phone_number: Optional[str] = None
    address: Optional[str] = None
    role_name: str = Field(
        default="FARMER",
        description="Assigned role: FARMER, EXTENSION_OFFICER, AGRICULTURE_ADMIN, or SYSTEM_ADMIN",
    )


class UserProfileUpdateRequest(BaseModel):
    """Profile update payload."""

    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None


class UserPasswordUpdateRequest(BaseModel):
    """Password change payload."""

    current_password: str
    new_password: str = Field(min_length=8, description="New password (min 8 chars)")


class UserLoginRequest(BaseModel):
    """User credential login payload."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT Access and Refresh token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Token refresh payload."""

    refresh_token: str


class LogoutResponse(BaseModel):
    """Logout confirmation response."""

    success: bool = True
    message: str = "Logged out successfully."
