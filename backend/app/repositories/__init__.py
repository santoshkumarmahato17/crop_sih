"""
AGRI SHIELD — Data Access & Repository Layer Package.
Isolates database queries and ORM operations from domain services.
"""

from app.repositories.base import BaseRepository

__all__ = ["BaseRepository"]
