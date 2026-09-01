import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.permissions import RoleType, get_permissions_for_role
from app.db.base import Base, TimestampMixin


class Role(Base, TimestampMixin):
    """User authorization roles with permission scopes."""

    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    permissions: Mapped[Optional[dict]] = mapped_column(JSON, default=list, nullable=True)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="role_rel")


class User(Base, TimestampMixin):
    """System user accounts strictly categorized into FARMER, GOVERNMENT, or ADMIN."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Primary Role Enum (Source of Truth)
    role: Mapped[RoleType] = mapped_column(
        Enum(RoleType), default=RoleType.FARMER, nullable=False, index=True
    )

    # Organization / Regional Scope for Government Users
    organization_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    assigned_region: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    role_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relationships
    role_rel: Mapped[Optional["Role"]] = relationship("Role", back_populates="users")
    owned_farms: Mapped[List["Farm"]] = relationship(
        "Farm", back_populates="owner", cascade="all, delete-orphan", foreign_keys="Farm.owner_id"
    )
    farm_memberships: Mapped[List["FarmMember"]] = relationship(
        "FarmMember", back_populates="user", cascade="all, delete-orphan"
    )
    drone_missions: Mapped[List["DroneMission"]] = relationship(
        "DroneMission", back_populates="operator"
    )
    validations: Mapped[List["ExpertValidation"]] = relationship(
        "ExpertValidation", back_populates="expert_user"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def permissions(self) -> List[str]:
        """Calculated permissions based on current assigned role."""
        return get_permissions_for_role(self.role)
