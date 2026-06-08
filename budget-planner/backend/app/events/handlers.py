"""Event handlers (phản ứng với domain event).

Tách biệt khỏi nơi phát event — đây là điểm cộng của Event-Driven Architecture:
thêm/bớt handler không đụng vào logic tạo giao dịch.
"""

from __future__ import annotations

import logging

from app.core import db
from app.events.bus import event_bus
from app.events.events import BudgetExceeded, TransactionCreated
from app.models import AuditLog

logger = logging.getLogger(__name__)


def audit_transaction_created(event: TransactionCreated) -> None:
    """Ghi audit log mỗi khi có giao dịch mới."""
    session = db.SessionLocal()
    try:
        session.add(
            AuditLog(
                space_id=event.space_id,
                action="transaction.created",
                target=event.transaction_id,
            )
        )
        session.commit()
    finally:
        session.close()


def notify_budget_exceeded(event: BudgetExceeded) -> None:
    """Thông báo khi vượt ngân sách (Phase 0: log; sau gắn email/in-app)."""
    logger.warning(
        "Vượt ngân sách: space=%s category=%s chi=%.0f/%.0f",
        event.space_id,
        event.category_name,
        event.spent_amount,
        event.limit_amount,
    )


def register_handlers() -> None:
    """Đăng ký toàn bộ handler vào bus dùng chung."""
    event_bus.subscribe(TransactionCreated, audit_transaction_created)
    event_bus.subscribe(BudgetExceeded, notify_budget_exceeded)
