import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import AgriShieldException
from app.core.logging import logger
from app.core.permissions import RoleType, get_permissions_for_role
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.audit import AuditEventType, AuditLog
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
    """Enterprise Authentication & Role-Based Identity Lifecycle Service."""

    def __init__(self, user_repo: UserRepository = UserRepository()):
        self.user_repo = user_repo

    async def log_audit_event(
        self,
        db: AsyncSession,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Records security and authentication events into immutable audit trail."""
        try:
            audit = AuditLog(
                id=str(uuid.uuid4()),
                user_id=user_id,
                user_email=user_email,
                event_type=event_type,
                ip_address=ip_address,
                user_agent=user_agent,
                details=details or {},
                created_at=datetime.now(timezone.utc),
            )
            db.add(audit)
            await db.flush()
        except Exception as e:
            logger.error(f"Failed to record audit event {event_type}: {e}")

    async def register_user(
        self,
        db: AsyncSession,
        req: UserRegisterRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> UserResponse:
        """Registers a new FARMER or GOVERNMENT user account."""
        # 1. Reject any ADMIN registration attempt
        if req.role == RoleType.ADMIN:
            await self.log_audit_event(
                db,
                AuditEventType.ADMIN_ACCESS_DENIED,
                user_email=req.email,
                ip_address=ip_address,
                user_agent=user_agent,
                details={"reason": "Attempted public ADMIN registration"},
            )
            raise AgriShieldException(
                message="Admin accounts cannot be created via public registration.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        # 2. Check if email exists
        existing = await self.user_repo.get_by_email(db, req.email)
        if existing:
            raise AgriShieldException(
                message=f"An account with email '{req.email}' already exists.",
                status_code=status.HTTP_409_CONFLICT,
            )

        # 3. Create User Account
        user = User(
            id=str(uuid.uuid4()),
            email=req.email.lower().strip(),
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name.strip(),
            phone_number=req.phone_number.strip() if req.phone_number else None,
            address=req.address.strip() if req.address else None,
            role=req.role,
            organization_name=req.organization_name.strip() if req.organization_name else None,
            department=req.department.strip() if req.department else None,
            assigned_region=req.assigned_region.strip() if req.assigned_region else None,
            is_active=True,
            is_verified=False,
            is_superuser=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # 4. Log audit event
        await self.log_audit_event(
            db,
            AuditEventType.USER_CREATED,
            user_id=user.id,
            user_email=user.email,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"role": user.role.value, "organization": user.organization_name},
        )
        await db.commit()

        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            address=user.address,
            role=user.role,
            permissions=user.permissions,
            organization_name=user.organization_name,
            department=user.department,
            assigned_region=user.assigned_region,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )

    async def authenticate_user(
        self,
        db: AsyncSession,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenResponse:
        """
        Authenticates credentials, verifies active status and ADMIN allowlist,
        and generates signed JWT tokens.
        """
        normalized_email = email.lower().strip()
        user = await self.user_repo.get_by_email(db, normalized_email)

        # 1. Validate credentials
        if not user or not verify_password(password, user.hashed_password):
            await self.log_audit_event(
                db,
                AuditEventType.LOGIN_FAILURE,
                user_email=normalized_email,
                ip_address=ip_address,
                user_agent=user_agent,
                details={"reason": "Invalid credentials"},
            )
            await db.commit()
            raise AgriShieldException(
                message="Invalid email or password.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        # 2. Check Account Status (Active/Inactive)
        if not user.is_active:
            await self.log_audit_event(
                db,
                AuditEventType.LOGIN_FAILURE,
                user_id=user.id,
                user_email=user.email,
                ip_address=ip_address,
                user_agent=user_agent,
                details={"reason": "Account deactivated"},
            )
            await db.commit()
            raise AgriShieldException(
                message="User account is deactivated. Contact system administrator.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        # 3. ADMIN Allowlist Verification (Server-Side Source of Truth)
        if user.role == RoleType.ADMIN:
            allowlist = [e.lower().strip() for e in settings.ADMIN_EMAIL_ALLOWLIST]
            if normalized_email not in allowlist:
                logger.warning(
                    f"SECURITY ALERT: User {normalized_email} with stored ADMIN role is NOT in ADMIN_EMAIL_ALLOWLIST."
                )
                await self.log_audit_event(
                    db,
                    AuditEventType.ADMIN_ACCESS_DENIED,
                    user_id=user.id,
                    user_email=user.email,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    details={"reason": "Email not present in ADMIN_EMAIL_ALLOWLIST"},
                )
                await db.commit()
                raise AgriShieldException(
                    message="Access Denied: Administrator account is not authorized on this environment.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )

            # Log successful Admin Login event
            await self.log_audit_event(
                db,
                AuditEventType.ADMIN_LOGIN,
                user_id=user.id,
                user_email=user.email,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        else:
            await self.log_audit_event(
                db,
                AuditEventType.LOGIN_SUCCESS,
                user_id=user.id,
                user_email=user.email,
                ip_address=ip_address,
                user_agent=user_agent,
            )

        # 4. Update last_login_at timestamp
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)

        # 5. Generate Access & Refresh Tokens
        role_value = user.role.value
        access_token = create_access_token(user.id, user.email, role_value)
        refresh_token = create_refresh_token(user.id, user.email, role_value)

        user_resp = UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            address=user.address,
            role=user.role,
            permissions=user.permissions,
            organization_name=user.organization_name,
            department=user.department,
            assigned_region=user.assigned_region,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_resp,
        )

    async def refresh_token(
        self, db: AsyncSession, refresh_token: str
    ) -> TokenResponse:
        """Exchanges a valid refresh token for a newly rotated access and refresh token pair."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise AgriShieldException(
                message="Invalid or expired refresh token.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        user_id = payload.get("sub")
        user = await self.user_repo.get(db, user_id)
        if not user or not user.is_active:
            raise AgriShieldException(
                message="User associated with token is no longer active.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        # Check admin allowlist on token refresh
        if user.role == RoleType.ADMIN:
            allowlist = [e.lower().strip() for e in settings.ADMIN_EMAIL_ALLOWLIST]
            if user.email.lower().strip() not in allowlist:
                raise AgriShieldException(
                    message="Administrator privileges revoked.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )

        role_value = user.role.value
        new_access_token = create_access_token(user.id, user.email, role_value)
        new_refresh_token = create_refresh_token(user.id, user.email, role_value)

        user_resp = UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            address=user.address,
            role=user.role,
            permissions=user.permissions,
            organization_name=user.organization_name,
            department=user.department,
            assigned_region=user.assigned_region,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_resp,
        )

    async def update_profile(
        self, db: AsyncSession, user_id: str, req: UserProfileUpdateRequest
    ) -> UserResponse:
        """Updates user profile information."""
        user = await self.user_repo.get(db, user_id)
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
        if req.organization_name is not None:
            user.organization_name = req.organization_name.strip() if req.organization_name else None
        if req.department is not None:
            user.department = req.department.strip() if req.department else None

        await db.commit()
        await db.refresh(user)

        return UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            address=user.address,
            role=user.role,
            permissions=user.permissions,
            organization_name=user.organization_name,
            department=user.department,
            assigned_region=user.assigned_region,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )

    async def update_password(
        self, db: AsyncSession, user_id: str, req: UserPasswordUpdateRequest
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

    async def authenticate_google_user(
        self,
        db: AsyncSession,
        req: Any,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenResponse:
        """
        Processes Google OAuth 2.0 PKCE / OpenID Connect authentication callback.
        Exchanges code or verifies ID Token server-side, finds or creates account,
        and returns signed AGRI SHIELD JWT tokens.
        """
        import httpx
        from app.schemas.auth import GoogleAuthCallbackRequest

        payload: GoogleAuthCallbackRequest = req if isinstance(req, GoogleAuthCallbackRequest) else GoogleAuthCallbackRequest(**req)

        email: Optional[str] = None
        google_sub: Optional[str] = None
        full_name: Optional[str] = None

        # 0. Check server Google OAuth configuration
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise AgriShieldException(
                message="Google OAuth authentication failed. Google OAuth Client ID is not configured on the server. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )


        # 1. Exchange OAuth code for Google Tokens if code provided
        if payload.code:
            try:
                token_url = "https://oauth2.googleapis.com/token"
                redirect_uri = payload.redirect_uri or settings.GOOGLE_CALLBACK_URL or settings.GOOGLE_REDIRECT_URI
                data = {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": payload.code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri,
                }
                if payload.code_verifier:
                    data["code_verifier"] = payload.code_verifier

                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(token_url, data=data)
                    if resp.status_code == 200:
                        token_data = resp.json()
                        access_token = token_data.get("access_token")
                        # Fetch userinfo using Google access token
                        userinfo_resp = await client.get(
                            "https://www.googleapis.com/oauth2/v3/userinfo",
                            headers={"Authorization": f"Bearer {access_token}"},
                        )
                        if userinfo_resp.status_code == 200:
                            info = userinfo_resp.json()
                            email = info.get("email")
                            google_sub = info.get("sub")
                            full_name = info.get("name") or info.get("given_name")
                    else:
                        logger.error(f"Google OAuth token exchange error: HTTP {resp.status_code} - {resp.text}")
            except Exception as e:
                logger.error(f"Google OAuth token exchange failed: {e}")

        # 2. Verify Google ID Token if provided directly
        if not email and payload.id_token:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.id_token}"
                    )
                    if resp.status_code == 200:
                        info = resp.json()
                        email = info.get("email")
                        google_sub = info.get("sub")
                        full_name = info.get("name")
            except Exception as e:
                logger.error(f"Google ID token verification failed: {e}")

        # 3. Fail if email could not be retrieved from real Google OAuth token/userinfo
        if not email:
            raise AgriShieldException(
                message="Google sign-in was cancelled or authentication failed. Unable to verify identity with Google.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )


        normalized_email = email.lower().strip()

        # 4. Search existing user by google_sub or email
        user = None
        if google_sub:
            result = await db.execute(select(User).where(User.google_sub == google_sub))
            user = result.scalars().first()

        if not user:
            result = await db.execute(select(User).where(User.email == normalized_email))
            user = result.scalars().first()
            if user:
                # Link Google identity to existing account
                if google_sub:
                    user.google_sub = google_sub
                user.auth_provider = "google"
                user.is_verified = True

        # 5. Create new account if not exists (using real Google profile name)
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=normalized_email,
                hashed_password=get_password_hash(f"google-oauth-unusable-password-{uuid.uuid4().hex}"),
                full_name=full_name or normalized_email.split("@")[0].capitalize(),
                role=RoleType.FARMER,
                google_sub=google_sub,
                auth_provider="google",
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc),
            )
            db.add(user)

        if not user.hashed_password:
            user.hashed_password = get_password_hash(f"google-oauth-unusable-password-{uuid.uuid4().hex}")

        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)

        # 6. Record Audit Event
        await self.log_audit_event(
            db,
            AuditEventType.LOGIN_SUCCESS,
            user_id=user.id,
            user_email=user.email,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"provider": "google"},
        )
        await db.commit()

        # 7. Issue JWT Tokens
        access_token = create_access_token(user.id, user.email, user.role.value)
        refresh_token = create_refresh_token(user.id, user.email, user.role.value)

        user_resp = UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            address=user.address,
            role=user.role,
            permissions=user.permissions,
            organization_name=user.organization_name,
            department=user.department,
            assigned_region=user.assigned_region,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_resp,
        )

    async def send_phone_otp(
        self,
        db: AsyncSession,
        phone_number: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates and dispatches 6-digit SMS OTP code for phone authentication.
        Integrates with Twilio, Fast2SMS, and MSG91 APIs when configured.
        Requires real SMS delivery confirmation from SMS gateway provider.
        """
        from app.services.otp_service import otp_service
        from app.services.sms_service import sms_service, normalize_indian_phone

        try:
            clean_phone = normalize_indian_phone(phone_number)
        except ValueError as val_err:
            raise AgriShieldException(message=str(val_err), status_code=status.HTTP_400_BAD_REQUEST)

        try:
            code, info = otp_service.generate_phone_otp(clean_phone)
        except ValueError as val_err:
            raise AgriShieldException(message=str(val_err), status_code=status.HTTP_429_TOO_MANY_REQUESTS)

        # Dispatch via SMS provider
        dispatch_res = await sms_service.send_otp_sms(clean_phone, code)

        if not dispatch_res.get("sent"):
            reason = dispatch_res.get("reason")
            err_msg = dispatch_res.get("message", "SMS OTP delivery failed.")
            otp_service.clear_phone_otp(clean_phone)
            raise AgriShieldException(
                message=f"Failed to send SMS OTP: {err_msg}",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE if reason == "PROVIDER_NOT_CONFIGURED" else status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        await self.log_audit_event(
            db,
            AuditEventType.LOGIN_SUCCESS,
            user_email=clean_phone,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"action": "phone_otp_requested", "sms_configured": True, "provider": dispatch_res.get("provider")},
        )
        await db.commit()

        return {
            "success": True,
            "message": dispatch_res.get("message", f"SMS OTP verification code sent to {clean_phone}."),
            "expires_in_seconds": info.get("expires_in_seconds", 300),
            "sms_provider_configured": not dispatch_res.get("dev_mode", False),
        }




    async def verify_phone_otp(
        self,
        db: AsyncSession,
        phone_number: str,
        otp: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenResponse:
        """
        Verifies 6-digit SMS OTP, finds or creates Farmer account, and returns JWT tokens.
        """
        from app.services.otp_service import otp_service
        from app.services.sms_service import normalize_indian_phone

        try:
            clean_phone = normalize_indian_phone(phone_number)
        except ValueError as val_err:
            raise AgriShieldException(message=str(val_err), status_code=status.HTTP_400_BAD_REQUEST)

        try:
            otp_service.verify_phone_otp(clean_phone, otp)
        except ValueError as val_err:
            raise AgriShieldException(message=str(val_err), status_code=status.HTTP_400_BAD_REQUEST)

        # Find or create user by phone number
        result = await db.execute(select(User).where(User.phone_number == clean_phone))
        user = result.scalars().first()

        if not user:
            # Check raw format if previous user registered without normalized phone
            raw_phone = phone_number.strip()
            result = await db.execute(select(User).where(User.phone_number == raw_phone))
            user = result.scalars().first()

        if not user:
            # Synthetic email fallback for phone-only accounts
            synthetic_email = f"{clean_phone.replace('+', '')}@agrishield.farm"
            result = await db.execute(select(User).where(User.email == synthetic_email))
            user = result.scalars().first()

        if not user:
            synthetic_email = f"{clean_phone.replace('+', '')}@agrishield.farm"
            user = User(
                id=str(uuid.uuid4()),
                email=synthetic_email,
                hashed_password=get_password_hash(f"phone-otp-unusable-password-{uuid.uuid4().hex}"),
                phone_number=clean_phone,
                full_name=f"Farmer ({clean_phone})",
                role=RoleType.FARMER,
                auth_provider="phone",
                is_active=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc),
            )
            db.add(user)

        if not user.hashed_password:
            user.hashed_password = get_password_hash(f"phone-otp-unusable-password-{uuid.uuid4().hex}")

        user.phone_number = clean_phone
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)

        await self.log_audit_event(
            db,
            AuditEventType.LOGIN_SUCCESS,
            user_id=user.id,
            user_email=user.email,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"provider": "phone"},
        )
        await db.commit()

        access_token = create_access_token(user.id, user.email, user.role.value)
        refresh_token = create_refresh_token(user.id, user.email, user.role.value)

        user_resp = UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            address=user.address,
            role=user.role,

            permissions=user.permissions,
            organization_name=user.organization_name,
            department=user.department,
            assigned_region=user.assigned_region,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_resp,
        )

    async def update_user_location(
        self,
        db: AsyncSession,
        user_id: str,
        latitude: float,
        longitude: float,
    ) -> Dict[str, Any]:
        """
        Stores permitted user geolocation coordinates.
        """
        user = await self.user_repo.get(db, user_id)
        if not user:
            raise AgriShieldException(message="User account not found.", status_code=status.HTTP_404_NOT_FOUND)

        user.latitude = latitude
        user.longitude = longitude
        await db.commit()
        await db.refresh(user)

        return {
            "success": True,
            "latitude": user.latitude,
            "longitude": user.longitude,
            "message": "Location coordinates stored successfully.",
        }


auth_service = AuthService()

