"""Helper dùng chung cho tầng API: lấy bản ghi (404), ghi audit, lỗi chuyển tiền."""

from __future__ import annotations

from typing import NoReturn, TypeVar

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import AuditLog

T = TypeVar("T")


def get_owned_or_404(
    db: Session, model: type[T], obj_id: str, space_id: str, detail: str = "Không tìm thấy"
) -> T:
    """Lấy bản ghi thuộc đúng không gian; raise 404 nếu không có / khác space."""
    obj = db.get(model, obj_id)
    if obj is None or obj.space_id != space_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return obj


def write_audit(
    db: Session, space_id: str, actor_id: str | None, action: str, target: str = ""
) -> None:
    """Thêm một bản ghi audit vào session (không commit — caller quyết)."""
    db.add(AuditLog(space_id=space_id, actor_id=actor_id, action=action, target=target))


def raise_transfer_error(err: ValueError, *, same_msg: str) -> NoReturn:
    """Ánh xạ lỗi từ ``transfer_funds`` sang HTTPException (giữ status code cũ)."""
    if str(err) == "same_wallet":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=same_msg) from err
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy ví") from err
