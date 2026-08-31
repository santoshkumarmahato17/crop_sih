from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.auth import Role, User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """User data access repository."""

    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """Fetch user by email with role preloaded."""
        result = await db.execute(
            select(User)
            .options(selectinload(User.role))
            .where(User.email == email.lower().strip())
        )
        return result.scalars().first()

    async def get_with_role(self, db: AsyncSession, user_id: str) -> Optional[User]:
        """Fetch user by primary key with role preloaded."""
        result = await db.execute(
            select(User)
            .options(selectinload(User.role))
            .where(User.id == user_id)
        )
        return result.scalars().first()

    async def get_role_by_name(self, db: AsyncSession, name: str) -> Optional[Role]:
        """Fetch role by name."""
        result = await db.execute(
            select(Role).where(Role.name == name.upper().strip())
        )
        return result.scalars().first()
