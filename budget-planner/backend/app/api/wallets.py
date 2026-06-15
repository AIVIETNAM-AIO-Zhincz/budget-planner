"""Router Wallets (CRUD + chuyển tiền, lọc theo space_id)."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.api._common import get_owned_or_404, raise_transfer_error, write_audit
from app.core.db import get_db
from app.models import Membership, Transaction, Wallet
from app.rbac import get_current_space_id, get_current_user, require_min_role
from app.schemas.wallet import TransferRequest, WalletCreate, WalletRead, WalletUpdate
from app.services.budget import _period_range
from app.services.wallet import transfer_funds

router = APIRouter(prefix="/wallets", tags=["wallets"])


def _get_owned(db: Session, wallet_id: str, space_id: str) -> Wallet:
    """Lấy ví thuộc đúng không gian; 404 nếu không có."""
    return get_owned_or_404(db, Wallet, wallet_id, space_id, "Không tìm thấy ví")


@router.post(
    "",
    response_model=WalletRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_min_role("admin"))],
)
def create_wallet(
    payload: WalletCreate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Wallet:
    """Tạo ví mới cho không gian hiện tại."""
    wallet = Wallet(
        space_id=space_id, name=payload.name, type=payload.type, balance=payload.balance
    )
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet


@router.get("", response_model=list[WalletRead])
def list_wallets(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> list[WalletRead]:
    """Liệt kê ví + thống kê giao dịch tháng hiện tại (số giao dịch, thu, chi) theo ví."""
    wallets = list(db.scalars(select(Wallet).where(Wallet.space_id == space_id)))
    start, end = _period_range(date.today().strftime("%Y-%m"))
    rows = db.execute(
        select(
            Transaction.wallet_id,
            Transaction.type,
            func.count(Transaction.id),
            func.coalesce(func.sum(Transaction.amount), 0.0),
        )
        .where(
            Transaction.space_id == space_id,
            Transaction.wallet_id.isnot(None),
            Transaction.date >= start,
            Transaction.date < end,
        )
        .group_by(Transaction.wallet_id, Transaction.type)
    ).all()
    stats: dict[str, dict] = {}
    for wid, tx_type, cnt, total in rows:
        entry = stats.setdefault(wid, {"count": 0, "income": 0.0, "expense": 0.0})
        entry["count"] += int(cnt)
        entry[tx_type] = float(total)

    result = []
    for wallet in wallets:
        entry = stats.get(wallet.id, {"count": 0, "income": 0.0, "expense": 0.0})
        read = WalletRead.model_validate(wallet)
        read.tx_count = entry["count"]
        read.tx_income = entry["income"]
        read.tx_expense = entry["expense"]
        result.append(read)
    return result


@router.post("/transfer", response_model=dict[str, WalletRead])
def transfer(
    payload: TransferRequest,
    current: Membership = Depends(require_min_role("member")),
    db: Session = Depends(get_db),
) -> dict[str, Wallet]:
    """Chuyển tiền giữa hai ví (member+): trừ ví nguồn, cộng ví đích."""
    try:
        src, dst = transfer_funds(
            db, current.space_id, payload.from_wallet_id, payload.to_wallet_id, payload.amount
        )
    except ValueError as err:
        raise_transfer_error(err, same_msg="Hai ví phải khác nhau")
    write_audit(
        db,
        space_id=current.space_id,
        actor_id=current.user_id,
        action="wallet.transfer",
        target=f"{src.id}->{dst.id}",
    )
    db.commit()
    db.refresh(src)
    db.refresh(dst)
    return {"from": src, "to": dst}


@router.get("/{wallet_id}", response_model=WalletRead)
def get_wallet(
    wallet_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Wallet:
    """Xem một ví (cô lập theo space_id)."""
    return _get_owned(db, wallet_id, space_id)


@router.patch(
    "/{wallet_id}", response_model=WalletRead, dependencies=[Depends(require_min_role("admin"))]
)
def update_wallet(
    wallet_id: str,
    payload: WalletUpdate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Wallet:
    """Cập nhật ví (partial)."""
    wallet = _get_owned(db, wallet_id, space_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(wallet, field, value)
    db.commit()
    db.refresh(wallet)
    return wallet


@router.delete(
    "/{wallet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_min_role("admin"))],
)
def delete_wallet(
    wallet_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user=Depends(get_current_user),
) -> None:
    """Xoá ví + gỡ liên kết giao dịch + ghi audit."""
    wallet = _get_owned(db, wallet_id, space_id)
    # Gỡ wallet_id khỏi các giao dịch trỏ tới ví này (tránh tham chiếu mồ côi).
    db.execute(update(Transaction).where(Transaction.wallet_id == wallet_id).values(wallet_id=None))
    db.delete(wallet)
    write_audit(db, space_id=space_id, actor_id=user.id, action="wallet.deleted", target=wallet_id)
    db.commit()
