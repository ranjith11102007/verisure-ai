from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.application import Application, ApplicationStatus, ApplicationStatusHistory
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter()


class ApplicationCreate(BaseModel):
    organization_name: str
    application_category: str
    applicant_details: dict = {}


class ApplicationResponse(BaseModel):
    id: str
    reference_no: str
    organization_name: str
    application_category: str
    status: str
    submitted_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


def generate_ref_no(db: Session) -> str:
    count = db.query(Application).count()
    return f"VSA-{datetime.utcnow().year}-{count + 1:04d}"


@router.get("/")
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 20,
):
    query = db.query(Application)
    if current_user.role.value == "applicant":
        query = query.filter(Application.applicant_id == current_user.id)
    elif current_user.role.value == "reviewer":
        query = query.filter(
            (Application.assigned_reviewer_id == current_user.id) | 
            (Application.status == ApplicationStatus.SUBMITTED)
        )
    
    if status_filter:
        try:
            query = query.filter(Application.status == ApplicationStatus(status_filter))
        except:
            pass
    
    total = query.count()
    apps = query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "applications": [
            {
                "id": str(app.id),
                "reference_no": app.reference_no,
                "organization_name": app.organization_name,
                "application_category": app.application_category,
                "status": app.status.value,
                "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
                "created_at": app.created_at.isoformat(),
            }
            for app in apps
        ],
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
    ref_no = generate_ref_no(db)
    app = Application(
        reference_no=ref_no,
        applicant_id=current_user.id,
        organization_name=data.organization_name,
        application_category=data.application_category,
        applicant_details=data.applicant_details,
        status=ApplicationStatus.DRAFT,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    
    return {
        "id": str(app.id),
        "reference_no": app.reference_no,
        "organization_name": app.organization_name,
        "application_category": app.application_category,
        "status": app.status.value,
        "created_at": app.created_at.isoformat(),
    }


@router.get("/{application_id}")
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if current_user.role.value == "applicant" and app.applicant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role.value == "reviewer" and app.assigned_reviewer_id != current_user.id and app.status != ApplicationStatus.SUBMITTED:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "id": str(app.id),
        "reference_no": app.reference_no,
        "organization_name": app.organization_name,
        "application_category": app.application_category,
        "status": app.status.value,
        "applicant_details": app.applicant_details,
        "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
        "created_at": app.created_at.isoformat(),
        "updated_at": app.updated_at.isoformat(),
    }
