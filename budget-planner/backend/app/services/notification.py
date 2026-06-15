"""Tạo thông báo (dùng chung handler event lẫn endpoint)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Notification, Space

# Map loại thông báo → cờ bật/tắt trên Space (per-space).
_NOTIFY_FLAG = {
    "budget.exceeded": "notify_budget",
    "member.invited": "notify_member",
    "recurring.ran": "notify_recurring",
}


def add_notification(db: Session, space_id: str, type_: str, message: str) -> None:
    """Thêm một thông báo vào session (KHÔNG commit — để caller quyết định).

    Tôn trọng cài đặt thông báo của không gian: nếu loại tương ứng bị tắt → bỏ qua.
    """
    flag = _NOTIFY_FLAG.get(type_)
    if flag is not None:
        space = db.get(Space, space_id)
        if space is not None and not getattr(space, flag):
            return
    db.add(Notification(space_id=space_id, type=type_, message=message))
