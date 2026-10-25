from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float, Integer, Boolean
from sqlalchemy import Uuid, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
from app.models.types import CoercingUuid


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(CoercingUuid(), primary_key=True, default=uuid.uuid4)
    document_id = Column(CoercingUuid(), ForeignKey("documents.id"), nullable=False)

    field_key = Column(String, nullable=False)
    field_label = Column(String, nullable=False)
    extracted_value = Column(Text, nullable=True)
    corrected_value = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    page_number = Column(Integer, nullable=True)
    bbox = Column(JSON, nullable=True)
    source_text = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)

    reviewed_by = Column(CoercingUuid(), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    document = relationship("Document", back_populates="extracted_fields")
