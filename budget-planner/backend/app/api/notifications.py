"""Router Notifications (theo không gian, trạng thái đọc dùng chung)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Notification
from app.rbac import get_current_space_id
from app.schemas.notification import NotificationRead

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _get_owned(db: Session, notification_id: str, space_id: str) -> Notification:
    """Lấy thông báo thuộc đúng không gian; 404 nếu không có."""
    noti = db.get(Notification, notification_id)
    if noti is None or noti.space_id != space_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thông báo"
        )
    return noti


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> list[Notification]:
    """Liệt kê thông báo của không gian (mới nhất trước, tối đa 50)."""
    stmt = (
        select(Notification)
        .where(Notification.space_id == space_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return list(db.scalars(stmt))


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> dict[str, int]:
    """Số thông báo chưa đọc của không gian."""
    stmt = select(func.count()).where(
        Notification.space_id == space_id, Notification.is_read.is_(False)
    )
    return {"count": int(db.scalar(stmt) or 0)}


@router.post("/read-all")
def read_all(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> dict[str, int]:
    """Đánh dấu mọi thông báo chưa đọc là đã đọc."""
    result = db.execute(
        update(Notification)
        .where(Notification.space_id == space_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return {"updated": result.rowcount or 0}


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Notification:
    """Đánh dấu một thông báo là đã đọc."""
    noti = _get_owned(db, notification_id, space_id)
    noti.is_read = True
    db.commit()
    db.refresh(noti)
    return noti


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> None:
    """Xoá một thông báo."""
    noti = _get_owned(db, notification_id, space_id)
    db.delete(noti)
    db.commit()
