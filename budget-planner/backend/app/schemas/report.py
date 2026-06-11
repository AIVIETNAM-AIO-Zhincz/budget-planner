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


class AllocationGroup(BaseModel):
    """Một nhóm 50/30/20: số thực tế + % so với mục tiêu."""

    key: str  # needs | wants | savings
    actual: float
    actual_pct: float
    target_pct: float
    ok: bool


class ReportAllocation(BaseModel):
    """Đánh giá phân bổ ngân sách theo 50/30/20 + đề xuất."""

    income: float
    expense: float
    savings: float
    savings_rate: float
    wasteful: float
    verdict: str  # good | warning | unknown
    groups: list[AllocationGroup]
    findings: list[str]
    suggested_needs: float
    suggested_wants: float
    suggested_savings: float


class MonthlyFlow(BaseModel):
    """Thu/chi + số dư luỹ kế của một tháng (YYYY-MM)."""

    month: str
    income: float
    expense: float
    balance: float


class AnnualReportSummary(BaseModel):
    """Tổng quan một năm: 12 tháng."""

    year: int
    months: list[MonthlyFlow]
