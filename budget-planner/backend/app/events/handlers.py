"""Event handlers (phản ứng với domain event).

Tách biệt khỏi nơi phát event — đây là điểm cộng của Event-Driven Architecture:
thêm/bớt handler không đụng vào logic tạo giao dịch.
"""

from __future__ import annotations

import logging

from app.api._common import write_audit
from app.core import db
from app.core.format import format_vnd as _fmt
from app.events.bus import event_bus
from app.events.events import BudgetExceeded, TransactionCreated
from app.services.notification import add_notification

logger = logging.getLogger(__name__)


def audit_transaction_created(event: TransactionCreated) -> None:
    """Ghi audit log mỗi khi có giao dịch mới."""
    session = db.SessionLocal()
    try:
        write_audit(
            session,
            space_id=event.space_id,
            actor_id=event.user_id or None,
            action="transaction.created",
            target=event.transaction_id,
        )
        session.commit()
    finally:
        session.close()


def notify_budget_exceeded(event: BudgetExceeded) -> None:
    """Vượt ngân sách → log + lưu thông báo in-app (session riêng của handler)."""
    logger.warning(
        "Vượt ngân sách: space=%s category=%s chi=%.0f/%.0f",
        event.space_id,
        event.category_name,
        event.spent_amount,
        event.limit_amount,
    )
    session = db.SessionLocal()
    try:
        add_notification(
            session,
            event.space_id,
            "budget.exceeded",
            f"Vượt ngân sách {event.category_name} ({event.period}): "
            f"đã chi {_fmt(event.spent_amount)}/{_fmt(event.limit_amount)} đ",
        )
        session.commit()
    finally:
        session.close()


def register_handlers() -> None:
    """Đăng ký toàn bộ handler vào bus dùng chung."""
    event_bus.subscribe(TransactionCreated, audit_transaction_created)
    event_bus.subscribe(BudgetExceeded, notify_budget_exceeded)
