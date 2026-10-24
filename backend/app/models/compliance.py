from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
import enum


class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FindingDisposition(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    RESOLVED = "resolved"


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    applicable_category = Column(String, nullable=True)
    validation_logic = Column(JSON, default={})
    supported_fields = Column(JSON, default=[])
    severity = Column(SQLEnum(Severity), default=Severity.MEDIUM, nullable=False)
    active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    effective_from = Column(DateTime, default=datetime.utcnow)
    source_ref = Column(String, nullable=True)
    evidence_reference = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    findings = relationship("ComplianceFinding", back_populates="rule")


class ComplianceRun(Base):
    __tablename__ = "compliance_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    triggered_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rule_set_version = Column(String, nullable=True)
    status = Column(String, default="completed")
    executed_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="compliance_runs")
    findings = relationship("ComplianceFinding", back_populates="run")


class ComplianceFinding(Base):
    __tablename__ = "compliance_findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("compliance_runs.id"), nullable=False)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("compliance_rules.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)

    affected_field = Column(String, nullable=True)
    reason = Column(Text, nullable=False)
    evidence_refs = Column(JSON, default=[])
    recommended_action = Column(Text, nullable=True)
    disposition = Column(SQLEnum(FindingDisposition), default=FindingDisposition.PENDING)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("ComplianceRun", back_populates="findings")
    rule = relationship("ComplianceRule", back_populates="findings")
