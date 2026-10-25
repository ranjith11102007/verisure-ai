from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.api.deps import get_current_user
from pydantic import BaseModel, EmailStr
from app.core.config import settings
import uuid
from datetime import datetime

router = APIRouter()

# In-memory fallback store
USERS_DB = {}
EMAIL_TO_ID = {}


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    if len(user_data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    email_lower = user_data.email.lower()
    
    # Try DB first, fallback to in-memory
    try:
        existing = db.query(User).filter(User.email == email_lower).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user = User(
            email=email_lower,
            password_hash=get_password_hash(user_data.password),
            full_name=user_data.full_name.strip(),
            role=UserRole.APPLICANT,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        access_token = create_access_token(subject=str(user.id))
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception:
        # Fallback to in-memory
        if email_lower in EMAIL_TO_ID:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_id = str(uuid.uuid4())
        USERS_DB[user_id] = {
            "id": user_id,
            "email": email_lower,
            "password_hash": get_password_hash(user_data.password),
            "full_name": user_data.full_name.strip(),
            "role": "applicant",
            "is_active": True,
        }
        EMAIL_TO_ID[email_lower] = user_id
        access_token = create_access_token(subject=user_id)
        return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    email_lower = user_data.email.lower()
    try:
        user = db.query(User).filter(User.email == email_lower).first()
        if not user or not verify_password(user_data.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Account is inactive")
        access_token = create_access_token(subject=str(user.id))
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception:
        if email_lower not in EMAIL_TO_ID:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        user_id = EMAIL_TO_ID[email_lower]
        user = USERS_DB.get(user_id)
        if not user or not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        if not user.get("is_active", True):
            raise HTTPException(status_code=400, detail="Account is inactive")
        access_token = create_access_token(subject=user_id)
        return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user = Depends(get_current_user)):
    # Handle both DB user object and dict
    if isinstance(current_user, dict):
        return {
            "id": current_user["id"],
            "email": current_user["email"],
            "full_name": current_user["full_name"],
            "role": current_user["role"],
            "is_active": current_user.get("is_active", True),
        }
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        "is_active": current_user.is_active,
    }


@router.post("/logout")
def logout(current_user = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
