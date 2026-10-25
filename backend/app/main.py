from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1 import api_router
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent Application Validation, Document Authentication & Regulatory Compliance Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS - driven by environment variables
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    # Also accept any Vercel deployment/preview origin, so the frontend keeps
    # working if ALLOWED_ORIGINS was not configured on the host.
    allow_origin_regex=r"https://([a-z0-9-]+\.)*vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return a JSON 500 instead of a bare crash.

    Unhandled exceptions are normally produced by Starlette's outermost
    ``ServerErrorMiddleware``, which sits *outside* the CORS middleware.  The
    browser then reports a misleading CORS error and hides the real status.
    Handling the exception here keeps the response inside the CORS layer.
    """
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.on_event("startup")
def ensure_database_schema():
    """Create any missing tables on startup.

    This is a safety net for deployments where migrations were not run
    (e.g. Render free tier has no shell access).
    """
    try:
        from app.core.database import Base, engine
        from app import models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema verified/created successfully.")
    except Exception as exc:  # pragma: no cover - deployment safety net
        logger.error("Could not create database schema: %s", exc)
        return

    seed_default_data()


def seed_default_data():
    """Seed the default compliance rule set and the administrator account."""
    from app.core.database import SessionLocal
    from app.core.security import get_password_hash, verify_password
    from app.models.user import User, UserRole
    from app.models.compliance import ComplianceRule, Severity

    db = SessionLocal()
    try:
        # --- Administrator account ---
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL.lower()).first()
        if admin is None:
            admin = User(
                email=settings.ADMIN_EMAIL.lower(),
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                full_name=settings.ADMIN_FULL_NAME,
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
            logger.info("Seeded administrator account: %s", settings.ADMIN_EMAIL)
        elif (
            settings.ADMIN_PASSWORD
            and settings.ADMIN_PASSWORD != "change-this-password"
            and not verify_password(settings.ADMIN_PASSWORD, admin.password_hash)
        ):
            # An explicitly configured password always wins over a previously
            # seeded hash, so rotating ADMIN_PASSWORD on the host takes effect.
            admin.password_hash = get_password_hash(settings.ADMIN_PASSWORD)
            admin.is_active = True
            db.commit()
            logger.info("Administrator password updated from ADMIN_PASSWORD.")

        # --- Default compliance rules ---
        default_rules = [
            {
                "rule_code": "DOC-001",
                "name": "Supporting documents must be provided",
                "description": "Every application must include at least one supporting document.",
                "severity": Severity.HIGH,
                "source_ref": "Institutional Accreditation Standard 4.1",
            },
            {
                "rule_code": "DOC-002",
                "name": "Minimum document evidence set",
                "description": "Applications must include at least two supporting documents.",
                "severity": Severity.MEDIUM,
                "source_ref": "Institutional Accreditation Standard 4.2",
            },
            {
                "rule_code": "ORG-001",
                "name": "Organization registration number required",
                "description": "The applicant details must include the organization registration number.",
                "severity": Severity.CRITICAL,
                "source_ref": "Statutory Governance Circular 12/2024",
            },
            {
                "rule_code": "CONTACT-001",
                "name": "Verifiable institutional contact required",
                "description": "A contact email must be recorded for the applicant institution.",
                "severity": Severity.MEDIUM,
                "source_ref": "Statutory Governance Circular 12/2024",
            },
        ]

        created = 0
        for rule_data in default_rules:
            exists = (
                db.query(ComplianceRule)
                .filter(ComplianceRule.rule_code == rule_data["rule_code"])
                .first()
            )
            if exists is None:
                db.add(ComplianceRule(active=True, version=1, **rule_data))
                created += 1
        if created:
            db.commit()
            logger.info("Seeded %d default compliance rules.", created)
    except Exception as exc:  # pragma: no cover
        logger.error("Seeding failed: %s", exc)
        db.rollback()
    finally:
        db.close()


# Ensure uploads directory exists (ephemeral on free hosts)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "documents"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "temp"), exist_ok=True)
logger.warning("File uploads use ephemeral storage on this host - files may be lost on restart.")

# Mount uploads directory if exists
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/api/health")
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.APP_NAME, "version": "1.0.0"}


@app.get("/api/health/db")
async def database_health():
    """Report which database is active and why (never exposes credentials)."""
    from app.core import database
    from sqlalchemy import inspect, text

    backend = "sqlite" if database.IS_SQLITE else "postgresql"
    info = {
        "backend": backend,
        "configured_url_present": bool(database.CONFIGURED_DATABASE_URL),
        "active_url": database._redact(database.ACTIVE_DATABASE_URL),
        "is_fallback": bool(database.CONFIGURED_DATABASE_URL) and database.IS_SQLITE,
        "last_connection_error": (
            f"{type(database.LAST_CONNECTION_ERROR).__name__}: {database.LAST_CONNECTION_ERROR}"
            if database.LAST_CONNECTION_ERROR
            else None
        ),
    }
    try:
        with database.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            tables = inspect(conn).get_table_names()
        info["connected"] = True
        info["table_count"] = len(tables)
        info["tables"] = sorted(tables)
    except Exception as exc:
        info["connected"] = False
        info["error"] = f"{type(exc).__name__}: {exc}"
    return info


@app.get("/")
async def root():
    return {"message": "VeriSure AI API", "docs": "/api/docs"}
