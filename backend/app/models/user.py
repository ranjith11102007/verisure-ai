from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
import enum
from app.models.types import CoercingUuid


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    REVIEWER = "reviewer"
    APPLICANT = "applicant"


class User(Base):
    __tablename__ = "users"

    id = Column(CoercingUuid(), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.APPLICANT, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applications = relationship("Application", back_populates="applicant", foreign_keys="Application.applicant_id")
    assigned_applications = relationship("Application", back_populates="assigned_reviewer", foreign_keys="Application.assigned_reviewer_id")
    audit_events = relationship("AuditEvent", back_populates="actor")
