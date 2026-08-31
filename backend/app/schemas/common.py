from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class BaseSchema(BaseModel):
    """Base Pydantic schema with ORM mode compatibility."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class ApiResponse(BaseSchema, Generic[T]):
    """Standardized API response envelope."""

    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None


class PaginatedResponse(BaseSchema, Generic[T]):
    """Standardized paginated list response envelope."""

    items: List[T] = Field(default_factory=list)
    total: int
    page: int
    page_size: int
    total_pages: int


class StatusMessage(BaseSchema):
    """Simple status confirmation message schema."""

    status: str
    detail: str
