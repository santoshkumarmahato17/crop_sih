import os
import socket
from typing import AsyncGenerator
from sqlalchemy import event, select
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from geoalchemy2 import Geometry
from geoalchemy2.admin.dialects import sqlite as ga_sqlite

from app.core.config import get_settings
from app.core.logging import logger

settings = get_settings()

# ------------------------------------------------------------------------------
# 1. SQLite Geometry Compatibility Hooks
# ------------------------------------------------------------------------------
@compiles(Geometry, "sqlite")
def compile_geometry_sqlite(element, compiler, **kw):
    """Compile PostGIS Geometry types as standard TEXT in SQLite."""
    return "TEXT"

# Bypass SpatiaLite DDL constraints for pure SQLite environments
ga_sqlite.after_create = lambda *args, **kwargs: None
ga_sqlite.before_create = lambda *args, **kwargs: None


# ------------------------------------------------------------------------------
# 2. Database Engine Discovery (PostgreSQL / SQLite Dual-Mode)
# ------------------------------------------------------------------------------
def is_postgres_available(host: str, port: int, timeout_seconds: float = 0.6) -> bool:
    """Performs a non-blocking TCP socket probe to verify PostgreSQL daemon reachability."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout_seconds)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


postgres_online = is_postgres_available(settings.POSTGRES_SERVER, settings.POSTGRES_PORT)

if postgres_online:
    logger.info(
        f"[Database] PostgreSQL + PostGIS active at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}. "
        f"Binding production async engine."
    )
    database_url = settings.async_database_url
    is_sqlite = False
    engine = create_async_engine(
        database_url,
        echo=False,
        future=True,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
    )
else:
    db_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../agrishield.db"))
    database_url = f"sqlite+aiosqlite:///{db_file_path}"
    is_sqlite = True
    logger.warning(
        f"[Database] PostgreSQL daemon not detected at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}. "
        f"Operating with resilient asynchronous SQLite engine: {db_file_path}"
    )
    engine = create_async_engine(
        database_url,
        echo=False,
        future=True,
    )

    @event.listens_for(engine.sync_engine, "connect")
    def register_sqlite_spatial_shims(dbapi_connection, connection_record):
        """Register spatialite function shims in SQLite connection for WKT parsing."""
        import shapely.wkt
        import shapely.wkb

        def geom_shim(val, *args):
            return str(val) if val is not None else None

        def as_ewkb(val, *args):
            if val is None:
                return None
            if isinstance(val, str):
                clean_wkt = val.split(";")[-1] if ";" in val else val
                try:
                    geom = shapely.wkt.loads(clean_wkt)
                    return shapely.wkb.dumps(geom, srid=4326)
                except Exception:
                    return val.encode("utf-8")
            return bytes(val) if not isinstance(val, bytes) else val

        spatial_functions = [
            "GeomFromEWKT",
            "ST_GeomFromEWKT",
            "ST_GeomFromText",
            "GeomFromText",
            "ST_AsGeoJSON",
            "AsGeoJSON",
            "ST_SRID",
            "ST_Area",
        ]
        for func_name in spatial_functions:
            try:
                dbapi_connection.create_function(func_name, 1, geom_shim)
                dbapi_connection.create_function(func_name, 2, geom_shim)
                dbapi_connection.create_function(func_name, 3, geom_shim)
            except Exception:
                pass

        for func_name in ["AsEWKB", "ST_AsEWKB", "AsBinary", "ST_AsBinary"]:
            try:
                dbapi_connection.create_function(func_name, 1, as_ewkb)
                dbapi_connection.create_function(func_name, 2, as_ewkb)
            except Exception:
                pass


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# Alias for worker session factory
async_session_factory = AsyncSessionLocal


# ------------------------------------------------------------------------------
# 3. Database Session Dependency
# ------------------------------------------------------------------------------
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injector yielding scoped asynchronous database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ------------------------------------------------------------------------------
# 4. Database Schema Initialization & Auto-Seeding
# ------------------------------------------------------------------------------
async def init_db() -> None:
    """
    Initializes database schema and populates initial operational data if empty.
    Called during application startup lifespan.
    """
    from app.models import Base, User
    from app.db.seed_data import seed_all_data

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[Database] Verified all schema tables exist.")

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User))
            existing_user = result.scalars().first()
            if not existing_user:
                logger.info("[Database] Empty database detected. Seeding realistic agronomic data...")
                seed_summary = await seed_all_data(session)
                logger.info(f"[Database] Successfully seeded initial dataset: {seed_summary}")
            else:
                logger.info("[Database] Operational data present. Ready.")
    except Exception as err:
        logger.error(f"[Database] Error during init_db: {err}")
