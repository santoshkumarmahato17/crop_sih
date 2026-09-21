import asyncio
from sqlalchemy import create_engine, inspect, text

def main():
    try:
        from app.core.config import get_settings
        settings = get_settings()
        
        # Test Sync Connection
        print(f"Connecting to: {settings.sync_database_url}")
        engine = create_engine(settings.sync_database_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1;")).scalar()
            print(f"Connection Test (SELECT 1): {result}")
            
            # Check PostGIS
            try:
                postgis_version = conn.execute(text("SELECT PostGIS_Version();")).scalar()
                print(f"PostGIS Version: {postgis_version}")
            except Exception as e:
                print(f"PostGIS check failed: {e}")
            
            # Get Tables
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            print("\n=== TABLES ===")
            for t in tables:
                print(f"- {t}")
                columns = inspector.get_columns(t)
                print(f"  Columns: {[c['name'] for c in columns]}")
                try:
                    count = conn.execute(text(f'SELECT count(*) FROM "{t}";')).scalar()
                    print(f"  Row count: {count}")
                except Exception as e:
                    print(f"  Row count: Error ({e})")
                
    except Exception as e:
        print(f"Audit failed: {e}")

if __name__ == "__main__":
    main()
