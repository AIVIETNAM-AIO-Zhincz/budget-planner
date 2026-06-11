"""Pydantic schema cho Goal (mục tiêu tiết kiệm)."""

from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, ConfigDict, Field


class GoalBase(BaseModel):
    """Trường chung của mục tiêu."""

    name: str = Field(min_length=1, max_length=255)
    target_amount: float = Field(gt=0)
    wallet_id: str
    deadline: date_type | None = None
    fund_type: str = Field(default="general", pattern="^(emergency|long_term|general)$")


class GoalCreate(GoalBase):
    """Payload tạo mục tiêu."""


class GoalUpdate(BaseModel):
    """Payload sửa mục tiêu (partial)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    target_amount: float | None = Field(default=None, gt=0)
    wallet_id: str | None = None
    deadline: date_type | None = None
    fund_type: str | None = Field(default=None, pattern="^(emergency|long_term|general)$")


class Contribute(BaseModel):
    """Payload góp tiền vào mục tiêu (chuyển từ ví nguồn)."""

    from_wallet_id: str
    amount: float = Field(gt=0)


class GoalRead(GoalBase):
    """Mục tiêu trả về client (kèm tiến độ soi từ ví tiết kiệm)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    space_id: str
    wallet_name: str
    saved_amount: float
    percent: float
