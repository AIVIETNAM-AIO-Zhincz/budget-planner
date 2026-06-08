"""Khởi tạo SQLAlchemy: engine, session, Base."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# SQLite cần connect_args đặc biệt khi dùng nhiều thread (uvicorn/test).
_connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base class cho mọi ORM model."""


def get_db() -> Iterator[Session]:
    """Dependency FastAPI: cấp một session DB và đóng sau khi xong."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
