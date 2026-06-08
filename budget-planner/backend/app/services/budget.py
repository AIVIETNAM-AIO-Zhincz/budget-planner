"""Tính chi tiêu & tiến độ ngân sách (hàm thuần, dùng cho router + overflow check).

Khớp ngân sách với giao dịch theo **tên danh mục**: ``Budget.category_id`` →
``Category.name`` so với ``Transaction.category_name`` (giao dịch lưu danh mục
dạng text do AI gợi ý).
"""

from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Budget, Category, Transaction


def resolve_category_name(db: Session, space_id: str, category_id: str | None) -> str | None:
    """Trả tên danh mục theo (space_id, category_id); None nếu không có."""
    if not category_id:
        return None
    stmt = select(Category.name).where(Category.id == category_id, Category.space_id == space_id)
    return db.scalar(stmt)


def _period_range(period: str) -> tuple[date, date]:
    """Đổi 'YYYY-MM' thành khoảng [đầu tháng, đầu tháng sau) — không phụ thuộc DB."""
    year, month = int(period[:4]), int(period[5:7])
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start, end


def spent_for_period(db: Session, space_id: str, category_name: str | None, period: str) -> float:
    """Tổng chi (expense) trong kỳ ``period`` theo danh mục; 0.0 nếu không khớp."""
    if not category_name:
        return 0.0
    start, end = _period_range(period)
    stmt = select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
        Transaction.space_id == space_id,
        Transaction.type == "expense",
        Transaction.category_name == category_name,
        Transaction.date >= start,
        Transaction.date < end,
    )
    return float(db.scalar(stmt) or 0.0)


def budget_status(db: Session, budget: Budget) -> tuple[float, float, float]:
    """Trả (spent, remaining, percent) cho một ngân sách."""
    name = resolve_category_name(db, budget.space_id, budget.category_id)
    spent = spent_for_period(db, budget.space_id, name, budget.period)
    remaining = budget.limit_amount - spent
    percent = (spent / budget.limit_amount * 100) if budget.limit_amount > 0 else 0.0
    return spent, remaining, percent
