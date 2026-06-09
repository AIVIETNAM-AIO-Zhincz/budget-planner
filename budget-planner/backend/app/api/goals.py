"""Router Goals (mục tiêu tiết kiệm — CRUD + góp tiền)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api._common import get_owned_or_404, raise_transfer_error, write_audit
from app.core.db import get_db
from app.models import Goal, Membership, Wallet
from app.rbac import get_current_space_id, require_min_role
from app.schemas.goal import Contribute, GoalCreate, GoalRead, GoalUpdate
from app.services.wallet import transfer_funds

router = APIRouter(prefix="/goals", tags=["goals"])


def _get_owned(db: Session, goal_id: str, space_id: str) -> Goal:
    """Lấy mục tiêu thuộc đúng không gian; 404 nếu không có."""
    return get_owned_or_404(db, Goal, goal_id, space_id, "Không tìm thấy mục tiêu")


def _to_read(db: Session, goal: Goal) -> GoalRead:
    """Dựng GoalRead kèm tiến độ (saved = số dư ví tiết kiệm)."""
    wallet = db.get(Wallet, goal.wallet_id)
    saved = wallet.balance if wallet else 0.0
    percent = min(100.0, saved / goal.target_amount * 100.0) if goal.target_amount else 0.0
    return GoalRead(
        id=goal.id,
        space_id=goal.space_id,
        name=goal.name,
        target_amount=goal.target_amount,
        wallet_id=goal.wallet_id,
        deadline=goal.deadline,
        wallet_name=wallet.name if wallet else "",
        saved_amount=saved,
        percent=round(percent, 1),
    )


def _require_wallet(db: Session, wallet_id: str, space_id: str) -> None:
    """Kiểm ví thuộc không gian; 404 nếu không."""
    wallet = db.get(Wallet, wallet_id)
    if wallet is None or wallet.space_id != space_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy ví")


@router.post(
    "",
    response_model=GoalRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_min_role("member"))],
)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> GoalRead:
    """Tạo mục tiêu, gắn một ví tiết kiệm (phải thuộc không gian)."""
    _require_wallet(db, payload.wallet_id, space_id)
    goal = Goal(
        space_id=space_id,
        name=payload.name,
        target_amount=payload.target_amount,
        wallet_id=payload.wallet_id,
        deadline=payload.deadline,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _to_read(db, goal)


@router.get("", response_model=list[GoalRead])
def list_goals(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> list[GoalRead]:
    """Liệt kê mục tiêu của không gian (kèm tiến độ)."""
    goals = db.scalars(select(Goal).where(Goal.space_id == space_id))
    return [_to_read(db, g) for g in goals]


@router.post("/{goal_id}/contribute", response_model=GoalRead)
def contribute(
    goal_id: str,
    payload: Contribute,
    current: Membership = Depends(require_min_role("member")),
    db: Session = Depends(get_db),
) -> GoalRead:
    """Góp tiền (member+): chuyển từ ví nguồn → ví tiết kiệm của mục tiêu."""
    goal = _get_owned(db, goal_id, current.space_id)
    try:
        transfer_funds(db, current.space_id, payload.from_wallet_id, goal.wallet_id, payload.amount)
    except ValueError as err:
        raise_transfer_error(err, same_msg="Ví nguồn phải khác ví tiết kiệm")
    write_audit(
        db,
        space_id=current.space_id,
        actor_id=current.user_id,
        action="goal.contribute",
        target=goal_id,
    )
    db.commit()
    db.refresh(goal)
    return _to_read(db, goal)


@router.get("/{goal_id}", response_model=GoalRead)
def get_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> GoalRead:
    """Xem một mục tiêu (kèm tiến độ)."""
    return _to_read(db, _get_owned(db, goal_id, space_id))


@router.patch(
    "/{goal_id}", response_model=GoalRead, dependencies=[Depends(require_min_role("member"))]
)
def update_goal(
    goal_id: str,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> GoalRead:
    """Cập nhật mục tiêu (partial)."""
    goal = _get_owned(db, goal_id, space_id)
    data = payload.model_dump(exclude_unset=True)
    if "wallet_id" in data:
        _require_wallet(db, data["wallet_id"], space_id)
    for field, value in data.items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return _to_read(db, goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current: Membership = Depends(require_min_role("member")),
) -> None:
    """Xoá mục tiêu + ghi audit."""
    goal = _get_owned(db, goal_id, current.space_id)
    db.delete(goal)
    write_audit(
        db,
        space_id=current.space_id,
        actor_id=current.user_id,
        action="goal.deleted",
        target=goal_id,
    )
    db.commit()
