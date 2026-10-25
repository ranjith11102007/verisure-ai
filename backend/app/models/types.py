"""Reusable SQLAlchemy column types.

``CoercingUuid`` behaves like a native UUID column (values are stored as real
UUIDs on PostgreSQL and CHAR(32) on SQLite) but tolerates string inputs when
binding.  Several endpoints receive identifiers as path parameters, which
FastAPI hands over as strings; without coercion SQLite rejects them because
its UUID processor expects a ``uuid.UUID`` instance.
"""

import uuid

from sqlalchemy import Uuid
from sqlalchemy.types import TypeDecorator


class CoercingUuid(TypeDecorator):
    impl = Uuid
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return uuid.UUID(value)
            except (ValueError, AttributeError):
                return value
        return value
