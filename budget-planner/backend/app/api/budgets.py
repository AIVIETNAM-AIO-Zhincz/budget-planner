"""Router Budgets (Full CRUD; GET kèm spent/remaining/percent, lọc theo space_id)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import AuditLog, Budget, User
from app.rbac import get_current_space_id, get_current_user, require_min_role
from app.schemas.budget import BudgetCreate, BudgetRead, BudgetUpdate
from app.services.budget import budget_status

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _get_owned(db: Session, budget_id: str, space_id: str) -> Budget:
    """Lấy ngân sách thuộc đúng không gian, không có → 404."""
    budget = db.get(Budget, budget_id)
    if budget is None or budget.space_id != space_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy ngân sách"
        )
    return budget


def _to_read(db: Session, budget: Budget) -> BudgetRead:
    """Dựng BudgetRead kèm tiến độ chi tiêu."""
    spent, remaining, percent = budget_status(db, budget)
    return BudgetRead(
        id=budget.id,
        space_id=budget.space_id,
        period=budget.period,
        limit_amount=budget.limit_amount,
        category_id=budget.category_id,
        spent_amount=spent,
        remaining=remaining,
        percent=percent,
    )


@router.post(
    "",
    response_model=BudgetRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_min_role("admin"))],
)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> BudgetRead:
    """Tạo ngân sách cho không gian hiện tại."""
    budget = Budget(
        space_id=space_id,
        period=payload.period,
        limit_amount=payload.limit_amount,
        category_id=payload.category_id,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _to_read(db, budget)


@router.get("", response_model=list[BudgetRead])
def list_budgets(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> list[BudgetRead]:
    """Liệt kê ngân sách của không gian, kèm tiến độ chi tiêu."""
    stmt = select(Budget).where(Budget.space_id == space_id)
    return [_to_read(db, b) for b in db.scalars(stmt)]


@router.get("/{budget_id}", response_model=BudgetRead)
def get_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> BudgetRead:
    """Xem một ngân sách (cô lập theo space_id)."""
    return _to_read(db, _get_owned(db, budget_id, space_id))


@router.patch(
    "/{budget_id}",
    response_model=BudgetRead,
    dependencies=[Depends(require_min_role("admin"))],
)
def update_budget(
    budget_id: str,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> BudgetRead:
    """Cập nhật ngân sách (partial)."""
    budget = _get_owned(db, budget_id, space_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    db.commit()
    db.refresh(budget)
    return _to_read(db, budget)


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_min_role("admin"))],
)
def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> None:
    """Xoá ngân sách + ghi audit log (hành động nhạy cảm)."""
    budget = _get_owned(db, budget_id, space_id)
    db.delete(budget)
    db.add(AuditLog(space_id=space_id, actor_id=user.id, action="budget.deleted", target=budget_id))
    db.commit()
