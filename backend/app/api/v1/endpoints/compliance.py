from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, user_id_of, user_role_of, as_uuid
from app.models.user import User
from app.models.application import Application
from app.models.document import Document
from app.models.compliance import (
    ComplianceRule,
    ComplianceRun,
    ComplianceFinding,
    Severity,
    FindingDisposition,
)
from app.models.audit import AuditEvent
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class RuleCreate(BaseModel):
    rule_code: str
    name: str
    description: Optional[str] = None
    applicable_category: Optional[str] = None
    severity: str = "medium"
    source_ref: Optional[str] = None


class FindingUpdate(BaseModel):
    disposition: str
    review_notes: Optional[str] = None


def serialize_rule(r: ComplianceRule) -> dict:
    return {
        "id": str(r.id),
        "rule_code": r.rule_code,
        "name": r.name,
        "description": r.description,
        "applicable_category": r.applicable_category,
        "severity": r.severity.value if hasattr(r.severity, "value") else str(r.severity),
        "active": r.active,
        "version": r.version,
        "source_ref": r.source_ref,
        "created_at": r.created_at.isoformat(),
    }


def serialize_finding(f: ComplianceFinding) -> dict:
    return {
        "id": str(f.id),
        "run_id": str(f.run_id),
        "rule_code": f.rule.rule_code if f.rule else None,
        "rule_name": f.rule.name if f.rule else None,
        "severity": f.rule.severity.value
        if f.rule and hasattr(f.rule.severity, "value")
        else None,
        "affected_field": f.affected_field,
        "reason": f.reason,
        "recommended_action": f.recommended_action,
        "disposition": f.disposition.value
        if hasattr(f.disposition, "value")
        else str(f.disposition),
        "review_notes": f.review_notes,
        "created_at": f.created_at.isoformat(),
    }


@router.get("/rules")
def list_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rules = db.query(ComplianceRule).order_by(ComplianceRule.rule_code.asc()).all()
    return {"rules": [serialize_rule(r) for r in rules], "total": len(rules)}


@router.post("/rules")
def create_rule(
    payload: RuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_role_of(current_user) not in {"admin", "reviewer"}:
        raise HTTPException(status_code=403, detail="Operation not permitted")
    if db.query(ComplianceRule).filter(ComplianceRule.rule_code == payload.rule_code).first():
        raise HTTPException(status_code=400, detail="Rule code already exists")

    try:
        severity = Severity(payload.severity)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid severity")

    rule = ComplianceRule(
        rule_code=payload.rule_code,
        name=payload.name,
        description=payload.description,
        applicable_category=payload.applicable_category,
        severity=severity,
        source_ref=payload.source_ref,
        created_by=as_uuid(user_id_of(current_user)),
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return serialize_rule(rule)


@router.post("/run/{application_id}")
def run_compliance(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Evaluate the active rule set against an application and its documents."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    role = user_role_of(current_user)
    if role == "applicant" and str(app.applicant_id) != user_id_of(current_user):
        raise HTTPException(status_code=403, detail="Access denied")

    documents = db.query(Document).filter(Document.application_id == app.id).all()
    rules = (
        db.query(ComplianceRule)
        .filter(ComplianceRule.active == True)  # noqa: E712
        .all()
    )

    run = ComplianceRun(
        application_id=app.id,
        triggered_by=as_uuid(user_id_of(current_user)),
        rule_set_version="1",
        status="completed",
        executed_at=datetime.utcnow(),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    details = app.applicant_details or {}
    findings_created = 0

    for rule in rules:
        code = rule.rule_code.upper()
        reason = None
        field = None
        action = None

        if code.startswith("DOC") or "document" in (rule.name or "").lower():
            if not documents:
                reason = "No supporting documents have been uploaded for this application."
                field = "documents"
                action = "Upload at least one supporting document (PDF/PNG/JPEG)."
            elif code.endswith("002") and len(documents) < 2:
                reason = "This rule requires at least two supporting documents."
                field = "documents"
                action = "Upload an additional supporting document."

        if reason is None and "organization" in (rule.name or "").lower():
            if not (details.get("registration_number") or details.get("registration_id")):
                reason = "Organization registration number is missing from applicant details."
                field = "registration_number"
                action = "Provide the official organization registration number."

        if reason is None and "contact" in (rule.name or "").lower():
            if not details.get("contact_email"):
                reason = "A verifiable institutional contact email is not on record."
                field = "contact_email"
                action = "Add an institutional contact email in applicant details."

        if reason:
            db.add(
                ComplianceFinding(
                    run_id=run.id,
                    rule_id=rule.id,
                    affected_field=field,
                    reason=reason,
                    recommended_action=action,
                    disposition=FindingDisposition.PENDING,
                )
            )
            findings_created += 1

    db.commit()

    try:
        db.add(
            AuditEvent(
                actor_id=as_uuid(user_id_of(current_user)),
                entity_type="compliance_run",
                entity_id=str(run.id),
                action="compliance.executed",
                details={"application_id": str(app.id), "findings": findings_created},
            )
        )
        db.commit()
    except Exception:
        db.rollback()

    return {
        "run_id": str(run.id),
        "application_id": str(app.id),
        "rules_evaluated": len(rules),
        "findings_created": findings_created,
        "executed_at": run.executed_at.isoformat(),
    }


@router.get("/findings")
def list_findings(
    application_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ComplianceFinding).join(
        ComplianceRun, ComplianceFinding.run_id == ComplianceRun.id
    )
    role = user_role_of(current_user)
    if role == "applicant":
        app_ids = [
            a.id
            for a in db.query(Application.id)
            .filter(Application.applicant_id == as_uuid(user_id_of(current_user)))
            .all()
        ]
        if not app_ids:
            return {"findings": [], "total": 0}
        query = query.filter(ComplianceRun.application_id.in_(app_ids))

    if application_id:
        query = query.filter(ComplianceRun.application_id == application_id)

    findings = query.order_by(ComplianceFinding.created_at.desc()).all()
    return {"findings": [serialize_finding(f) for f in findings], "total": len(findings)}


@router.patch("/findings/{finding_id}")
def update_finding(
    finding_id: str,
    payload: FindingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_role_of(current_user) not in {"admin", "reviewer"}:
        raise HTTPException(status_code=403, detail="Operation not permitted")

    finding = db.query(ComplianceFinding).filter(ComplianceFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    try:
        finding.disposition = FindingDisposition(payload.disposition)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid disposition")

    finding.review_notes = payload.review_notes
    finding.reviewed_by = as_uuid(user_id_of(current_user))
    finding.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(finding)
    return serialize_finding(finding)
