"""Sinh giao dịch định kỳ: tính kỳ kế tiếp + catch-up tới hôm nay.

Hàm thuần `advance` + `run_due` (nhận `today`) để test xác định.
"""

from __future__ import annotations

import calendar
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import RecurringRule, Transaction
from app.services.wallet import apply_effect


def advance(d: date, frequency: str) -> date:
    """Ngày kế tiếp theo tần suất: daily +1, weekly +7, monthly +1 tháng (clamp cuối tháng)."""
    if frequency == "daily":
        return d + timedelta(days=1)
    if frequency == "weekly":
        return d + timedelta(days=7)
    month = d.month + 1
    year = d.year
    if month > 12:
        month = 1
        year += 1
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(d.day, last_day))


def run_due(db: Session, space_id: str, today: date) -> int:
    """Sinh giao dịch cho mọi rule active tới `today`; trả số giao dịch đã tạo."""
    rules = list(
        db.scalars(
            select(RecurringRule).where(
                RecurringRule.space_id == space_id, RecurringRule.active.is_(True)
            )
        )
    )
    created = 0
    for rule in rules:
        while rule.next_run <= today and (rule.end_date is None or rule.next_run <= rule.end_date):
            db.add(
                Transaction(
                    space_id=space_id,
                    amount=rule.amount,
                    type=rule.type,
                    category_name=rule.category_name,
                    note=rule.name,
                    wallet_id=rule.wallet_id,
                    date=rule.next_run,
                )
            )
            apply_effect(db, space_id, rule.wallet_id, rule.type, rule.amount)
            rule.next_run = advance(rule.next_run, rule.frequency)
            created += 1
        if rule.end_date is not None and rule.next_run > rule.end_date:
            rule.active = False
    db.commit()
    return created
