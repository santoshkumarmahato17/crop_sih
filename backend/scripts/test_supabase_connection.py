import asyncio
import os
import sys
from urllib.parse import urlparse

# Add backend root to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import get_settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text


async def test_connection():
    settings = get_settings()
    print("=" * 60)
    print("AGRI SHIELD — Supabase Database Connectivity Probe")
    print("=" * 60)
    print(f"Target DATABASE_URL configured: {'Yes' if settings.DATABASE_URL else 'No (using individual POSTGRES_* settings)'}")
    print(f"Supabase Project URL: {settings.SUPABASE_URL}")

    db_url = settings.async_database_url
    # Hide password in output
    parsed = urlparse(db_url)
    safe_netloc = parsed.netloc
    if parsed.password:
        safe_netloc = safe_netloc.replace(parsed.password, "********")
    safe_url = parsed._replace(netloc=safe_netloc).geturl()
    print(f"Engine Async URL: {safe_url}")

    host = parsed.hostname or settings.POSTGRES_SERVER
    port = parsed.port or 5432
    print(f"Host: {host} | Port: {port}")

    connect_args = {}
    if host not in ("localhost", "127.0.0.1", "0.0.0.0") or "supabase" in host.lower():
        connect_args["ssl"] = True

    print(f"Connecting with SSL: {connect_args.get('ssl', False)} ...")
    try:
        engine = create_async_engine(db_url, connect_args=connect_args, pool_pre_ping=True)
        async with engine.connect() as conn:
            # 1. Test basic query
            result = await conn.execute(text("SELECT version();"))
            version_str = result.scalar()
            print(f"[SUCCESS] Connected to PostgreSQL!")
            print(f"PostgreSQL Version: {version_str}")

            # 2. Check or create PostGIS extension
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                gis_res = await conn.execute(text("SELECT postgis_version();"))
                gis_ver = gis_res.scalar()
                print(f"[SUCCESS] PostGIS Extension active: {gis_ver}")
            except Exception as gis_err:
                print(f"[WARNING] PostGIS check note: {gis_err}")

        await engine.dispose()
        print("=" * 60)
        print("Supabase Database connection is FULLY OPERATIONAL!")
        print("=" * 60)
        return True
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        print("\nTroubleshooting tips:")
        print("1. If host name failed to resolve, use Supabase connection pooler host (e.g. aws-0-[region].pooler.supabase.com) on port 6543 or 5432.")
        print("2. Ensure your database password does not contain unencoded special characters (e.g. '@', ':', '#').")
        print("3. Check Supabase Dashboard -> Project Settings -> Database -> Connection String.")
        print("=" * 60)
        return False


if __name__ == "__main__":
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)
