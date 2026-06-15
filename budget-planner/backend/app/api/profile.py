"""Router Hồ sơ tài chính người dùng (per-user; nền cá nhân hoá lời khuyên)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import User, UserProfile
from app.rbac import get_current_user
from app.schemas.profile import ProfileRead, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


def _get(db: Session, user_id: str) -> UserProfile | None:
    """Lấy hồ sơ của user (None nếu chưa đặt)."""
    return db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))


@router.get("", response_model=ProfileRead)
def get_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileRead:
    """Hồ sơ tài chính của user hiện tại (rỗng nếu chưa đặt)."""
    profile = _get(db, user.id)
    if profile is None:
        return ProfileRead(user_id=user.id, dependents=0)
    return ProfileRead.model_validate(profile)


@router.put("", response_model=ProfileRead)
def upsert_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileRead:
    """Tạo/cập nhật hồ sơ tài chính (partial)."""
    profile = _get(db, user.id)
    if profile is None:
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return ProfileRead.model_validate(profile)
