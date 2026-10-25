from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, user_id_of, user_role_of, as_uuid
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.application import Application
from app.models.audit import AuditEvent
from app.core.config import settings
from pydantic import BaseModel
import os
import hashlib
import uuid

router = APIRouter()

ALLOWED_MIMES = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
}


class VerifyResult(BaseModel):
    document_id: str
    original_filename: str
    stored_hash: str
    computed_hash: str | None
    integrity_verified: bool
    file_available: bool
    message: str


def serialize_doc(doc: Document) -> dict:
    return {
        "id": str(doc.id),
        "application_id": str(doc.application_id),
        "original_filename": doc.original_filename,
        "mime_type": doc.mime_type,
        "file_size_bytes": doc.file_size_bytes,
        "sha256_hash": doc.sha256_hash,
        "page_count": doc.page_count,
        "status": doc.status.value,
        "uploaded_at": doc.uploaded_at.isoformat(),
        "processed_at": doc.processed_at.isoformat() if doc.processed_at else None,
    }


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    application_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    role = user_role_of(current_user)
    uid = user_id_of(current_user)
    if role == "applicant" and str(app.applicant_id) != uid:
        raise HTTPException(status_code=403, detail="Access denied")

    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=400, detail="Only PDF, PNG, and JPEG files are allowed"
        )

    content = await file.read()
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
        )
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    sha256_hash = hashlib.sha256(content).hexdigest()

    existing = (
        db.query(Document)
        .filter(
            Document.application_id == application_id,
            Document.sha256_hash == sha256_hash,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Duplicate file detected in this application"
        )

    ext = ALLOWED_MIMES[file.content_type]
    stored_filename = f"{uuid.uuid4()}.{ext}"
    upload_root = os.path.join(settings.UPLOAD_DIR, "documents")
    os.makedirs(upload_root, exist_ok=True)
    file_path = os.path.join(upload_root, stored_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        application_id=application_id,
        uploaded_by=as_uuid(uid),
        original_filename=file.filename or stored_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        mime_type=file.content_type,
        file_size_bytes=len(content),
        sha256_hash=sha256_hash,
        status=DocumentStatus.UPLOADED,
        doc_metadata={
            "extension": ext,
            "sha256": sha256_hash,
            "size_bytes": len(content),
        },
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        db.add(
            AuditEvent(
                actor_id=as_uuid(uid),
                entity_type="document",
                entity_id=str(doc.id),
                action="document.uploaded",
                details={"filename": doc.original_filename, "sha256": sha256_hash},
            )
        )
        db.commit()
    except Exception:
        db.rollback()

    return serialize_doc(doc)


@router.get("/")
def list_documents(
    application_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Document)
    role = user_role_of(current_user)
    uid = user_id_of(current_user)

    if application_id:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        if role == "applicant" and str(app.applicant_id) != uid:
            raise HTTPException(status_code=403, detail="Access denied")
        query = query.filter(Document.application_id == application_id)
    elif role == "applicant":
        app_ids = [
            a.id
            for a in db.query(Application.id)
            .filter(Application.applicant_id == as_uuid(uid))
            .all()
        ]
        if not app_ids:
            return {"documents": [], "total": 0}
        query = query.filter(Document.application_id.in_(app_ids))

    docs = query.order_by(Document.uploaded_at.desc()).all()
    return {"documents": [serialize_doc(d) for d in docs], "total": len(docs)}


@router.get("/{document_id}")
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    app = db.query(Application).filter(Application.id == doc.application_id).first()
    role = user_role_of(current_user)
    if role == "applicant" and app and str(app.applicant_id) != user_id_of(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    result = serialize_doc(doc)
    result["doc_metadata"] = doc.doc_metadata or {}
    result["file_available"] = bool(doc.file_path) and os.path.exists(doc.file_path)
    return result


@router.post("/{document_id}/verify", response_model=VerifyResult)
def verify_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recompute the SHA-256 of the stored file and compare to the recorded hash.

    This demonstrates document authentication / tamper detection.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    app = db.query(Application).filter(Application.id == doc.application_id).first()
    role = user_role_of(current_user)
    if role == "applicant" and app and str(app.applicant_id) != user_id_of(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    file_available = bool(doc.file_path) and os.path.exists(doc.file_path)
    computed = None
    if file_available:
        h = hashlib.sha256()
        with open(doc.file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        computed = h.hexdigest()

    verified = bool(computed and computed == doc.sha256_hash)
    if file_available:
        message = (
            "Integrity verified: stored file matches the recorded fingerprint."
            if verified
            else "WARNING: stored file does not match the recorded fingerprint. Possible tampering."
        )
    else:
        message = (
            "Stored file is no longer available on this host (ephemeral storage). "
            "Hash comparison cannot be performed, but the recorded fingerprint is preserved."
        )

    try:
        db.add(
            AuditEvent(
                actor_id=as_uuid(user_id_of(current_user)),
                entity_type="document",
                entity_id=str(doc.id),
                action="document.verified",
                details={"integrity_verified": verified, "file_available": file_available},
            )
        )
        db.commit()
    except Exception:
        db.rollback()

    return VerifyResult(
        document_id=str(doc.id),
        original_filename=doc.original_filename,
        stored_hash=doc.sha256_hash,
        computed_hash=computed,
        integrity_verified=verified,
        file_available=file_available,
        message=message,
    )


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    app = db.query(Application).filter(Application.id == doc.application_id).first()
    role = user_role_of(current_user)
    if role == "applicant" and app and str(app.applicant_id) != user_id_of(current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    if app and app.status.value not in {"draft", "more_info_required"}:
        raise HTTPException(
            status_code=400, detail="Documents cannot be removed after submission"
        )

    try:
        if doc.file_path and os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except OSError:
        pass

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted"}
