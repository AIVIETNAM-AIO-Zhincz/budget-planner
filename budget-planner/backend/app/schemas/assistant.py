"""Pydantic schema cho Trợ lý."""

from __future__ import annotations

from datetime import date as date_type

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
