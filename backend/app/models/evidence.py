from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy import Uuid, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
import enum
from app.models.types import CoercingUuid


class EvidenceRequestStatus(str, enum.Enum):
    PENDING = "pending"
    RESPONDED = "responded"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class EvidenceRequest(Base):
    __tablename__ = "evidence_requests"

    id = Column(CoercingUuid(), primary_key=True, default=uuid.uuid4)
    application_id = Column(CoercingUuid(), ForeignKey("applications.id"), nullable=False)
    requested_by = Column(CoercingUuid(), ForeignKey("users.id"), nullable=False)

    items = Column(JSON, default=[])  # list of {type, description, document_id?}
    message = Column(Text, nullable=False)
    status = Column(SQLEnum(EvidenceRequestStatus), default=EvidenceRequestStatus.PENDING)
    due_at = Column(DateTime, nullable=True)
    responded_at = Column(DateTime, nullable=True)
    response_notes = Column(Text, nullable=True)
    response_documents = Column(JSON, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    application = relationship("Application", back_populates="evidence_requests")
