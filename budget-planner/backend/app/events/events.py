"""Định nghĩa các domain event (Event-Driven Architecture).

Event là dữ liệu bất biến mô tả "việc đã xảy ra". Producer phát event, các
handler đăng ký xử lý độc lập — giảm coupling giữa các phần (giao dịch, ngân
sách, thông báo, audit). Phase 0 dùng bus in-process; thiết kế giữ nguyên khi
chuyển sang message broker thật (Kafka/RabbitMQ).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


def _now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class Event:
    """Lớp cơ sở cho mọi domain event."""

    occurred_at: datetime = field(default_factory=_now)


@dataclass(frozen=True)
class TransactionCreated(Event):
    """Phát khi một giao dịch vừa được tạo."""

    transaction_id: str = ""
    space_id: str = ""
    amount: float = 0.0
    type: str = "expense"
    category_name: str = ""
    note: str = ""


@dataclass(frozen=True)
class BudgetExceeded(Event):
    """Phát khi chi tiêu vượt hạn mức ngân sách của một danh mục."""

    space_id: str = ""
    category_name: str = ""
    period: str = ""
    limit_amount: float = 0.0
    spent_amount: float = 0.0
