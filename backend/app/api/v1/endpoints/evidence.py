from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, user_id_of, user_role_of, as_uuid
from app.models.user import User
from app.models.application import Application, ApplicationStatus, ApplicationStatusHistory
from app.models.evidence import EvidenceRequest, EvidenceRequestStatus
from app.models.audit import AuditEvent
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter()


class EvidenceCreate(BaseModel):
    application_id: str
    message: str
    items: list = []
    due_in_days: int = 7


class EvidenceRespond(BaseModel):
    response_notes: str


def serialize_evidence(e: EvidenceRequest, reference_no: str | None = None) -> dict:
    return {
        "id": str(e.id),
        "application_id": str(e.application_id),
        "reference_no": reference_no,
        "message": e.message,
        "items": e.items or [],
        "status": e.status.value if hasattr(e.status, "value") else str(e.status),
        "due_at": e.due_at.isoformat() if e.due_at else None,
        "responded_at": e.responded_at.isoformat() if e.responded_at else None,
        "response_notes": e.response_notes,
        "created_at": e.created_at.isoformat(),
    }


@router.get("/")
def list_evidence(
    application_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EvidenceRequest)
    role = user_role_of(current_user)
    uid = user_id_of(current_user)

    if role == "applicant":
        app_ids = [
            a.id
            for a in db.query(Application.id)
            .filter(Application.applicant_id == as_uuid(uid))
            .all()
        ]
        if not app_ids:
            return {"requests": [], "total": 0}
        query = query.filter(EvidenceRequest.application_id.in_(app_ids))

    if application_id:
        query = query.filter(EvidenceRequest.application_id == application_id)

    requests = query.order_by(EvidenceRequest.created_at.desc()).all()

    app_ids = [r.application_id for r in requests]
    refs = {}
    if app_ids:
        refs = {
            str(a.id): a.reference_no
            for a in db.query(Application).filter(Application.id.in_(app_ids)).all()
        }

    return {
        "requests": [serialize_evidence(r, refs.get(str(r.application_id))) for r in requests],
        "total": len(requests),
    }


@router.post("/")
def create_evidence(
    payload: EvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_role_of(current_user) not in {"admin", "reviewer"}:
        raise HTTPException(status_code=403, detail="Operation not permitted")

    app = db.query(Application).filter(Application.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    req = EvidenceRequest(
        application_id=app.id,
        requested_by=as_uuid(user_id_of(current_user)),
        items=payload.items,
        message=payload.message,
        due_at=datetime.utcnow() + timedelta(days=payload.due_in_days),
        status=EvidenceRequestStatus.PENDING,
    )
    db.add(req)

    previous = app.status
    app.status = ApplicationStatus.MORE_INFO_REQUIRED
    db.add(
        ApplicationStatusHistory(
            application_id=app.id,
            from_status=previous.value,
            to_status=ApplicationStatus.MORE_INFO_REQUIRED.value,
            actor_id=as_uuid(user_id_of(current_user)),
            reason="Additional evidence requested",
        )
    )
    db.commit()
    db.refresh(req)

    try:
        db.add(
            AuditEvent(
                actor_id=as_uuid(user_id_of(current_user)),
                entity_type="evidence_request",
                entity_id=str(req.id),
                action="evidence.requested",
                details={"application_id": str(app.id)},
            )
        )
        db.commit()
    except Exception:
        db.rollback()

    return serialize_evidence(req, app.reference_no)


@router.post("/{request_id}/respond")
def respond_evidence(
    request_id: str,
    payload: EvidenceRespond,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.query(EvidenceRequest).filter(EvidenceRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Evidence request not found")

    app = db.query(Application).filter(Application.id == req.application_id).first()
    role = user_role_of(current_user)
    uid = user_id_of(current_user)
    if role == "applicant" and app and str(app.applicant_id) != uid:
        raise HTTPException(status_code=403, detail="Access denied")

    req.response_notes = payload.response_notes
    req.responded_at = datetime.utcnow()
    req.status = EvidenceRequestStatus.RESPONDED
    db.commit()
    db.refresh(req)
    return serialize_evidence(req, app.reference_no if app else None)
