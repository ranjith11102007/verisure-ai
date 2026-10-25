from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.api.deps import get_current_user, user_id_of, user_role_of, as_uuid
from app.models.user import User
from app.models.application import Application, ApplicationStatus
from app.models.document import Document
from app.models.compliance import ComplianceRule, ComplianceRun, ComplianceFinding
from app.models.evidence import EvidenceRequest
from datetime import datetime

router = APIRouter()


@router.get("/summary")
def reports_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = user_role_of(current_user)
    uid = user_id_of(current_user)

    app_query = db.query(Application)
    if role == "applicant":
        app_query = app_query.filter(Application.applicant_id == as_uuid(uid))
    apps = app_query.all()

    by_status = {s.value: 0 for s in ApplicationStatus}
    by_category: dict[str, int] = {}
    monthly: dict[str, int] = {}

    for a in apps:
        by_status[a.status.value] = by_status.get(a.status.value, 0) + 1
        by_category[a.application_category] = (
            by_category.get(a.application_category, 0) + 1
        )
        key = a.created_at.strftime("%Y-%m")
        monthly[key] = monthly.get(key, 0) + 1

    if role == "applicant":
        app_ids = [a.id for a in apps]
        doc_count = (
            db.query(Document).filter(Document.application_id.in_(app_ids)).count()
            if app_ids
            else 0
        )
        run_ids = (
            [
                r.id
                for r in db.query(ComplianceRun.id)
                .filter(ComplianceRun.application_id.in_(app_ids))
                .all()
            ]
            if app_ids
            else []
        )
        finding_count = (
            db.query(ComplianceFinding)
            .filter(ComplianceFinding.run_id.in_(run_ids))
            .count()
            if run_ids
            else 0
        )
        evidence_count = (
            db.query(EvidenceRequest)
            .filter(EvidenceRequest.application_id.in_(app_ids))
            .count()
            if app_ids
            else 0
        )
    else:
        doc_count = db.query(Document).count()
        finding_count = db.query(ComplianceFinding).count()
        evidence_count = db.query(EvidenceRequest).count()

    total = len(apps)
    decided = by_status.get("approved", 0) + by_status.get("rejected", 0)
    approval_rate = (
        round(by_status.get("approved", 0) / decided * 100, 1) if decided else 0.0
    )

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "totals": {
            "applications": total,
            "documents": doc_count,
            "compliance_findings": finding_count,
            "evidence_requests": evidence_count,
            "compliance_rules": db.query(ComplianceRule).count(),
            "approval_rate": approval_rate,
        },
        "by_status": by_status,
        "by_category": by_category,
        "monthly_volume": dict(sorted(monthly.items())),
    }
