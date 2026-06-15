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


class CategoryForecast(BaseModel):
    """Dự báo chi tháng tới của một danh mục."""

    name: str
    forecast: float
    low: float
    high: float


class ReportForecast(BaseModel):
    """Dự báo chi tháng tới (tổng + theo danh mục) bằng trung bình trượt."""

    month: str  # nhãn tháng được dự báo (YYYY-MM)
    method: str
    months_used: int
    total_forecast: float | None
    total_low: float | None
    total_high: float | None
    by_category: list[CategoryForecast]


class WeeklyAnomaly(BaseModel):
    """Danh mục chi cao bất thường trong tuần."""

    name: str
    current: float
    average: float
    factor: float


class WeeklySummary(BaseModel):
    """Tóm tắt tài chính tuần + cảnh báo bất thường."""

    week_start: date_type
    week_end: date_type
    income: float
    expense: float
    net: float
    expense_change_pct: float | None
    top_categories: list[CategoryAmount]
    anomalies: list[WeeklyAnomaly]
    text: str


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
