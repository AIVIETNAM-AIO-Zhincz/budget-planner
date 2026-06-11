"""Router Kế hoạch tháng — planned thu/chi đối chiếu actual (cô lập theo space)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Path
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api._common import write_audit
from app.core.db import get_db
from app.models import MonthlyPlan, User
from app.rbac import get_current_space_id, get_current_user, require_min_role
from app.schemas.plan import MonthlyPlanRead, MonthlyPlanUpdate
from app.services.budget import _period_range
from app.services.report import build_summary

router = APIRouter(prefix="/monthly-plan", tags=["monthly-plan"])

_PERIOD = r"^\d{4}-\d{2}$"


def _actuals(db: Session, space_id: str, period: str) -> tuple[float, float]:
    """Tổng thu/chi thực tế của tháng (tái dùng build_summary)."""
    start, end = _period_range(period)
    summary = build_summary(db, space_id, start, end)
    return summary["total_income"], summary["total_expense"]


def _find(db: Session, space_id: str, period: str) -> MonthlyPlan | None:
    return db.scalar(
        select(MonthlyPlan).where(
            MonthlyPlan.space_id == space_id, MonthlyPlan.period == period
        )
    )


def _read(db: Session, space_id: str, period: str, plan: MonthlyPlan | None) -> dict:
    inc, exp = _actuals(db, space_id, period)
    return {
        "period": period,
        "planned_income": plan.planned_income if plan else 0.0,
        "planned_expense": plan.planned_expense if plan else 0.0,
        "actual_income": inc,
        "actual_expense": exp,
    }


@router.get("/{period}", response_model=MonthlyPlanRead)
def get_plan(
    period: str = Path(pattern=_PERIOD),
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> dict:
    """Kế hoạch tháng (hoặc 0 nếu chưa đặt) + actual thu/chi tháng đó."""
    return _read(db, space_id, period, _find(db, space_id, period))


@router.put(
    "/{period}",
    response_model=MonthlyPlanRead,
    dependencies=[Depends(require_min_role("member"))],
)
def upsert_plan(
    payload: MonthlyPlanUpdate,
    period: str = Path(pattern=_PERIOD),
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> dict:
    """Đặt/cập nhật kế hoạch thu/chi cho tháng (member+)."""
    plan = _find(db, space_id, period)
    if plan is None:
        plan = MonthlyPlan(space_id=space_id, period=period)
        db.add(plan)
    plan.planned_income = payload.planned_income
    plan.planned_expense = payload.planned_expense
    write_audit(
        db, space_id=space_id, actor_id=user.id, action="monthly_plan.updated", target=period
    )
    db.commit()
    db.refresh(plan)
    return _read(db, space_id, period, plan)
