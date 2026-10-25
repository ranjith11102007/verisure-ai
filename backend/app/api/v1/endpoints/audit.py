from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, user_id_of, user_role_of, as_uuid
from app.models.user import User
from app.models.audit import AuditEvent
from typing import Optional

router = APIRouter()


@router.get("/")
def list_audit_events(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AuditEvent)
    role = user_role_of(current_user)
    if role == "applicant":
        query = query.filter(AuditEvent.actor_id == as_uuid(user_id_of(current_user)))

    if entity_type:
        query = query.filter(AuditEvent.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditEvent.entity_id == entity_id)

    events = query.order_by(AuditEvent.created_at.desc()).limit(limit).all()

    return {
        "events": [
            {
                "id": str(e.id),
                "actor_id": str(e.actor_id) if e.actor_id else None,
                "entity_type": e.entity_type,
                "entity_id": e.entity_id,
                "action": e.action,
                "details": e.details or {},
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
        "total": len(events),
    }
