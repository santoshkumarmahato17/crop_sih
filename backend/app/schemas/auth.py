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


class ForgotPasswordRequest(BaseModel):
    """Forgot Password request payload."""

    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Forgot Password response schema."""

    success: bool = True
    message: str
    smtp_configured: bool = True


class VerifyOTPRequest(BaseModel):
    """OTP Verification request payload."""

    email: EmailStr
    otp: str = Field(min_length=6, max_length=6, description="6-digit numeric OTP code")


class VerifyOTPResponse(BaseModel):
    """OTP Verification response schema containing Reset Token."""

    success: bool = True
    message: str
    reset_token: str


class ResetPasswordWithTokenRequest(BaseModel):
    """Reset Password request payload using verified Reset Token."""

    email: EmailStr
    reset_token: str
    new_password: str = Field(min_length=8, description="New password (min 8 chars)")
    confirm_password: str = Field(min_length=8, description="Password confirmation")

    @model_validator(mode="after")
    def validate_passwords_match(self) -> "ResetPasswordWithTokenRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("New password and confirmation password do not match.")
        return self


class GoogleAuthUrlResponse(BaseModel):
    """Google OAuth 2.0 authorization URL response."""

    auth_url: str
    state: str
    code_verifier: Optional[str] = None
    client_id_configured: bool = True


class GoogleAuthCallbackRequest(BaseModel):
    """Google OAuth 2.0 callback payload."""

    code: Optional[str] = None
    id_token: Optional[str] = None
    code_verifier: Optional[str] = None
    redirect_uri: Optional[str] = None
    state: Optional[str] = None


class PhoneSendOTPRequest(BaseModel):
    """Phone number OTP request payload."""

    phone_number: str = Field(min_length=8, max_length=20, description="International phone number format (e.g. +91 9842178901)")


class PhoneSendOTPResponse(BaseModel):
    """Phone number OTP request response."""

    success: bool = True
    message: str
    expires_in_seconds: int = 300
    sms_provider_configured: bool = True


class PhoneVerifyOTPRequest(BaseModel):
    """Phone OTP verification payload."""

    phone_number: str
    otp: str = Field(min_length=6, max_length=6, description="6-digit numeric OTP")


class UserLocationRequest(BaseModel):
    """User location coordinates update payload."""

    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    location_name: Optional[str] = None


class UserLocationResponse(BaseModel):
    """User location response schema."""

    success: bool = True
    latitude: float
    longitude: float
    district_region: Optional[str] = None
    message: str = "Location coordinates stored successfully."


