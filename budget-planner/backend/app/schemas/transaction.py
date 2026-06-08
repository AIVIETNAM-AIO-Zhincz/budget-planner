"""Pydantic schema cho Transaction."""

from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, ConfigDict, Field


class TransactionBase(BaseModel):
    """Trường chung khi tạo/đọc giao dịch."""

    amount: float = Field(gt=0, description="Số tiền, phải > 0")
    type: str = Field(default="expense", pattern="^(income|expense)$")
    note: str = Field(default="", max_length=500)
    category_name: str = Field(default="", max_length=255)
    date: date_type | None = None
    wallet_id: str | None = None


class TransactionCreate(TransactionBase):
    """Payload tạo giao dịch. ``category_name`` bỏ trống → AI tự gợi ý."""


class TransactionUpdate(BaseModel):
    """Payload cập nhật giao dịch (partial — chỉ field gửi lên mới đổi)."""

    amount: float | None = Field(default=None, gt=0)
    type: str | None = Field(default=None, pattern="^(income|expense)$")
    note: str | None = Field(default=None, max_length=500)
    category_name: str | None = Field(default=None, max_length=255)
    date: date_type | None = None
    wallet_id: str | None = None


class TransactionRead(TransactionBase):
    """Giao dịch trả về client."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    space_id: str
    category_name: str
    date: date_type
