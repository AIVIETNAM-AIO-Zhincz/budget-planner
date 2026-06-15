"""Router Reports: tổng hợp số liệu + xuất CSV (lọc theo khoảng thời gian)."""

from __future__ import annotations

import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.rbac import get_current_space_id
from app.schemas.report import (
    AnnualReportSummary,
    ReportAllocation,
    ReportForecast,
    ReportSummary,
    WeeklySummary,
)
from app.services.allocation import assess_allocation
from app.services.forecast import forecast_series
from app.services.report import (
    build_annual_summary,
    build_summary,
    recent_monthly_expense,
    transactions_for_export,
    weekly_windows,
)
from app.services.weekly import build_weekly_summary

router = APIRouter(prefix="/reports", tags=["reports"])


def _parse(value: str | None) -> date | None:
    """Đổi 'YYYY-MM-DD' → date; None nếu rỗng/sai."""
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


@router.get("/summary", response_model=ReportSummary)
def summary(
    date_from: str | None = Query(default=None, alias="from"),
    date_to: str | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> dict:
    """Tổng hợp thu/chi/số dư + theo danh mục + theo ngày trong khoảng."""
    return build_summary(db, space_id, _parse(date_from), _parse(date_to))


@router.get("/allocation", response_model=ReportAllocation)
def allocation(
    date_from: str | None = Query(default=None, alias="from"),
    date_to: str | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> dict:
    """Đánh giá phân bổ 50/30/20 trong khoảng + đề xuất (tính từ thu/chi thực tế)."""
    s = build_summary(db, space_id, _parse(date_from), _parse(date_to))
    return assess_allocation(s["total_income"], s["total_expense"], s["by_need_level"])


def _next_month_label(today: date) -> str:
    """Nhãn YYYY-MM của tháng kế tiếp."""
    m, y = today.month + 1, today.year
    if m > 12:
        m, y = 1, y + 1
    return f"{y:04d}-{m:02d}"


@router.get("/forecast", response_model=ReportForecast)
def forecast(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> dict:
    """Dự báo chi tháng tới (tổng + top danh mục) bằng trung bình trượt 3 tháng gần nhất."""
    today = date.today()
    history = recent_monthly_expense(db, space_id, today, months=3)
    total = forecast_series([h["total"] for h in history])

    cat_totals: dict[str, float] = {}
    for h in history:
        for name, amount in h["by_category"].items():
            cat_totals[name] = cat_totals.get(name, 0.0) + amount
    top = sorted(cat_totals, key=lambda n: cat_totals[n], reverse=True)[:5]

    by_category = []
    for name in top:
        f = forecast_series([h["by_category"].get(name, 0.0) for h in history])
        if f["forecast"]:
            by_category.append(
                {"name": name, "forecast": f["forecast"], "low": f["low"], "high": f["high"]}
            )

    return {
        "month": _next_month_label(today),
        "method": "moving_avg_3",
        "months_used": total["months_used"],
        "total_forecast": total["forecast"],
        "total_low": total["low"],
        "total_high": total["high"],
        "by_category": by_category,
    }


@router.get("/weekly-summary", response_model=WeeklySummary)
def weekly_summary(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> dict:
    """Tóm tắt tài chính tuần (thu/chi/net + thay đổi + top + cảnh báo bất thường)."""
    return build_weekly_summary(weekly_windows(db, space_id, date.today()))


@router.get("/annual", response_model=AnnualReportSummary)
def annual(
    year: int | None = Query(default=None),
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> dict:
    """Tổng quan năm: 12 tháng thu/chi + số dư luỹ kế (mặc định năm hiện tại)."""
    return build_annual_summary(db, space_id, year or date.today().year)


@router.get("/export.csv")
def export_csv(
    date_from: str | None = Query(default=None, alias="from"),
    date_to: str | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> Response:
    """Xuất giao dịch trong khoảng ra CSV (UTF-8 BOM cho Excel)."""
    rows = transactions_for_export(db, space_id, _parse(date_from), _parse(date_to))
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["date", "type", "category_name", "note", "amount"])
    for tx in rows:
        writer.writerow([tx.date.isoformat(), tx.type, tx.category_name, tx.note, tx.amount])
    content = "﻿" + buf.getvalue()  # BOM giúp Excel đọc UTF-8
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"},
    )
