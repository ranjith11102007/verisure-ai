from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import (
    get_current_user,
    user_id_of,
    user_email_of,
    user_role_of,
    user_full_name_of,
    as_uuid,
)
from app.models.user import User
from app.models.audit import AuditEvent
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if isinstance(current_user, dict):
        user = current_user
        created_at = user.get("created_at")
    else:
        user = current_user
        created_at = user.created_at.isoformat() if user.created_at else None

    return {
        "id": user_id_of(current_user),
        "email": user_email_of(current_user),
        "full_name": user_full_name_of(current_user),
        "role": user_role_of(current_user),
        "is_active": True,
        "created_at": created_at,
    }


@router.patch("/me")
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.full_name or not payload.full_name.strip():
        raise HTTPException(status_code=400, detail="Full name is required")

    new_name = payload.full_name.strip()
    uid = user_id_of(current_user)

    if isinstance(current_user, dict):
        current_user["full_name"] = new_name
    else:
        db_user = db.query(User).filter(User.id == as_uuid(uid)).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        db_user.full_name = new_name
        db.commit()

    try:
        db.add(
            AuditEvent(
                actor_id=as_uuid(user_id_of(current_user)),
                entity_type="user",
                entity_id=user_id_of(current_user),
                action="user.profile_updated",
                details={"full_name": new_name},
            )
        )
        db.commit()
    except Exception:
        db.rollback()

    return {
        "id": user_id_of(current_user),
        "email": user_email_of(current_user),
        "full_name": new_name,
        "role": user_role_of(current_user),
        "is_active": True,
    }
