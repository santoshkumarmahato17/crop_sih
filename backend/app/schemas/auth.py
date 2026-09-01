from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, model_validator

from app.core.permissions import RoleType
from app.schemas.common import BaseSchema


class RoleResponse(BaseSchema):
    """Role definition schema."""
    id: str
    name: str
    description: Optional[str] = None


class UserResponse(BaseSchema):
    """Public user identity and authorization schema (strictly hides credentials)."""

    id: str
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    role: RoleType
    permissions: List[str] = Field(default_factory=list)
    organization_name: Optional[str] = None
    department: Optional[str] = None
    assigned_region: Optional[str] = None
    is_active: bool
    is_verified: bool = False
    created_at: datetime
    last_login_at: Optional[datetime] = None


class UserRegisterRequest(BaseModel):
    """User self-registration payload (Restricted to FARMER or GOVERNMENT)."""

    email: EmailStr
    password: str = Field(min_length=8, description="Password must be at least 8 characters long")
    confirm_password: Optional[str] = Field(default=None, description="Password confirmation")
    full_name: str = Field(min_length=2, max_length=150)
    phone_number: Optional[str] = None
    address: Optional[str] = None
    role: RoleType = Field(
        default=RoleType.FARMER,
        description="Assigned role: Only FARMER or GOVERNMENT allowed for self-registration.",
    )
    organization_name: Optional[str] = Field(
        default=None, description="Department or Organization for Government users"
    )
    department: Optional[str] = None
    assigned_region: Optional[str] = None

    @model_validator(mode="after")
    def validate_registration_payload(self) -> "UserRegisterRequest":
        # Check confirm password if provided
        if self.confirm_password and self.password != self.confirm_password:
            raise ValueError("Password and confirmation password do not match.")

        # Disallow self-registration as ADMIN
        if self.role == RoleType.ADMIN:
            raise ValueError(
                "Self-registration as ADMIN is strictly prohibited. Administrator accounts must be provisioned by system operations."
            )

        return self


class UserProfileUpdateRequest(BaseModel):
    """Profile update payload."""

    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    organization_name: Optional[str] = None
    department: Optional[str] = None


class UserPasswordUpdateRequest(BaseModel):
    """Password change payload."""

    current_password: str
    new_password: str = Field(min_length=8, description="New password (min 8 chars)")


class UserLoginRequest(BaseModel):
    """User credential login payload."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT Access and Refresh token response with authorized user identity."""

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
