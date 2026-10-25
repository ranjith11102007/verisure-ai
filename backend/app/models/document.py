from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Integer, Text, JSON
from sqlalchemy import Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime
import enum
from app.models.types import CoercingUuid


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    EXTRACTED = "extracted"
    REVIEWED = "reviewed"
    FAILED = "failed"


class Document(Base):
    __tablename__ = "documents"

    id = Column(CoercingUuid(), primary_key=True, default=uuid.uuid4)
    application_id = Column(CoercingUuid(), ForeignKey("applications.id"), nullable=False)
    uploaded_by = Column(CoercingUuid(), ForeignKey("users.id"), nullable=False)

    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    sha256_hash = Column(String, index=True, nullable=False)
    page_count = Column(Integer, nullable=True)

    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    processing_error = Column(Text, nullable=True)
    doc_metadata = Column(JSON, default={})

    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="documents")
    extracted_fields = relationship("ExtractedField", back_populates="document")
    verification_checks = relationship("VerificationCheck", back_populates="document")
