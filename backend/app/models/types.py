"""Reusable SQLAlchemy column types.

``CoercingUuid`` behaves like a native UUID column (values are stored as real
UUIDs on PostgreSQL and CHAR(32) on SQLite) but tolerates string inputs when
binding.  Several endpoints receive identifiers as path parameters, which
FastAPI hands over as strings; without coercion SQLite rejects them because
its UUID processor expects a ``uuid.UUID`` instance.

Strings that are not valid UUIDs are mapped to the nil UUID.  The nil UUID can
never match a real record, so lookups simply return "not found" instead of
raising a 500 error for malformed identifiers.
"""

import uuid

from sqlalchemy import Uuid
from sqlalchemy.types import TypeDecorator

NIL_UUID = uuid.UUID(int=0)


class CoercingUuid(TypeDecorator):
    impl = Uuid
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        if isinstance(value, str):
            try:
                return uuid.UUID(value)
            except (ValueError, AttributeError):
                # Malformed identifier: match nothing rather than erroring.
                return NIL_UUID
        return value
