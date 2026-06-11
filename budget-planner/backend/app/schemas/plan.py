"""Pydantic schema cho Kế hoạch tháng (planned thu/chi vs actual)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class MonthlyPlanUpdate(BaseModel):
    """Payload đặt kế hoạch tháng."""

    planned_income: float = Field(default=0.0, ge=0)
    planned_expense: float = Field(default=0.0, ge=0)


class MonthlyPlanRead(BaseModel):
    """Kế hoạch tháng kèm số liệu thực tế (FE tự tính chênh lệch/đạt)."""

    period: str
    planned_income: float
    planned_expense: float
    actual_income: float
    actual_expense: float
