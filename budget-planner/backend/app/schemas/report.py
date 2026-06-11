"""Pydantic schema cho Reports (tổng hợp)."""

from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel


class CategoryAmount(BaseModel):
    """Tổng chi theo một danh mục."""

    name: str
    amount: float


class NeedLevelAmount(BaseModel):
    """Tổng chi theo mức cần thiết (mandatory/optional/wasteful)."""

    need_level: str
    amount: float


class DayFlow(BaseModel):
    """Thu/chi theo một ngày."""

    date: date_type
    income: float
    expense: float


class ReportSummary(BaseModel):
    """Tổng hợp báo cáo trong khoảng thời gian."""

    total_income: float
    total_expense: float
    balance: float
    by_category: list[CategoryAmount]
    by_need_level: list[NeedLevelAmount]
    by_day: list[DayFlow]
