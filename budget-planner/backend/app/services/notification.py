"""Tạo thông báo (dùng chung handler event lẫn endpoint)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Notification


def add_notification(db: Session, space_id: str, type_: str, message: str) -> None:
    """Thêm một thông báo vào session (KHÔNG commit — để caller quyết định)."""
    db.add(Notification(space_id=space_id, type=type_, message=message))
