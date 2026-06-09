"""Router Recurring (CRUD mẫu định kỳ + chạy sinh giao dịch)."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import AuditLog, Membership, RecurringRule
from app.rbac import get_current_space_id, require_min_role
from app.schemas.recurring import RecurringCreate, RecurringRead, RecurringUpdate
from app.services.notification import add_notification
from app.services.recurring import run_due

router = APIRouter(prefix="/recurring", tags=["recurring"])


def _get_owned(db: Session, rule_id: str, space_id: str) -> RecurringRule:
    """Lấy mẫu định kỳ thuộc đúng không gian; 404 nếu không có."""
    rule = db.get(RecurringRule, rule_id)
    if rule is None or rule.space_id != space_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy mẫu định kỳ"
        )
    return rule


@router.post(
    "",
    response_model=RecurringRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_min_role("member"))],
)
def create_recurring(
    payload: RecurringCreate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> RecurringRule:
    """Tạo mẫu định kỳ; `next_run` khởi tạo = `start_date`."""
    rule = RecurringRule(space_id=space_id, next_run=payload.start_date, **payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("", response_model=list[RecurringRead])
def list_recurring(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> list[RecurringRule]:
    """Liệt kê mẫu định kỳ của không gian hiện tại."""
    stmt = select(RecurringRule).where(RecurringRule.space_id == space_id)
    return list(db.scalars(stmt))


@router.post("/run")
def run_recurring(
    current: Membership = Depends(require_min_role("member")),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    """Sinh giao dịch cho các mẫu đến hạn (catch-up tới hôm nay)."""
    created = run_due(db, current.space_id, date.today())
    if created > 0:
        add_notification(
            db, current.space_id, "recurring.ran", f"Đã sinh {created} giao dịch định kỳ"
        )
        db.commit()
    return {"created": created}


@router.get("/{rule_id}", response_model=RecurringRead)
def get_recurring(
    rule_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> RecurringRule:
    """Xem một mẫu định kỳ."""
    return _get_owned(db, rule_id, space_id)


@router.patch(
    "/{rule_id}", response_model=RecurringRead, dependencies=[Depends(require_min_role("member"))]
)
def update_recurring(
    rule_id: str,
    payload: RecurringUpdate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> RecurringRule:
    """Cập nhật mẫu định kỳ (partial)."""
    rule = _get_owned(db, rule_id, space_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring(
    rule_id: str,
    db: Session = Depends(get_db),
    current: Membership = Depends(require_min_role("member")),
) -> None:
    """Xoá mẫu định kỳ + ghi audit."""
    rule = _get_owned(db, rule_id, current.space_id)
    db.delete(rule)
    db.add(
        AuditLog(
            space_id=current.space_id,
            actor_id=current.user_id,
            action="recurring.deleted",
            target=rule_id,
        )
    )
    db.commit()
