from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
from app.models.types import CoercingUuid


class ReviewAction(Base):
    __tablename__ = "review_actions"

    id = Column(CoercingUuid(), primary_key=True, default=uuid.uuid4)
    application_id = Column(CoercingUuid(), ForeignKey("applications.id"), nullable=False)
    actor_id = Column(CoercingUuid(), ForeignKey("users.id"), nullable=False)

    action_type = Column(String, nullable=False)
    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=True)
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="review_actions")
