"""Router Trợ lý: nhận tin nhắn ngôn ngữ tự nhiên → nháp giao dịch / trả lời số liệu / tư vấn."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import User, UserProfile
from app.rbac import get_current_space_id, get_current_user
from app.schemas.assistant import AssistantReply, AssistantRequest
from app.services.assistant import handle_message

router = APIRouter(prefix="/assistant", tags=["assistant"])


def _profile_dict(db: Session, user_id: str) -> dict | None:
    """Nạp hồ sơ tài chính (income + dependents) để cá nhân hoá; None nếu chưa đặt."""
    p = db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    if p is None:
        return None
    return {"monthly_income": p.monthly_income, "dependents": p.dependents or 0}


@router.post("/message", response_model=AssistantReply)
def message(
    payload: AssistantRequest,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> dict:
    """Xử lý tin nhắn: giao dịch / số liệu / tư vấn (cá nhân hoá theo hồ sơ; chỉ đọc)."""
    return handle_message(db, space_id, payload.text, date.today(), _profile_dict(db, user.id))
