from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.application import Application
from app.core.config import settings
import os
import hashlib
import uuid
from datetime import datetime

router = APIRouter()

ALLOWED_MIMES = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    application_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check application access
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role.value == "applicant" and app.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate content type
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail="Only PDF, PNG, and JPEG files are allowed")
    
    # Read file
    content = await file.read()
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")
    
    # Calculate SHA-256
    sha256_hash = hashlib.sha256(content).hexdigest()
    
    # Check for duplicates in same application
    existing = db.query(Document).filter(
        Document.application_id == application_id,
        Document.sha256_hash == sha256_hash
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Duplicate file detected in this application")
    
    # Generate safe filename
    ext = ALLOWED_MIMES[file.content_type]
    stored_filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, "documents", stored_filename)
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create document record
    doc = Document(
        application_id=application_id,
        uploaded_by=current_user.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=file_path,
        mime_type=file.content_type,
        file_size_bytes=len(content),
        sha256_hash=sha256_hash,
        status=DocumentStatus.UPLOADED,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return {
        "id": str(doc.id),
        "original_filename": doc.original_filename,
        "sha256_hash": doc.sha256_hash,
        "file_size_bytes": doc.file_size_bytes,
        "status": doc.status.value,
        "uploaded_at": doc.uploaded_at.isoformat(),
    }


@router.get("/")
def list_documents(
    application_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Document)
    if application_id:
        app = db.query(Application).filter(Application.id == application_id).first()
        if app and current_user.role.value == "applicant" and app.applicant_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        query = query.filter(Document.application_id == application_id)
    else:
        if current_user.role.value == "applicant":
            apps = db.query(Application.id).filter(Application.applicant_id == current_user.id)
            query = query.filter(Document.application_id.in_(apps))
    
    docs = query.order_by(Document.uploaded_at.desc()).all()
    return {
        "documents": [
            {
                "id": str(doc.id),
                "application_id": str(doc.application_id),
                "original_filename": doc.original_filename,
                "mime_type": doc.mime_type,
                "file_size_bytes": doc.file_size_bytes,
                "sha256_hash": doc.sha256_hash,
                "status": doc.status.value,
                "uploaded_at": doc.uploaded_at.isoformat(),
            }
            for doc in docs
        ]
    }
