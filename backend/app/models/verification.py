from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
import enum


class VerificationStatus(str, enum.Enum):
    PASSED = "passed"
    FAILED = "failed"
    NEEDS_REVIEW = "needs_review"
    UNABLE_TO_VERIFY = "unable_to_verify"
    NOT_APPLICABLE = "not_applicable"
    PENDING = "pending"


class VerificationCheck(Base):
    __tablename__ = "verification_checks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=True)
    executed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    check_type = Column(String, nullable=False)
    method = Column(String, nullable=False)
    status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    result_summary = Column(Text, nullable=True)
    evidence = Column(JSON, default={})
    limitations = Column(Text, nullable=True)
    errors = Column(Text, nullable=True)
    automated = Column(Boolean, default=True)
    duration_ms = Column(Integer, nullable=True)

    executed_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    document = relationship("Document", back_populates="verification_checks")
