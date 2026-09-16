import enum
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    Index,
    Boolean,
    Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

class LabReferralStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    SAMPLE_PENDING = "SAMPLE_PENDING"
    SAMPLE_COLLECTED = "SAMPLE_COLLECTED"
    SENT_TO_LAB = "SENT_TO_LAB"
    RECEIVED_BY_LAB = "RECEIVED_BY_LAB"
    TESTING = "TESTING"
    RESULT_AVAILABLE = "RESULT_AVAILABLE"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"

class SampleStatus(str, enum.Enum):
    PENDING_COLLECTION = "PENDING_COLLECTION"
    COLLECTED = "COLLECTED"
    IN_TRANSIT = "IN_TRANSIT"
    RECEIVED = "RECEIVED"
    REJECTED = "REJECTED"

class LabResultStatus(str, enum.Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    INCONCLUSIVE = "INCONCLUSIVE"
    INVALID = "INVALID"
    PENDING = "PENDING"

class PathogenType(str, enum.Enum):
    FUNGAL = "FUNGAL"
    BACTERIAL = "BACTERIAL"
    VIRAL = "VIRAL"
    OOMYCETE = "OOMYCETE"
    NEMATODE = "NEMATODE"
    INSECT = "INSECT"
    MITE = "MITE"
    ABIOTIC = "ABIOTIC"
    OTHER = "OTHER"
    UNKNOWN = "UNKNOWN"

class Laboratory(Base, TimestampMixin):
    """Configured agricultural laboratories."""
    __tablename__ = "laboratories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contact_information: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    supported_tests: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(50), default="VERIFIED")


class LabReferral(Base, TimestampMixin):
    """Laboratory testing order escalated from Expert Review."""
    __tablename__ = "lab_referrals"
    __table_args__ = (
        Index("ix_lab_ref_status", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    referral_code: Mapped[str] = mapped_column(
        String(20), default=lambda: f"LAB-{datetime.utcnow().strftime('%y%m')}-{uuid.uuid4().hex[:4].upper()}", unique=True, index=True
    )
    diagnostic_case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("diagnostic_cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expert_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    laboratory_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("laboratories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    
    suspected_condition: Mapped[str] = mapped_column(String(200), nullable=False)
    referral_reason: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="NORMAL")
    status: Mapped[LabReferralStatus] = mapped_column(
        Enum(LabReferralStatus), default=LabReferralStatus.REQUESTED, nullable=False, index=True
    )
    
    sample_type_requested: Mapped[str] = mapped_column(String(100), default="Leaf", nullable=False)
    collection_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    diagnostic_case: Mapped["DiagnosticCase"] = relationship("DiagnosticCase", back_populates="lab_referrals")
    laboratory: Mapped[Optional["Laboratory"]] = relationship("Laboratory")
    samples: Mapped[List["LabSample"]] = relationship("LabSample", back_populates="referral", cascade="all, delete-orphan")
    results: Mapped[List["LabResult"]] = relationship("LabResult", back_populates="referral", cascade="all, delete-orphan")


class LabSample(Base, TimestampMixin):
    """Physical sample tracking."""
    __tablename__ = "lab_samples"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    referral_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("lab_referrals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    collector_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    
    sample_type: Mapped[str] = mapped_column(String(100), nullable=False)
    collection_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    collection_location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    sample_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sample_condition: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    tracking_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[SampleStatus] = mapped_column(Enum(SampleStatus), default=SampleStatus.PENDING_COLLECTION, nullable=False)
    received_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    referral: Mapped["LabReferral"] = relationship("LabReferral", back_populates="samples")


class LabResult(Base, TimestampMixin):
    """Structured laboratory result data."""
    __tablename__ = "lab_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    referral_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("lab_referrals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sample_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("lab_samples.id", ondelete="SET NULL"), nullable=True
    )
    technician_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    
    test_name: Mapped[str] = mapped_column(String(200), nullable=False)
    result_status: Mapped[LabResultStatus] = mapped_column(Enum(LabResultStatus), default=LabResultStatus.PENDING, nullable=False)
    pathogen: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    pathogen_type: Mapped[Optional[PathogenType]] = mapped_column(Enum(PathogenType), nullable=True)
    
    tested_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reported_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    referral: Mapped["LabReferral"] = relationship("LabReferral", back_populates="results")
    reports: Mapped[List["LabReport"]] = relationship("LabReport", back_populates="result", cascade="all, delete-orphan")


class LabReport(Base, TimestampMixin):
    """Immutable uploaded document (e.g. PDF/Image) acting as evidence."""
    __tablename__ = "lab_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    result_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("lab_results.id", ondelete="CASCADE"), nullable=False, index=True
    )
    uploaded_by: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    
    report_reference: Mapped[str] = mapped_column(String(200), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False) # S3 / MinIO path
    file_hash: Mapped[str] = mapped_column(String(128), nullable=False) # SHA-256 for integrity
    report_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    result: Mapped["LabResult"] = relationship("LabResult", back_populates="reports")
