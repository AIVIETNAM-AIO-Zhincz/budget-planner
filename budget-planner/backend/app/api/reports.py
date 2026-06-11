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
from app.schemas.report import AnnualReportSummary, ReportSummary
from app.services.report import (
    build_annual_summary,
    build_summary,
    transactions_for_export,
)

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
