from typing import Any, Generic, List, Optional, Type, TypeVar
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseService(Generic[ModelType]):
    """
    Abstract base service providing standard CRUD operations
    and transaction isolation for domain entities.
    """

    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """Fetch entity by primary key."""
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalars().first()

    async def list_all(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """List entities with pagination."""
        result = await db.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all())
