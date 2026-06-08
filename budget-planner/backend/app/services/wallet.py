"""Cập nhật số dư ví theo giao dịch (hàm thuần + helper áp/đảo hiệu ứng).

Hiệu ứng của một giao dịch lên số dư ví:
- thu (income) → +amount; chi (expense) → -amount.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Wallet


def wallet_effect(tx_type: str, amount: float) -> float:
    """Hiệu ứng số dư của giao dịch: +amount nếu thu, -amount nếu chi."""
    return amount if tx_type == "income" else -amount


def _wallet_in_space(db: Session, space_id: str, wallet_id: str | None) -> Wallet | None:
    """Lấy ví thuộc đúng không gian; None nếu không có/không thuộc space."""
    if not wallet_id:
        return None
    wallet = db.get(Wallet, wallet_id)
    if wallet is None or wallet.space_id != space_id:
        return None
    return wallet


def apply_effect(
    db: Session, space_id: str, wallet_id: str | None, tx_type: str, amount: float
) -> None:
    """Cộng hiệu ứng giao dịch vào số dư ví (nếu ví hợp lệ)."""
    wallet = _wallet_in_space(db, space_id, wallet_id)
    if wallet is not None:
        wallet.balance += wallet_effect(tx_type, amount)


def reverse_effect(
    db: Session, space_id: str, wallet_id: str | None, tx_type: str, amount: float
) -> None:
    """Đảo (hoàn lại) hiệu ứng giao dịch khỏi số dư ví (nếu ví hợp lệ)."""
    wallet = _wallet_in_space(db, space_id, wallet_id)
    if wallet is not None:
        wallet.balance -= wallet_effect(tx_type, amount)
