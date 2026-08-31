#!/usr/bin/env python3
"""
AGRI SHIELD — Database Seeding Command.
Populates the database with initial roles, sample farm holdings, zones, missions, observations, and IPM recommendations.
"""

import sys
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.db.session import AsyncSessionLocal
from app.db.seed_data import seed_all_data


async def main():
    print("==========================================================")
    print("AGRI SHIELD: Seeding Agronomic Development Data...")
    print("==========================================================")

    async with AsyncSessionLocal() as session:
        try:
            summary = await seed_all_data(session)
            print("\nSeeding Completed Successfully!")
            for entity, count in summary.items():
                print(f"  - {entity.capitalize()}: {count} records created")
        except Exception as e:
            print(f"\n[ERROR] Seeding failed: {str(e)}")
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
