from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
import enum


class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    PROCESSING = "processing"
    UNDER_REVIEW = "under_review"
    MORE_INFO_REQUIRED = "more_info_required"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_no = Column(String, unique=True, index=True, nullable=False)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    organization_name = Column(String, nullable=False)
    application_category = Column(String, nullable=False)
    applicant_details = Column(JSON, default={})
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.DRAFT, nullable=False)

    submitted_at = Column(DateTime, nullable=True)
    decision_at = Column(DateTime, nullable=True)
    decision_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applicant = relationship("User", back_populates="applications", foreign_keys=[applicant_id])
    assigned_reviewer = relationship("User", back_populates="assigned_applications", foreign_keys=[assigned_reviewer_id])
    documents = relationship("Document", back_populates="application")
    status_history = relationship("ApplicationStatusHistory", back_populates="application")
    compliance_runs = relationship("ComplianceRun", back_populates="application")
    evidence_requests = relationship("EvidenceRequest", back_populates="application")
    review_actions = relationship("ReviewAction", back_populates="application")


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=False)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="status_history")
