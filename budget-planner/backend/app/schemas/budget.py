"""Pydantic schema cho Budget."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class BudgetBase(BaseModel):
    """Trường chung khi tạo/đọc ngân sách."""

    period: str = Field(pattern=r"^\d{4}-\d{2}$", description="Kỳ ngân sách dạng YYYY-MM")
    limit_amount: float = Field(gt=0, description="Hạn mức, phải > 0")
    category_id: str | None = None


class BudgetCreate(BudgetBase):
    """Payload tạo ngân sách."""


class BudgetUpdate(BaseModel):
    """Payload cập nhật ngân sách (partial)."""

    period: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    limit_amount: float | None = Field(default=None, gt=0)
    category_id: str | None = None


class BudgetRead(BudgetBase):
    """Ngân sách trả về client (kèm tiến độ chi tiêu)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    space_id: str
    spent_amount: float = 0.0
    remaining: float = 0.0
    percent: float = 0.0
