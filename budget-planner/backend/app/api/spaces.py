"""Router Spaces: liệt kê không gian của tôi + tạo không gian mới."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import Membership, Space, User
from app.rbac import get_current_user
from app.schemas.space import SpaceCreate, SpaceRead

router = APIRouter(prefix="/spaces", tags=["spaces"])


@router.get("", response_model=list[SpaceRead])
def list_spaces(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SpaceRead]:
    """Các không gian mà user là thành viên active (kèm vai trò)."""
    rows = db.execute(
        select(Space, Membership.role)
        .join(Membership, Membership.space_id == Space.id)
        .where(Membership.user_id == user.id, Membership.status == "active")
    ).all()
    return [
        SpaceRead(
            id=space.id,
            name=space.name,
            owner_id=space.owner_id,
            currency=space.currency,
            role=role,
        )
        for space, role in rows
    ]


@router.post("", response_model=SpaceRead, status_code=status.HTTP_201_CREATED)
def create_space(
    payload: SpaceCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SpaceRead:
    """Tạo không gian mới; user trở thành owner."""
    space = Space(name=payload.name, currency=payload.currency, owner_id=user.id)
    db.add(space)
    db.flush()
    db.add(Membership(user_id=user.id, space_id=space.id, role="owner", status="active"))
    db.commit()
    db.refresh(space)
    return SpaceRead(
        id=space.id, name=space.name, owner_id=space.owner_id, currency=space.currency, role="owner"
    )
