"""Router Trợ lý: nhận tin nhắn ngôn ngữ tự nhiên → nháp giao dịch / trả lời số liệu."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.rbac import get_current_space_id
from app.schemas.assistant import AssistantReply, AssistantRequest
from app.services.assistant import handle_message

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/message", response_model=AssistantReply)
def message(
    payload: AssistantRequest,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
) -> dict:
    """Xử lý tin nhắn: parse giao dịch hoặc trả lời câu hỏi số liệu (chỉ đọc)."""
    return handle_message(db, space_id, payload.text, date.today())
