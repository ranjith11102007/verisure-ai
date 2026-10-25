from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import (
    get_current_user,
    user_id_of,
    user_role_of,
    as_uuid,
)
from app.models.user import User
from app.models.application import Application, ApplicationStatus, ApplicationStatusHistory
from app.models.document import Document
from app.models.compliance import ComplianceRun, ComplianceFinding
from app.models.evidence import EvidenceRequest
from app.models.audit import AuditEvent
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter()


class ApplicationCreate(BaseModel):
    organization_name: str
    application_category: str
    applicant_details: dict = {}


class StatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None


def generate_ref_no(db: Session) -> str:
    count = db.query(Application).count()
    return f"VSA-{datetime.utcnow().year}-{count + 1:04d}"


def serialize_app(app: Application) -> dict:
    return {
        "id": str(app.id),
        "reference_no": app.reference_no,
        "organization_name": app.organization_name,
        "application_category": app.application_category,
        "status": app.status.value,
        "applicant_details": app.applicant_details or {},
        "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
        "decision_at": app.decision_at.isoformat() if app.decision_at else None,
        "decision_reason": app.decision_reason,
        "created_at": app.created_at.isoformat(),
        "updated_at": app.updated_at.isoformat(),
    }


def log_audit(db: Session, actor_id, entity_type: str, entity_id: str, action: str, details: dict | None = None):
    try:
        db.add(
            AuditEvent(
                actor_id=actor_id,
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                details=details or {},
            )
        )
        db.commit()
    except Exception:
        db.rollback()


@router.get("/stats")
def application_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dashboard aggregate statistics."""
    query = db.query(Application)
    role = user_role_of(current_user)
    uid = user_id_of(current_user)
    uid_db = as_uuid(uid)
    if role == "applicant":
        query = query.filter(Application.applicant_id == uid_db)

    apps = query.all()
    counts = {s.value: 0 for s in ApplicationStatus}
    for a in apps:
        counts[a.status.value] = counts.get(a.status.value, 0) + 1

    doc_query = db.query(Document)
    if role == "applicant":
        doc_query = doc_query.filter(Document.uploaded_by == uid_db)

    finding_query = db.query(ComplianceFinding)

    return {
        "total": len(apps),
        "by_status": counts,
        "documents": doc_query.count(),
        "findings": finding_query.count(),
        "evidence_requests": db.query(EvidenceRequest).count()
        if role != "applicant"
        else db.query(EvidenceRequest)
        .filter(
            EvidenceRequest.application_id.in_(
                [a.id for a in apps] or [uuid.uuid4()]
            )
        )
        .count(),
    }


@router.get("/")
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
):
    query = db.query(Application)
    role = user_role_of(current_user)
    uid = user_id_of(current_user)

    uid_db = as_uuid(uid)
    if role == "applicant":
        query = query.filter(Application.applicant_id == uid_db)
    elif role == "reviewer":
        query = query.filter(
            (Application.assigned_reviewer_id == uid_db)
            | (Application.status == ApplicationStatus.SUBMITTED)
        )

    if status_filter:
        try:
            query = query.filter(Application.status == ApplicationStatus(status_filter))
        except ValueError:
            pass

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Application.organization_name.ilike(pattern))
            | (Application.reference_no.ilike(pattern))
        )

    total = query.count()
    apps = (
        query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    )

    return {
        "applications": [serialize_app(a) for a in apps],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/")
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = user_id_of(current_user)
    app = Application(
        reference_no=generate_ref_no(db),
        applicant_id=as_uuid(uid),
        organization_name=data.organization_name.strip(),
        application_category=data.application_category,
        applicant_details=data.applicant_details,
        status=ApplicationStatus.DRAFT,
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    db.add(
        ApplicationStatusHistory(
            application_id=app.id,
            from_status=None,
            to_status=ApplicationStatus.DRAFT.value,
            actor_id=as_uuid(uid),
            reason="Application created",
        )
    )
    db.commit()
    log_audit(db, as_uuid(uid), "application", str(app.id), "application.created")

    return serialize_app(app)


@router.get("/{application_id}")
def get_application(
    application_id: str,
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

    documents = (
        db.query(Document)
        .filter(Document.application_id == app.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )
    history = (
        db.query(ApplicationStatusHistory)
        .filter(ApplicationStatusHistory.application_id == app.id)
        .order_by(ApplicationStatusHistory.created_at.asc())
        .all()
    )
    runs = (
        db.query(ComplianceRun)
        .filter(ComplianceRun.application_id == app.id)
        .order_by(ComplianceRun.executed_at.desc())
        .all()
    )
    evidence = (
        db.query(EvidenceRequest)
        .filter(EvidenceRequest.application_id == app.id)
        .order_by(EvidenceRequest.created_at.desc())
        .all()
    )

    result = serialize_app(app)
    result["documents"] = [
        {
            "id": str(d.id),
            "original_filename": d.original_filename,
            "mime_type": d.mime_type,
            "file_size_bytes": d.file_size_bytes,
            "sha256_hash": d.sha256_hash,
            "status": d.status.value,
            "uploaded_at": d.uploaded_at.isoformat(),
        }
        for d in documents
    ]
    result["history"] = [
        {
            "id": str(h.id),
            "from_status": h.from_status,
            "to_status": h.to_status,
            "reason": h.reason,
            "created_at": h.created_at.isoformat(),
        }
        for h in history
    ]
    result["compliance_runs"] = [
        {
            "id": str(r.id),
            "status": r.status,
            "executed_at": r.executed_at.isoformat(),
            "findings": len(r.findings),
        }
        for r in runs
    ]
    result["evidence_requests"] = [
        {
            "id": str(e.id),
            "message": e.message,
            "status": e.status.value,
            "due_at": e.due_at.isoformat() if e.due_at else None,
            "created_at": e.created_at.isoformat(),
            "response_notes": e.response_notes,
        }
        for e in evidence
    ]
    return result


@router.post("/{application_id}/submit")
def submit_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    uid = user_id_of(current_user)
    role = user_role_of(current_user)
    if role == "applicant" and str(app.applicant_id) != uid:
        raise HTTPException(status_code=403, detail="Access denied")

    allowed_from = {ApplicationStatus.DRAFT, ApplicationStatus.MORE_INFO_REQUIRED}
    if app.status not in allowed_from:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit an application in '{app.status.value}' status",
        )

    doc_count = db.query(Document).filter(Document.application_id == app.id).count()
    if doc_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Upload at least one supporting document before submitting",
        )

    previous = app.status
    app.status = ApplicationStatus.SUBMITTED
    app.submitted_at = datetime.utcnow()
    db.add(
        ApplicationStatusHistory(
            application_id=app.id,
            from_status=previous.value,
            to_status=ApplicationStatus.SUBMITTED.value,
            actor_id=as_uuid(uid),
            reason="Submitted by applicant",
        )
    )
    db.commit()
    db.refresh(app)
    log_audit(db, as_uuid(uid), "application", str(app.id), "application.submitted")
    return serialize_app(app)


@router.patch("/{application_id}/status")
def update_status(
    application_id: str,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    role = user_role_of(current_user)
    if role not in {"admin", "reviewer"}:
        raise HTTPException(status_code=403, detail="Operation not permitted")

    try:
        new_status = ApplicationStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value")

    previous = app.status
    app.status = new_status
    if new_status in {ApplicationStatus.APPROVED, ApplicationStatus.REJECTED}:
        app.decision_at = datetime.utcnow()
        app.decision_reason = payload.reason
    if new_status == ApplicationStatus.UNDER_REVIEW:
        app.assigned_reviewer_id = as_uuid(user_id_of(current_user))

    db.add(
        ApplicationStatusHistory(
            application_id=app.id,
            from_status=previous.value,
            to_status=new_status.value,
            actor_id=as_uuid(user_id_of(current_user)),
            reason=payload.reason or f"Status changed to {new_status.value}",
        )
    )
    db.commit()
    db.refresh(app)
    log_audit(
        db,
        as_uuid(user_id_of(current_user)),
        "application",
        str(app.id),
        "application.status_changed",
        {"from": previous.value, "to": new_status.value},
    )
    return serialize_app(app)


@router.get("/{application_id}/history")
def application_history(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    role = user_role_of(current_user)
    if role == "applicant" and str(app.applicant_id) != user_id_of(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    history = (
        db.query(ApplicationStatusHistory)
        .filter(ApplicationStatusHistory.application_id == app.id)
        .order_by(ApplicationStatusHistory.created_at.asc())
        .all()
    )
    return {
        "history": [
            {
                "id": str(h.id),
                "from_status": h.from_status,
                "to_status": h.to_status,
                "reason": h.reason,
                "created_at": h.created_at.isoformat(),
            }
            for h in history
        ]
    }
