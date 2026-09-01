import pytest
from app.core.config import get_settings
from app.core.permissions import Permission, RoleType, get_permissions_for_role
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.auth import User
from app.schemas.auth import UserRegisterRequest


def test_rbac_role_hierarchy_and_permissions():
    """Verifies that each role inherits appropriate permissions."""
    farmer_perms = get_permissions_for_role(RoleType.FARMER)
    govt_perms = get_permissions_for_role(RoleType.GOVERNMENT)
    admin_perms = get_permissions_for_role(RoleType.ADMIN)

    # Farmer has farm & crop permissions, but NO admin or regional analytics permissions
    assert "FARM_VIEW" in farmer_perms
    assert "CROP_VIEW" in farmer_perms
    assert "USER_MANAGE" not in farmer_perms
    assert "REGIONAL_ANALYTICS_VIEW" not in farmer_perms

    # Government has regional monitoring, but NO user management or system config
    assert "REGIONAL_DASHBOARD_VIEW" in govt_perms
    assert "DISEASE_HOTSPOTS_VIEW" in govt_perms
    assert "USER_MANAGE" not in govt_perms
    assert "SYSTEM_CONFIG_MANAGE" not in govt_perms

    # Admin has all permissions including management
    assert "USER_MANAGE" in admin_perms
    assert "SYSTEM_CONFIG_MANAGE" in admin_perms
    assert "ADMIN_DASHBOARD_ACCESS" in admin_perms
    assert len(admin_perms) >= len(farmer_perms)


def test_public_registration_blocks_admin_role():
    """Verifies that public registration schema rejects ADMIN role creation."""
    with pytest.raises(ValueError, match="Self-registration as ADMIN is strictly prohibited"):
        UserRegisterRequest(
            email="hacker@example.com",
            password="SecurePassword123!",
            full_name="Malicious User",
            role=RoleType.ADMIN,
        )


def test_admin_email_allowlist_configuration():
    """Verifies that server-side ADMIN_EMAIL_ALLOWLIST is properly configured."""
    settings = get_settings()
    allowlist = [e.lower().strip() for e in settings.ADMIN_EMAIL_ALLOWLIST]

    assert "admin@agrishield.com" in allowlist
    assert len(allowlist) >= 2


def test_password_hashing_security():
    """Verifies bcrypt hashing and non-plain storage."""
    plain = "AgriShield2026!Secure"
    hashed = get_password_hash(plain)

    assert hashed != plain
    assert hashed.startswith("$2b$")
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_user_model_role_and_permissions_property():
    """Verifies User model role enum mapping and calculated permissions."""
    farmer = User(
        id="usr-1",
        email="farmer@test.com",
        hashed_password="hash",
        full_name="Farmer Joe",
        role=RoleType.FARMER,
        is_active=True,
    )
    assert farmer.role == RoleType.FARMER
    assert "FARM_VIEW" in farmer.permissions
    assert "USER_MANAGE" not in farmer.permissions

    admin = User(
        id="usr-2",
        email="admin@agrishield.com",
        hashed_password="hash",
        full_name="Admin Chief",
        role=RoleType.ADMIN,
        is_active=True,
    )
    assert admin.role == RoleType.ADMIN
    assert "USER_MANAGE" in admin.permissions
    assert "ADMIN_DASHBOARD_ACCESS" in admin.permissions
