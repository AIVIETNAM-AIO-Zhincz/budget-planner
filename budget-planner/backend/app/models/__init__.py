"""SQLAlchemy models cho Budget Planner (toàn bộ thực thể Phase 0).

Mọi thực thể nghiệp vụ gắn ``space_id`` để cô lập dữ liệu theo Không gian
(household) và làm nền cho phân quyền (RBAC) ở slice sau.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


def _uuid() -> str:
    """Sinh khoá chính dạng chuỗi UUID."""
    return str(uuid.uuid4())


def _now() -> datetime:
    """Thời điểm hiện tại (UTC, có timezone)."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), default="")
    name: Mapped[str] = mapped_column(String(255), default="")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class Space(Base):
    """Không gian/household — phạm vi chia sẻ dữ liệu tài chính."""

    __tablename__ = "spaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255))
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="VND")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class Membership(Base):
    """Liên kết User ↔ Space kèm vai trò (RBAC)."""

    __tablename__ = "memberships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    space_id: Mapped[str] = mapped_column(ForeignKey("spaces.id"), index=True)
    role: Mapped[str] = mapped_column(String(16), default="member")  # owner/admin/member/viewer
    status: Mapped[str] = mapped_column(String(16), default="active")


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    space_id: Mapped[str] = mapped_column(ForeignKey("spaces.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(32), default="cash")  # cash/bank/e-wallet
    balance: Mapped[float] = mapped_column(Float, default=0.0)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    space_id: Mapped[str] = mapped_column(ForeignKey("spaces.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    parent_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    type: Mapped[str] = mapped_column(String(8), default="expense")  # income/expense


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    space_id: Mapped[str] = mapped_column(ForeignKey("spaces.id"), index=True)
    wallet_id: Mapped[str | None] = mapped_column(ForeignKey("wallets.id"), nullable=True)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String(8), default="expense")  # income/expense
    # category_name: danh mục dạng text (AI gợi ý)
    category_name: Mapped[str] = mapped_column(String(255), default="")
    note: Mapped[str] = mapped_column(String(500), default="")
    date: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    space_id: Mapped[str] = mapped_column(ForeignKey("spaces.id"), index=True)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    period: Mapped[str] = mapped_column(String(7), default="")  # YYYY-MM
    limit_amount: Mapped[float] = mapped_column(Float, default=0.0)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    space_id: Mapped[str] = mapped_column(ForeignKey("spaces.id"), index=True)
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(64))
    target: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class RecurringRule(Base):
    """Mẫu giao dịch định kỳ (sinh giao dịch theo lịch)."""

    __tablename__ = "recurring_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    space_id: Mapped[str] = mapped_column(ForeignKey("spaces.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    amount: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String(8), default="expense")  # income/expense
    category_name: Mapped[str] = mapped_column(String(255), default="")
    wallet_id: Mapped[str | None] = mapped_column(ForeignKey("wallets.id"), nullable=True)
    frequency: Mapped[str] = mapped_column(String(8), default="monthly")  # daily/weekly/monthly
    start_date: Mapped[date] = mapped_column(Date)
    next_run: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class Notification(Base):
    """Thông báo trong app (theo không gian, trạng thái đọc dùng chung)."""

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    space_id: Mapped[str] = mapped_column(ForeignKey("spaces.id"), index=True)
    type: Mapped[str] = mapped_column(String(32))  # budget.exceeded/member.invited/recurring.ran
    message: Mapped[str] = mapped_column(String(500))
    is_read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


class Goal(Base):
    """Mục tiêu tiết kiệm (gắn một ví; tiến độ = số dư ví / target)."""

    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    space_id: Mapped[str] = mapped_column(ForeignKey("spaces.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    target_amount: Mapped[float] = mapped_column(Float)
    wallet_id: Mapped[str] = mapped_column(ForeignKey("wallets.id"))
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)


__all__ = [
    "User",
    "Space",
    "Membership",
    "Wallet",
    "Category",
    "Transaction",
    "Budget",
    "AuditLog",
    "RecurringRule",
    "Notification",
    "Goal",
]
