from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.models.user import User, UserRole
from typing import Optional
import uuid

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def as_uuid(value):
    """Coerce a value to uuid.UUID for binding against UUID columns."""
    if isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return value


def user_id_of(user) -> str:
    return user["id"] if isinstance(user, dict) else str(user.id)


def user_role_of(user) -> str:
    if isinstance(user, dict):
        return user.get("role", "applicant")
    return user.role.value if hasattr(user.role, "value") else str(user.role)


def user_email_of(user) -> str:
    return user["email"] if isinstance(user, dict) else user.email


def user_full_name_of(user) -> str:
    return user["full_name"] if isinstance(user, dict) else user.full_name


def user_is_active(user) -> bool:
    return user.get("is_active", True) if isinstance(user, dict) else bool(user.is_active)


def get_db_safe():
    """Yield a DB session, or None if the database is unreachable."""
    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
    except Exception:
        yield None
        return
    try:
        yield db
    finally:
        db.close()


def get_current_user(db: Session = Depends(get_db_safe), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Try the database first.
    if db is not None:
        try:
            user = db.query(User).filter(User.id == as_uuid(user_id)).first()
            if user is not None:
                if not user.is_active:
                    raise HTTPException(status_code=400, detail="Inactive user")
                return user
        except HTTPException:
            raise
        except SQLAlchemyError:
            # Database unavailable or schema mismatch - fall through to the
            # in-memory store instead of failing the whole request.
            pass

    # Fallback to the in-memory store.
    from app.api.v1.endpoints import auth as auth_module

    in_memory = auth_module.USERS_DB.get(user_id)
    if in_memory is not None:
        if not in_memory.get("is_active", True):
            raise HTTPException(status_code=400, detail="Inactive user")
        return in_memory

    raise credentials_exception


def get_current_active_user(current_user=Depends(get_current_user)):
    if not user_is_active(current_user):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user=Depends(get_current_user)):
        role = user_role_of(current_user)
        allowed = {r.value if hasattr(r, "value") else str(r) for r in self.allowed_roles}
        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted",
            )
        return current_user


require_admin = RoleChecker([UserRole.ADMIN])
require_reviewer = RoleChecker([UserRole.ADMIN, UserRole.REVIEWER])
require_any = RoleChecker([UserRole.ADMIN, UserRole.REVIEWER, UserRole.APPLICANT])
