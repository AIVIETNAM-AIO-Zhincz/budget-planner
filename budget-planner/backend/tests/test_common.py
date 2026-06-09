"""Test helper dùng chung (format_vnd + get_owned_or_404)."""

import pytest
from fastapi import HTTPException

from app.api._common import get_owned_or_404
from app.core.db import SessionLocal
from app.core.format import format_vnd
from app.models import Wallet


def test_format_vnd() -> None:
    assert format_vnd(1250000) == "1.250.000"
    assert format_vnd(0) == "0"
    assert format_vnd(50000.0) == "50.000"
    assert format_vnd(999) == "999"


def test_get_owned_or_404() -> None:
    db = SessionLocal()
    try:
        wallet = Wallet(space_id="s1", name="x", type="cash", balance=0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

        assert get_owned_or_404(db, Wallet, wallet.id, "s1").id == wallet.id

        with pytest.raises(HTTPException) as cross_space:
            get_owned_or_404(db, Wallet, wallet.id, "khac-space")
        assert cross_space.value.status_code == 404

        with pytest.raises(HTTPException) as missing:
            get_owned_or_404(db, Wallet, "khong-ton-tai", "s1")
        assert missing.value.status_code == 404
    finally:
        db.close()
