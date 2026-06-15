"""Pydantic schema cho Trợ lý."""

from __future__ import annotations

from datetime import date as date_type
from datetime import datetime

from pydantic import BaseModel, Field


class AssistantRequest(BaseModel):
    """Tin nhắn người dùng gửi cho trợ lý."""

    text: str = Field(min_length=1, max_length=500)


class TransactionDraft(BaseModel):
    """Nháp giao dịch do trợ lý parse (chưa lưu)."""

    amount: float
    type: str
    note: str
    category_name: str
    date: date_type


class AssistantReply(BaseModel):
    """Phản hồi của trợ lý."""

    kind: str  # transaction | answer | faq | unknown
    reply: str
    draft: TransactionDraft | None = None


class ConversationCreate(BaseModel):
    """Tạo thread chat mới (tiêu đề tuỳ chọn)."""

    title: str | None = Field(default=None, max_length=255)


class ConversationRename(BaseModel):
    """Đổi tên thread."""

    title: str = Field(min_length=1, max_length=255)


class ConversationRead(BaseModel):
    """Thông tin tóm tắt một thread."""

    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class MessageRead(BaseModel):
    """Một tin nhắn trong thread."""

    id: str
    role: str
    text: str
    kind: str | None = None
    draft: TransactionDraft | None = None
    created_at: datetime


class ConversationDetail(ConversationRead):
    """Thread kèm toàn bộ tin nhắn."""

    messages: list[MessageRead] = []
