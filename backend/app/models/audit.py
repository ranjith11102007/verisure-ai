from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy import Uuid, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
from app.models.types import CoercingUuid


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(CoercingUuid(), primary_key=True, default=uuid.uuid4)
    actor_id = Column(CoercingUuid(), ForeignKey("users.id"), nullable=True)
    entity_type = Column(String, nullable=False)  # user, application, document, etc.
    entity_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    actor = relationship("User", back_populates="audit_events")
