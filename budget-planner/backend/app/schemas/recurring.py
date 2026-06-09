"""Pydantic schema cho RecurringRule (giao dịch định kỳ)."""

from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, ConfigDict, Field

_TYPE = "^(income|expense)$"
_FREQ = "^(daily|weekly|monthly)$"


class RecurringBase(BaseModel):
    """Trường chung của mẫu định kỳ."""

    name: str = Field(min_length=1, max_length=255)
    amount: float = Field(gt=0)
    type: str = Field(default="expense", pattern=_TYPE)
    category_name: str = Field(default="", max_length=255)
    wallet_id: str | None = None
    frequency: str = Field(default="monthly", pattern=_FREQ)
    start_date: date_type
    end_date: date_type | None = None


class RecurringCreate(RecurringBase):
    """Payload tạo mẫu định kỳ."""


class RecurringUpdate(BaseModel):
    """Payload sửa mẫu định kỳ (partial)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    amount: float | None = Field(default=None, gt=0)
    type: str | None = Field(default=None, pattern=_TYPE)
    category_name: str | None = None
    wallet_id: str | None = None
    frequency: str | None = Field(default=None, pattern=_FREQ)
    start_date: date_type | None = None
    next_run: date_type | None = None
    end_date: date_type | None = None
    active: bool | None = None


class RecurringRead(RecurringBase):
    """Mẫu định kỳ trả về client."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    space_id: str
    next_run: date_type
    active: bool
