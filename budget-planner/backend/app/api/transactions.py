"""Router Transactions (event-driven, lọc theo space_id)."""

from __future__ import annotations

import csv
import io
from datetime import date as date_type

from fastapi import APIRouter, Depends, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api._common import get_owned_or_404, write_audit
from app.core.db import get_db
from app.events.bus import event_bus
from app.events.events import BudgetExceeded, TransactionCreated
from app.models import Budget, Category, Membership, Transaction, User
from app.rbac import get_current_space_id, get_current_user, require_min_role
from app.schemas.transaction import (
    ImportPreviewRow,
    ImportResult,
    ImportRowError,
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)
from app.services.budget import spent_for_period
from app.services.categorizer import suggest_category
from app.services.wallet import apply_effect, reverse_effect

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

    apply_effect(db, tx.space_id, tx.wallet_id, tx.type, tx.amount)
    db.commit()

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


def _parse_csv_row(line: int, row: dict) -> tuple[dict | None, ImportRowError | None]:
    """Validate một dòng CSV → (dict hợp lệ, None) hoặc (None, lỗi)."""
    raw_date = (row.get("date") or "").strip()
    try:
        parsed_date = date_type.fromisoformat(raw_date)
    except ValueError:
        return None, ImportRowError(line=line, message=f"ngày không hợp lệ: '{raw_date}'")

    tx_type = (row.get("type") or "").strip().lower()
    if tx_type not in ("income", "expense"):
        return None, ImportRowError(line=line, message=f"loại không hợp lệ: '{tx_type}'")

    raw_amount = (row.get("amount") or "").strip()
    try:
        amount = float(raw_amount)
    except ValueError:
        return None, ImportRowError(line=line, message=f"số tiền không hợp lệ: '{raw_amount}'")
    if amount <= 0:
        return None, ImportRowError(line=line, message="số tiền phải lớn hơn 0")

    note = (row.get("note") or "").strip()
    category = (row.get("category_name") or "").strip() or suggest_category(note)
    return {
        "date": parsed_date,
        "type": tx_type,
        "amount": amount,
        "note": note,
        "category_name": category,
    }, None


@router.post("/import", response_model=ImportResult)
def import_transactions(
    file: UploadFile,
    dry_run: bool = Query(default=False),
    db: Session = Depends(get_db),
    membership: Membership = Depends(require_min_role("member")),
) -> ImportResult:
    """Nhập giao dịch từ CSV (cột date,type,category_name,note,amount).

    ``dry_run=True`` chỉ kiểm tra & xem trước; bỏ qua dòng lỗi, nhập dòng hợp lệ.
    """
    raw = file.file.read().decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(raw))

    valid: list[dict] = []
    errors: list[ImportRowError] = []
    for line, row in enumerate(reader, start=2):  # dòng 1 là header
        parsed, err = _parse_csv_row(line, row)
        if err is not None:
            errors.append(err)
        else:
            valid.append(parsed)

    if not dry_run:
        for item in valid:
            db.add(Transaction(space_id=membership.space_id, user_id=membership.user_id, **item))
        db.commit()

    return ImportResult(
        dry_run=dry_run,
        valid_count=len(valid),
        error_count=len(errors),
        created=0 if dry_run else len(valid),
        errors=errors[:50],
        preview=[ImportPreviewRow(**item) for item in valid[:20]],
    )


def _get_owned(db: Session, transaction_id: str, space_id: str) -> Transaction:
    """Lấy giao dịch thuộc đúng không gian; 404 nếu không có."""
    return get_owned_or_404(db, Transaction, transaction_id, space_id, "Không tìm thấy giao dịch")


def _apply_filters(stmt, space_id: str, type, category, month, q):
    """Áp các bộ lọc chung (space/type/category/month/q) lên một câu lệnh select."""
    stmt = stmt.where(Transaction.space_id == space_id)
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
    return stmt


@router.get("", response_model=list[TransactionRead])
def list_transactions(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    type: str | None = Query(default=None, pattern="^(income|expense)$"),
    category: str | None = Query(default=None),
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    q: str | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> list[Transaction]:
    """Liệt kê giao dịch (cô lập theo space_id), lọc theo loại/danh mục/tháng/tìm ghi chú.

    Phân trang tuỳ chọn: truyền ``limit`` (kèm ``offset``) để lấy 1 trang; không có
    ``limit`` → trả tất cả (giữ tương thích Dashboard + client cũ).
    """
    stmt = _apply_filters(select(Transaction), space_id, type, category, month, q)
    stmt = stmt.order_by(Transaction.date.desc())
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt))


@router.get("/stats")
def transaction_stats(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    type: str | None = Query(default=None, pattern="^(income|expense)$"),
    category: str | None = Query(default=None),
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    q: str | None = Query(default=None),
) -> dict:
    """Tổng hợp trên TOÀN bộ bộ lọc (không phân trang): số lượng + tổng thu + tổng chi.

    Dùng cho thanh tổng + đếm trang ở UI khi danh sách được phân trang.
    """
    count_stmt = _apply_filters(
        select(func.count(Transaction.id)), space_id, type, category, month, q
    )
    total = int(db.scalar(count_stmt) or 0)

    def _sum(tx_type: str) -> float:
        stmt = _apply_filters(
            select(func.coalesce(func.sum(Transaction.amount), 0.0)),
            space_id,
            type,
            category,
            month,
            q,
        ).where(Transaction.type == tx_type)
        return float(db.scalar(stmt) or 0)

    income = _sum("income")
    expense = _sum("expense")
    return {"total": total, "income": income, "expense": expense}


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
    """Cập nhật giao dịch (member+). Hoàn lại số dư cũ + áp mới; kiểm vượt ngân sách."""
    tx = _get_owned(db, transaction_id, space_id)
    old = (tx.wallet_id, tx.type, tx.amount)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tx, field, value)
    db.commit()
    db.refresh(tx)

    reverse_effect(db, space_id, old[0], old[1], old[2])
    apply_effect(db, space_id, tx.wallet_id, tx.type, tx.amount)
    db.commit()

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
    """Xoá giao dịch (member+): hoàn lại số dư ví + ghi audit log."""
    tx = _get_owned(db, transaction_id, space_id)
    reverse_effect(db, space_id, tx.wallet_id, tx.type, tx.amount)
    db.delete(tx)
    write_audit(
        db, space_id=space_id, actor_id=user.id, action="transaction.deleted", target=transaction_id
    )
    db.commit()
