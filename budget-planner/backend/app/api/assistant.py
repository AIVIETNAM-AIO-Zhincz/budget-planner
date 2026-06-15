"""Router Trợ lý: nhận tin nhắn ngôn ngữ tự nhiên → nháp giao dịch / trả lời số liệu / tư vấn."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models import ChatMessage, Conversation, User, UserProfile
from app.rbac import get_current_space_id, get_current_user
from app.schemas.assistant import (
    AssistantReply,
    AssistantRequest,
    ConversationCreate,
    ConversationDetail,
    ConversationRead,
    ConversationRename,
    MessageRead,
    TransactionDraft,
)
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


def _owned_conversation(db: Session, conv_id: str, space_id: str, user_id: str) -> Conversation:
    """Lấy thread của chính user trong không gian hiện tại; 404 nếu không có/không sở hữu."""
    conv = db.get(Conversation, conv_id)
    if conv is None or conv.space_id != space_id or conv.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conv


def _to_message_read(m: ChatMessage) -> MessageRead:
    """Dựng MessageRead, giải mã nháp giao dịch (nếu có) từ JSON đã lưu."""
    draft = TransactionDraft.model_validate_json(m.draft_json) if m.draft_json else None
    return MessageRead(
        id=m.id, role=m.role, text=m.text, kind=m.kind, draft=draft, created_at=m.created_at
    )


@router.post("/conversations", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> Conversation:
    """Tạo thread chat mới (rỗng) cho user hiện tại."""
    conv = Conversation(space_id=space_id, user_id=user.id, title=(payload.title or "").strip())
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> list[Conversation]:
    """Danh sách thread của user trong không gian, hoạt động gần nhất trước."""
    return list(
        db.scalars(
            select(Conversation)
            .where(Conversation.space_id == space_id, Conversation.user_id == user.id)
            .order_by(Conversation.updated_at.desc())
        ).all()
    )


@router.get("/conversations/{conv_id}", response_model=ConversationDetail)
def get_conversation(
    conv_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> ConversationDetail:
    """Chi tiết một thread kèm toàn bộ tin nhắn (cũ → mới)."""
    conv = _owned_conversation(db, conv_id, space_id, user.id)
    msgs = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conv.id)
        .order_by(ChatMessage.created_at.asc())
    ).all()
    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[_to_message_read(m) for m in msgs],
    )


@router.patch("/conversations/{conv_id}", response_model=ConversationRead)
def rename_conversation(
    conv_id: str,
    payload: ConversationRename,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> Conversation:
    """Đổi tên thread."""
    conv = _owned_conversation(db, conv_id, space_id, user.id)
    conv.title = payload.title.strip()
    db.commit()
    db.refresh(conv)
    return conv


@router.delete("/conversations/{conv_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conv_id: str,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> None:
    """Xoá thread và toàn bộ tin nhắn của nó."""
    conv = _owned_conversation(db, conv_id, space_id, user.id)
    db.query(ChatMessage).filter(ChatMessage.conversation_id == conv.id).delete()
    db.delete(conv)
    db.commit()


@router.post("/conversations/{conv_id}/message", response_model=AssistantReply)
def conversation_message(
    conv_id: str,
    payload: AssistantRequest,
    db: Session = Depends(get_db),
    space_id: str = Depends(get_current_space_id),
    user: User = Depends(get_current_user),
) -> dict:
    """Nhắn trong thread: lưu tin user, gọi trợ lý, lưu tin bot; tự đặt tiêu đề từ tin đầu."""
    conv = _owned_conversation(db, conv_id, space_id, user.id)
    result = handle_message(db, space_id, payload.text, date.today(), _profile_dict(db, user.id))

    db.add(ChatMessage(conversation_id=conv.id, role="user", text=payload.text))
    draft = result.get("draft")
    db.add(
        ChatMessage(
            conversation_id=conv.id,
            role="bot",
            text=result["reply"],
            kind=result.get("kind"),
            draft_json=TransactionDraft(**draft).model_dump_json() if draft else None,
        )
    )
    if not conv.title.strip():
        conv.title = payload.text.strip()[:60]
    db.commit()
    return result
