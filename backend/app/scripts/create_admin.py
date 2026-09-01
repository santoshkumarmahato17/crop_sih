"""
Administrator Account Provisioning Script (Backend-Only CLI).
Usage: python -m app.scripts.create_admin --email admin@agrishield.com --password YourSecurePassword123! --name "System Administrator"
"""

import argparse
import asyncio
import sys
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.permissions import RoleType
from app.core.security import get_password_hash
from app.db.session import async_session_factory
from app.models.audit import AuditEventType, AuditLog
from app.models.auth import User


async def create_admin_user(email: str, password: str, full_name: str) -> None:
    settings = get_settings()
    normalized_email = email.lower().strip()

    # 1. Verify that email is on the server-side ADMIN_EMAIL_ALLOWLIST
    allowlist = [e.lower().strip() for e in settings.ADMIN_EMAIL_ALLOWLIST]
    if normalized_email not in allowlist:
        print(
            f"[-] SECURITY ERROR: Email '{normalized_email}' is NOT present in the server's ADMIN_EMAIL_ALLOWLIST.\n"
            f"    Allowed administrator emails: {allowlist}\n"
            f"    Provisioning aborted.",
            file=sys.stderr,
        )
        sys.exit(1)

    if len(password) < 8:
        print("[-] ERROR: Admin password must be at least 8 characters long.", file=sys.stderr)
        sys.exit(1)

    async with async_session_factory() as db:
        # 2. Check if user already exists
        result = await db.execute(select(User).where(User.email == normalized_email))
        user = result.scalars().first()

        if user:
            print(f"[*] User '{normalized_email}' exists. Updating role to ADMIN and resetting credentials...")
            user.role = RoleType.ADMIN
            user.hashed_password = get_password_hash(password)
            user.full_name = full_name
            user.is_active = True
            user.is_superuser = True
            user.updated_at = datetime.now(timezone.utc)
        else:
            print(f"[+] Creating new administrator account for '{normalized_email}'...")
            user = User(
                id=str(uuid.uuid4()),
                email=normalized_email,
                hashed_password=get_password_hash(password),
                full_name=full_name,
                role=RoleType.ADMIN,
                is_active=True,
                is_superuser=True,
                is_verified=True,
                created_at=datetime.now(timezone.utc),
            )
            db.add(user)

        # 3. Log security event
        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user.id,
            user_email=user.email,
            event_type=AuditEventType.USER_CREATED if not user else AuditEventType.ROLE_CHANGED,
            details={"action": "CLI Admin Provisioning", "role": "ADMIN"},
            created_at=datetime.now(timezone.utc),
        )
        db.add(audit)
        await db.commit()

        print(f"[✓] Administrator account '{normalized_email}' successfully provisioned with role ADMIN.")


def main():
    parser = argparse.ArgumentParser(description="Provision an authorized AgriShield administrator account.")
    parser.add_argument("--email", required=True, help="Administrator email (must be in ADMIN_EMAIL_ALLOWLIST)")
    parser.add_argument("--password", required=True, help="Secure password for administrator")
    parser.add_argument("--name", default="System Administrator", help="Full name of administrator")

    args = parser.parse_args()
    asyncio.run(create_admin_user(args.email, args.password, args.name))


if __name__ == "__main__":
    main()
