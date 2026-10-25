"""Database engine setup.

The application prefers a real PostgreSQL database (configured through
``DATABASE_URL``).  If that URL is missing or unreachable, it falls back to a
local SQLite file so the platform always starts and remains usable.  The
fallback is logged loudly so misconfiguration is never silent.
"""

import logging
from urllib.parse import urlsplit

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

SQLITE_URL = "sqlite:///./verisure.db"


def _redact(url: str) -> str:
    """Return a log-safe version of a database URL (no password)."""
    try:
        parts = urlsplit(url)
        host = parts.hostname or ""
        port = f":{parts.port}" if parts.port else ""
        db = (parts.path or "").lstrip("/")
        return f"{parts.scheme}://{parts.username or ''}@{host}{port}/{db}"
    except Exception:
        return "<unparseable url>"


def _make_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
    connect_args = {}
    # psycopg2 accepts connect_timeout; harmless for other libpq drivers.
    if "psycopg" in url or url.startswith("postgresql://"):
        connect_args["connect_timeout"] = 10
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args=connect_args,
    )


def _select_engine():
    candidates = []
    configured = (settings.DATABASE_URL or "").strip()
    if configured:
        candidates.append(("configured", configured))
    candidates.append(("sqlite-fallback", SQLITE_URL))

    last_error = None
    for label, url in candidates:
        try:
            engine = _make_engine(url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            if label == "sqlite-fallback" and configured:
                logger.error(
                    "Falling back to local SQLite: the configured DATABASE_URL (%s) "
                    "is unreachable. Last error: %s",
                    _redact(configured),
                    last_error,
                )
            elif label == "sqlite-fallback":
                logger.warning(
                    "DATABASE_URL is not set - using local SQLite at ./verisure.db. "
                    "Data will not persist across redeploys."
                )
            else:
                logger.info("Connected to database: %s", _redact(url))
            return engine, url, last_error, configured
        except Exception as exc:  # pragma: no cover - depends on environment
            last_error = exc
            logger.error("Database connection failed (%s): %s", _redact(url), exc)

    # SQLite should always work; if it does not, raise so the platform fails loudly.
    raise RuntimeError(f"Could not initialise any database engine: {last_error}")


engine, ACTIVE_DATABASE_URL, LAST_CONNECTION_ERROR, CONFIGURED_DATABASE_URL = _select_engine()
IS_SQLITE = ACTIVE_DATABASE_URL.startswith("sqlite")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
