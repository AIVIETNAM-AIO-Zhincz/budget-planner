"""Tầng LLM (OpenAI-compatible) cho Trợ lý.

LLM chỉ **phân loại ý định + trích giao dịch**; số liệu hỏi-đáp do backend tính từ DB
(xem ``assistant.compute_answer``) — không để LLM bịa số. Mọi lỗi mạng/JSON → ``None``
để gọi nơi dùng fallback về rule-based.
"""

from __future__ import annotations

import json
from datetime import date

import httpx

from app.core.config import settings
from app.services.categorizer import suggest_category
from app.services.faq import FAQ_INTENTS

# Các intent hỏi-đáp được phép (khớp với assistant.compute_answer).
_INTENTS = ("expense_month", "income_month", "wallet_balance", "allocation_review")

_FAQ_LIST = ", ".join(f'"{i}"' for i in FAQ_INTENTS)

_SYSTEM = (
    "Bạn là trợ lý tài chính cá nhân. Phân tích tin nhắn người dùng và TRẢ VỀ DUY NHẤT một JSON:\n"
    '{"kind":"transaction"|"question"|"faq"|"goal"|"other","draft":{...}|null,'
    '"question":<intent>|null,"faq":<faq_id>|null,'
    '"target_amount":<số|null>,"months":<số|null>,"reply":<string>|null}\n'
    '- "transaction": nếu là ghi một giao dịch. draft = '
    '{"amount":<số VND nguyên>,"type":"income"|"expense",'
    '"category_name":<chuỗi hoặc "">,"note":<chuỗi>,"date":"YYYY-MM-DD"}. '
    "CHỈ trích số tiền/ngày có trong tin nhắn, KHÔNG bịa.\n"
    '- "question": nếu hỏi SỐ LIỆU/đánh giá của người dùng. question ∈ '
    '["expense_month","income_month","wallet_balance","allocation_review"]. '
    '"allocation_review" = hỏi phân bổ/ngân sách hiện tại đã hợp lý chưa. KHÔNG tự tính số.\n'
    f'- "faq": nếu hỏi KIẾN THỨC tài chính chung (vd nên tiết kiệm %, quỹ khẩn cấp, tự do tài '
    f"chính). faq ∈ [{_FAQ_LIST}]. CHỈ chọn id phù hợp, KHÔNG tự trả lời nội dung.\n"
    '- "goal": nếu hỏi một MỤC TIÊU tiết kiệm có khả thi không (vd "để dành 100 triệu trong 2 '
    'năm"). target_amount = số tiền đích (VND nguyên); months = số tháng (X năm → X×12), null nếu '
    "không nêu. KHÔNG tự đánh giá.\n"
    '- "other": chào hỏi/không rõ. reply = câu trả lời ngắn, thân thiện bằng tiếng Việt.\n'
    "Chỉ in JSON, không kèm giải thích."
)


def llm_enabled() -> bool:
    """LLM có sẵn sàng không (đã cấu hình BP_LLM_API_KEY)."""
    return bool(settings.llm_api_key)


def _build_draft(data: dict | None, today: date) -> dict | None:
    """Validate + chuẩn hoá draft từ LLM; None nếu thiếu/sai."""
    if not isinstance(data, dict):
        return None
    try:
        amount = float(data.get("amount"))
    except (TypeError, ValueError):
        return None
    if amount <= 0:
        return None
    tx_type = data.get("type")
    if tx_type not in ("income", "expense"):
        return None
    parsed_date = today
    raw_date = data.get("date")
    if isinstance(raw_date, str) and raw_date:
        try:
            parsed_date = date.fromisoformat(raw_date)
        except ValueError:
            parsed_date = today
    note = (data.get("note") or "").strip()
    category = (data.get("category_name") or "").strip() or suggest_category(note)
    return {
        "amount": amount,
        "type": tx_type,
        "note": note,
        "category_name": category,
        "date": parsed_date,
    }


def parse_llm_json(raw: str, today: date) -> dict | None:
    """Đọc & kiểm JSON LLM trả về (hàm thuần). None nếu không hợp lệ."""
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None
    if not isinstance(data, dict):
        return None

    kind = data.get("kind")
    if kind == "transaction":
        draft = _build_draft(data.get("draft"), today)
        return {"kind": "transaction", "draft": draft} if draft else None
    if kind == "question":
        intent = data.get("question")
        return {"kind": "question", "question": intent} if intent in _INTENTS else None
    if kind == "faq":
        faq_id = data.get("faq")
        return {"kind": "faq", "faq": faq_id} if faq_id in FAQ_INTENTS else None
    if kind == "goal":
        try:
            target = float(data.get("target_amount"))
        except (TypeError, ValueError):
            return None
        if target <= 0:
            return None
        raw_months = data.get("months")
        months = (
            int(raw_months) if isinstance(raw_months, (int, float)) and raw_months > 0 else None
        )
        return {"kind": "goal", "target_amount": target, "months": months}
    if kind == "other":
        reply = data.get("reply")
        return {"kind": "other", "reply": reply if isinstance(reply, str) else None}
    return None


def _call_llm(messages: list[dict]) -> str | None:
    """Gọi endpoint chat completions; trả nội dung text hoặc None nếu lỗi/timeout."""
    try:
        resp = httpx.post(
            f"{settings.llm_base_url}/chat/completions",
            headers={"Authorization": f"Bearer {settings.llm_api_key}"},
            json={
                "model": settings.llm_model,
                "messages": messages,
                "temperature": 0,
                "response_format": {"type": "json_object"},
            },
            timeout=settings.llm_timeout,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except (httpx.HTTPError, KeyError, IndexError, ValueError, TypeError):
        return None


def classify_message(text: str, today: date) -> dict | None:
    """Phân loại tin nhắn qua LLM → dict đã validate, hoặc None để fallback."""
    messages = [
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": f"Hôm nay: {today.isoformat()}\nTin nhắn: {text}"},
    ]
    raw = _call_llm(messages)
    if raw is None:
        return None
    return parse_llm_json(raw, today)
