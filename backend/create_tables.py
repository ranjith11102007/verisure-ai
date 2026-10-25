"""Create all tables directly against the configured database.

Usage (local):
    set DATABASE_URL=postgresql+pg8000://...
    python create_tables.py

This exists because the alembic/versions folder has no migration scripts yet,
so `alembic upgrade head` is a no-op.
"""
import os
import ssl
import sys

from sqlalchemy import create_engine

# Import every model so they register on Base.metadata
from app.core.database import Base
from app import models  # noqa: F401


def main() -> int:
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL is not set", file=sys.stderr)
        return 1

    connect_args = {}
    if url.startswith("postgresql+pg8000"):
        connect_args["ssl_context"] = ssl.create_default_context()

    engine = create_engine(url, connect_args=connect_args)
    Base.metadata.create_all(bind=engine)

    from sqlalchemy import inspect

    tables = sorted(inspect(engine).get_table_names())
    print(f"Created/verified {len(tables)} tables:")
    for t in tables:
        print(f"  - {t}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
