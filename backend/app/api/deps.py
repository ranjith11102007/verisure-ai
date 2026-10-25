from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.models.user import User, UserRole
from typing import Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db_safe():
    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    except Exception:
        yield None


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
    
    # Try DB first
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is not None:
            if not user.is_active:
                raise HTTPException(status_code=400, detail="Inactive user")
            return user
    except Exception:
        pass
    
    # Fallback to in-memory
    try:
        from app.api.v1.endpoints import auth as auth_module
        if user_id in auth_module.USERS_DB:
            user = auth_module.USERS_DB[user_id]
            if not user.get("is_active", True):
                raise HTTPException(status_code=400, detail="Inactive user")
            return user
    except Exception:
        pass
    
    raise credentials_exception


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user


require_admin = RoleChecker([UserRole.ADMIN])
require_reviewer = RoleChecker([UserRole.ADMIN, UserRole.REVIEWER])
require_any = RoleChecker([UserRole.ADMIN, UserRole.REVIEWER, UserRole.APPLICANT])
