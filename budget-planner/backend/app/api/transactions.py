"""Router Transactions (event-driven, lọc theo space_id)."""

from __future__ import annotations

from datetime import date as date_type

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.events.bus import event_bus
from app.events.events import BudgetExceeded, TransactionCreated
from app.models import Budget, Category, Transaction
from app.rbac import get_current_space_id
from app.schemas.transaction import TransactionCreate, TransactionRead
from app.services.budget import spent_for_period
from app.services.categorizer import suggest_category

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _check_budget_overflow(db: Session, tx: Transaction) -> None:
    """Sau khi tạo chi tiêu, nếu tổng chi kỳ này vượt hạn mức danh mục →
    phát ``BudgetExceeded`` để handler cảnh báo. Khớp ngân sách theo tên danh mục.
    """
    if tx.type != "expense":
        return
    period = tx.date.strftime("%Y-%m")
    category = db.scalar(
        select(Category).where(Category.space_id == tx.space_id, Category.name == tx.category_name)
    )
    if category is None:
        return
    budget = db.scalar(
        select(Budget).where(
            Budget.space_id == tx.space_id,
            Budget.category_id == category.id,
            Budget.period == period,
        )
    )
    if budget is None:
        return
    spent = spent_for_period(db, tx.space_id, tx.category_name, period)
    if spent > budget.limit_amount:
        event_bus.publish(
            BudgetExceeded(
                space_id=tx.space_id,
                category_name=tx.category_name,
                period=period,
                limit_amount=budget.limit_amount,
                spent_amount=spent,
            )
        )


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Transaction:
    """Tạo giao dịch. Nếu thiếu ``category_name`` → AI gợi ý từ ``note``.

    Sau khi lưu, phát event ``TransactionCreated`` để các handler (audit,
    kiểm tra ngân sách...) xử lý độc lập.
    """
    category = payload.category_name or suggest_category(payload.note)
    tx = Transaction(
        space_id=space_id,
        amount=payload.amount,
        type=payload.type,
        category_name=category,
        note=payload.note,
        wallet_id=payload.wallet_id,
        date=payload.date or date_type.today(),
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    event_bus.publish(
        TransactionCreated(
            transaction_id=tx.id,
            space_id=tx.space_id,
            amount=tx.amount,
            type=tx.type,
            category_name=tx.category_name,
            note=tx.note,
        )
    )
    _check_budget_overflow(db, tx)
    return tx


@router.get("", response_model=list[TransactionRead])
def list_transactions(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> list[Transaction]:
    """Liệt kê giao dịch của không gian hiện tại (cô lập theo space_id)."""
    stmt = select(Transaction).where(Transaction.space_id == space_id)
    return list(db.scalars(stmt))
