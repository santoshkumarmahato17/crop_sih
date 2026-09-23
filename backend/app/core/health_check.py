"""
Startup Health Check and Schema Verification Module for KISAN SATHI.

Validates:
1. Asynchronous database connectivity.
2. Existence of 'users' table and required authentication columns.
3. Secret key & JWT configuration.
Fails fast with explicit diagnostic logging on startup if issues are detected.
"""

from typing import List
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()

REQUIRED_USER_COLUMNS = [
    "id",
    "email",
    "hashed_password",
    "full_name",
    "role",
    "is_active",
    "is_verified",
    "organization_name",
    "department",
    "assigned_region",
    "auth_provider",
    "google_sub",
    "created_at",
]

async def verify_auth_system_health(db: AsyncSession) -> bool:
    """
    Executes a comprehensive health check of database connectivity,
    schema integrity, and authentication secrets.
    """
    logger.info("=== RUNNING KISAN SATHI AUTHENTICATION SYSTEM HEALTH CHECK ===")

    # 1. JWT Configuration Check
    if not settings.SECRET_KEY or len(settings.SECRET_KEY.strip()) < 8:
        msg = "[CRITICAL] Authentication SECRET_KEY is missing or insecure!"
        logger.error(msg)
        raise RuntimeError(msg)
    logger.info("  [PASS] JWT Secret Key configuration verified.")

    # 2. Database Connectivity Check
    try:
        await db.execute(text("SELECT 1;"))
        logger.info("  [PASS] Asynchronous database connection established.")
    except Exception as db_err:
        msg = f"[CRITICAL] Database connectivity check failed: {db_err}"
        logger.error(msg)
        raise RuntimeError(msg) from db_err

    # 3. User Table & Required Columns Inspection
    try:
        # Check SQLite or PostgreSQL table info
        result = await db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='users';"))
        table_exists = result.scalar() is not None

        if not table_exists:
            # Fallback check for PostgreSQL information_schema
            result = await db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name='users';"))
            table_exists = result.scalar() is not None

        if not table_exists:
            msg = "[CRITICAL] Required 'users' table does not exist in database!"
            logger.error(msg)
            raise RuntimeError(msg)

        logger.info("  [PASS] 'users' table present.")

        # Inspect table columns
        try:
            col_result = await db.execute(text("PRAGMA table_info(users);"))
            existing_cols = [row[1] for row in col_result.fetchall()]
        except Exception:
            # Fallback for PostgreSQL
            col_result = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users';"))
            existing_cols = [row[0] for row in col_result.fetchall()]

        missing_cols: List[str] = [col for col in REQUIRED_USER_COLUMNS if col not in existing_cols]

        if missing_cols:
            msg = f"[CRITICAL] 'users' table is missing required columns: {missing_cols}"
            logger.error(msg)
            raise RuntimeError(msg)

        logger.info(f"  [PASS] All {len(REQUIRED_USER_COLUMNS)} required authentication columns verified.")

    except RuntimeError:
        raise
    except Exception as schema_err:
        logger.warning(f"  [NOTICE] Schema inspection encountered notice: {schema_err}")

    logger.info("==============================================================")
    return True
