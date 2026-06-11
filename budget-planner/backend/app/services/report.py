"""Tổng hợp số liệu báo cáo theo khoảng thời gian (truy vấn gộp)."""

from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Category, Transaction


def _conds(space_id: str, start: date | None, end: date | None) -> list:
    """Điều kiện lọc: theo space + khoảng ngày (nếu có)."""
    conds = [Transaction.space_id == space_id]
    if start is not None:
        conds.append(Transaction.date >= start)
    if end is not None:
        conds.append(Transaction.date <= end)
    return conds


def build_summary(db: Session, space_id: str, start: date | None, end: date | None) -> dict:
    """Tổng hợp: tổng thu/chi, theo danh mục (chi), theo ngày."""
    conds = _conds(space_id, start, end)

    def total(tx_type: str) -> float:
        stmt = select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
            *conds, Transaction.type == tx_type
        )
        return float(db.scalar(stmt) or 0.0)

    income, expense = total("income"), total("expense")

    cat_rows = db.execute(
        select(Transaction.category_name, func.sum(Transaction.amount))
        .where(*conds, Transaction.type == "expense")
        .group_by(Transaction.category_name)
        .order_by(func.sum(Transaction.amount).desc())
    ).all()
    by_category = [{"name": name or "Khác", "amount": float(amt)} for name, amt in cat_rows]

    # Chi theo mức cần thiết: map giao dịch → need_level của danh mục (theo tên + space).
    # Giao dịch không khớp danh mục nào → coi như 'optional'.
    need_col = func.coalesce(Category.need_level, "optional")
    nl_rows = db.execute(
        select(need_col, func.sum(Transaction.amount))
        .select_from(Transaction)
        .outerjoin(
            Category,
            (Category.name == Transaction.category_name) & (Category.space_id == space_id),
        )
        .where(*conds, Transaction.type == "expense")
        .group_by(need_col)
        .order_by(func.sum(Transaction.amount).desc())
    ).all()
    by_need_level = [{"need_level": nl, "amount": float(amt)} for nl, amt in nl_rows]

    day_rows = db.execute(
        select(Transaction.date, Transaction.type, func.sum(Transaction.amount))
        .where(*conds)
        .group_by(Transaction.date, Transaction.type)
    ).all()
    days: dict[date, dict] = {}
    for d, tx_type, amt in day_rows:
        entry = days.setdefault(d, {"date": d, "income": 0.0, "expense": 0.0})
        entry[tx_type] = float(amt)
    by_day = [days[k] for k in sorted(days)]

    return {
        "total_income": income,
        "total_expense": expense,
        "balance": income - expense,
        "by_category": by_category,
        "by_need_level": by_need_level,
        "by_day": by_day,
    }


def build_annual_summary(db: Session, space_id: str, year: int) -> dict:
    """Tổng hợp 12 tháng của một năm: thu/chi mỗi tháng + số dư luỹ kế.

    Tái dùng ``build_summary`` (theo ngày) rồi gom theo tháng — không phụ thuộc DB.
    """
    summary = build_summary(db, space_id, date(year, 1, 1), date(year, 12, 31))
    months = {
        f"{year:04d}-{m:02d}": {"month": f"{year:04d}-{m:02d}", "income": 0.0, "expense": 0.0}
        for m in range(1, 13)
    }
    for day in summary["by_day"]:
        key = day["date"].strftime("%Y-%m")
        if key in months:
            months[key]["income"] += day["income"]
            months[key]["expense"] += day["expense"]

    result = [months[f"{year:04d}-{m:02d}"] for m in range(1, 13)]
    balance = 0.0
    for month in result:
        balance += month["income"] - month["expense"]
        month["balance"] = balance
    return {"year": year, "months": result}


def transactions_for_export(
    db: Session, space_id: str, start: date | None, end: date | None
) -> list[Transaction]:
    """Giao dịch trong khoảng (để xuất CSV), sắp theo ngày."""
    stmt = select(Transaction).where(*_conds(space_id, start, end)).order_by(Transaction.date)
    return list(db.scalars(stmt))
