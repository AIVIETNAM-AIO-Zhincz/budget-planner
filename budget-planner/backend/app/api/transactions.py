"""Router Transactions (event-driven, lọc theo space_id)."""

from __future__ import annotations

from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.events.bus import event_bus
from app.events.events import BudgetExceeded, TransactionCreated
from app.models import AuditLog, Budget, Category, Membership, Transaction, User
from app.rbac import get_current_space_id, get_current_user, require_min_role
from app.schemas.transaction import TransactionCreate, TransactionRead, TransactionUpdate
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
    membership: Membership = Depends(require_min_role("member")),
) -> Transaction:
    """Tạo giao dịch (cần vai trò member+). Thiếu ``category_name`` → AI gợi ý.

    Sau khi lưu, phát event ``TransactionCreated`` để các handler (audit,
    kiểm tra ngân sách...) xử lý độc lập.
    """
    category = payload.category_name or suggest_category(payload.note)
    tx = Transaction(
        space_id=membership.space_id,
        user_id=membership.user_id,
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
            user_id=tx.user_id or "",
            amount=tx.amount,
            type=tx.type,
            category_name=tx.category_name,
            note=tx.note,
        )
    )
    _check_budget_overflow(db, tx)
    return tx


def _get_owned(db: Session, transaction_id: str, space_id: str) -> Transaction:
    """Lấy giao dịch thuộc đúng không gian; 404 nếu không có."""
    tx = db.get(Transaction, transaction_id)
    if tx is None or tx.space_id != space_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy giao dịch"
        )
    return tx


@router.get("", response_model=list[TransactionRead])
def list_transactions(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    type: str | None = Query(default=None, pattern="^(income|expense)$"),
    category: str | None = Query(default=None),
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    q: str | None = Query(default=None),
) -> list[Transaction]:
    """Liệt kê giao dịch (cô lập theo space_id), lọc theo loại/danh mục/tháng/tìm ghi chú."""
    stmt = select(Transaction).where(Transaction.space_id == space_id)
    if type:
        stmt = stmt.where(Transaction.type == type)
    if category:
        stmt = stmt.where(Transaction.category_name == category)
    if month:
        year, mon = int(month[:4]), int(month[5:7])
        start = date_type(year, mon, 1)
        end = date_type(year + 1, 1, 1) if mon == 12 else date_type(year, mon + 1, 1)
        stmt = stmt.where(Transaction.date >= start, Transaction.date < end)
    if q:
        stmt = stmt.where(Transaction.note.ilike(f"%{q}%"))
    stmt = stmt.order_by(Transaction.date.desc())
    return list(db.scalars(stmt))


@router.get("/{transaction_id}", response_model=TransactionRead)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Transaction:
    """Xem một giao dịch (cô lập theo space_id)."""
    return _get_owned(db, transaction_id, space_id)


@router.patch(
    "/{transaction_id}",
    response_model=TransactionRead,
    dependencies=[Depends(require_min_role("member"))],
)
def update_transaction(
    transaction_id: str,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Transaction:
    """Cập nhật giao dịch (member+). Nếu là chi → kiểm lại vượt ngân sách."""
    tx = _get_owned(db, transaction_id, space_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tx, field, value)
    db.commit()
    db.refresh(tx)
    _check_budget_overflow(db, tx)
    return tx


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_min_role("member"))],
)
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> None:
    """Xoá giao dịch (member+) + ghi audit log."""
    tx = _get_owned(db, transaction_id, space_id)
    db.delete(tx)
    db.add(
        AuditLog(
            space_id=space_id, actor_id=user.id, action="transaction.deleted", target=transaction_id
        )
    )
    db.commit()
