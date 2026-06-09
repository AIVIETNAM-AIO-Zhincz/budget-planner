"""Trợ lý rule-based: parse câu tiếng Việt thành giao dịch + hỏi-đáp số liệu.

Toàn bộ hàm parse là **hàm thuần** (nhận ``text``/``today``) để test xác định.
"""

from __future__ import annotations

import re
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Transaction, Wallet
from app.services import llm
from app.services.categorizer import suggest_category

_INCOME_KEYWORDS = ("thu nhập", "thu ", "nhận", "lương", "thưởng", "được trả", "bán", "hoàn tiền")


def parse_amount(text: str) -> float | None:
    """Trích số tiền: '50k', '1.5tr', '50 nghìn', '50.000', '50000'."""
    t = text.lower()
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:tr|triệu)\b", t)
    if m:
        return float(m.group(1).replace(",", ".")) * 1_000_000
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:k|nghìn|ngàn|ngìn)\b", t)
    if m:
        return float(m.group(1).replace(",", ".")) * 1_000
    m = re.search(r"\d[\d.]*\d|\d", t)
    if m:
        digits = m.group(0).replace(".", "")
        if digits.isdigit():
            return float(digits)
    return None


def parse_date(text: str, today: date) -> date:
    """Trích ngày: 'hôm nay/qua/kia', 'X ngày trước', 'dd/mm[/yyyy]'; mặc định today."""
    t = text.lower()
    if "hôm kia" in t:
        return today - timedelta(days=2)
    if "hôm qua" in t:
        return today - timedelta(days=1)
    if "hôm nay" in t or "hnay" in t:
        return today
    m = re.search(r"(\d+)\s*(?:ngày|hôm)\s*trước", t)
    if m:
        return today - timedelta(days=int(m.group(1)))
    m = re.search(r"\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b", t)
    if m:
        day, mon = int(m.group(1)), int(m.group(2))
        year = int(m.group(3)) if m.group(3) else today.year
        if year < 100:
            year += 2000
        try:
            return date(year, mon, day)
        except ValueError:
            return today
    return today


def parse_type(text: str) -> str:
    """Suy loại giao dịch: keyword thu/nhận/lương... → income, còn lại expense."""
    t = text.lower()
    if any(k in t for k in _INCOME_KEYWORDS):
        return "income"
    return "expense"


def _clean_note(text: str) -> str:
    """Bỏ bớt token số tiền/ngày để có ghi chú gọn (fallback: text gốc)."""
    s = text
    s = re.sub(r"\d+(?:[.,]\d+)?\s*(?:tr|triệu|k|nghìn|ngàn|ngìn)\b", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b", "", s)
    s = re.sub(r"\d+\s*(?:ngày|hôm)\s*trước", "", s)
    for ph in ("hôm kia", "hôm qua", "hôm nay", "hnay"):
        s = s.replace(ph, "")
    s = re.sub(r"\d[\d.]*\d|\d", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s or text.strip()


def parse_transaction(text: str, today: date) -> dict | None:
    """Parse câu thành nháp giao dịch; None nếu không thấy số tiền."""
    amount = parse_amount(text)
    if amount is None:
        return None
    return {
        "amount": amount,
        "type": parse_type(text),
        "note": _clean_note(text),
        "category_name": suggest_category(text),
        "date": parse_date(text, today),
    }


def _fmt(value: float) -> str:
    """Định dạng số tiền kiểu Việt Nam (1.250.000)."""
    return f"{int(value):,}".replace(",", ".")


def _month_range(today: date) -> tuple[date, date]:
    start = today.replace(day=1)
    end = date(start.year + 1, 1, 1) if start.month == 12 else date(start.year, start.month + 1, 1)
    return start, end


def _wallet_summary(db: Session, space_id: str) -> str:
    """Tóm tắt số dư các ví của không gian."""
    wallets = list(db.scalars(select(Wallet).where(Wallet.space_id == space_id)))
    if not wallets:
        return "Bạn chưa có ví nào."
    total = sum(w.balance for w in wallets)
    lines = "; ".join(f"{w.name}: {_fmt(w.balance)} đ" for w in wallets)
    return f"Số dư ví — {lines}. Tổng: {_fmt(total)} đ."


def _month_total(db: Session, space_id: str, tx_type: str, today: date) -> str:
    """Tổng thu/chi của tháng hiện tại."""
    start, end = _month_range(today)
    total = (
        db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
                Transaction.space_id == space_id,
                Transaction.type == tx_type,
                Transaction.date >= start,
                Transaction.date < end,
            )
        )
        or 0
    )
    label = "thu" if tx_type == "income" else "chi"
    return f"Tháng {start.strftime('%m/%Y')} bạn đã {label} {_fmt(total)} đ."


def compute_answer(db: Session, space_id: str, intent: str | None, today: date) -> str | None:
    """Tính câu trả lời số liệu từ DB theo intent cố định (không bịa số)."""
    if intent == "wallet_balance":
        return _wallet_summary(db, space_id)
    if intent == "expense_month":
        return _month_total(db, space_id, "expense", today)
    if intent == "income_month":
        return _month_total(db, space_id, "income", today)
    return None


def answer_query(db: Session, space_id: str, text: str, today: date) -> str | None:
    """Trả lời câu hỏi số liệu cơ bản bằng rule (keyword) → None nếu không khớp."""
    t = text.lower()
    is_question = any(k in t for k in ("bao nhiêu", "?", "tổng", "số dư", "còn"))

    if "số dư" in t or ("ví" in t and is_question):
        return _wallet_summary(db, space_id)

    if ("chi" in t or "thu" in t) and ("tháng" in t or is_question):
        tx_type = "income" if ("thu" in t or "nhận" in t) else "expense"
        return _month_total(db, space_id, tx_type, today)

    return None


def _transaction_reply(draft: dict) -> str:
    """Câu xác nhận cho nháp giao dịch."""
    kind = "Thu" if draft["type"] == "income" else "Chi"
    return (
        f"Mình hiểu: {kind} {_fmt(draft['amount'])} đ — {draft['category_name']} — "
        f"{draft['date'].strftime('%d/%m/%Y')}. Mở form để xác nhận nhé."
    )


def _route_llm(db: Session, space_id: str, res: dict | None, today: date) -> dict | None:
    """Diễn giải kết quả LLM thành phản hồi; None để fallback về rule."""
    if not res:
        return None
    kind = res.get("kind")
    if kind == "transaction" and res.get("draft"):
        return {
            "kind": "transaction",
            "reply": _transaction_reply(res["draft"]),
            "draft": res["draft"],
        }
    if kind == "question":
        answer = compute_answer(db, space_id, res.get("question"), today)
        if answer is not None:
            return {"kind": "answer", "reply": answer, "draft": None}
        return None
    if kind == "other":
        reply = (
            res.get("reply") or "Mình là trợ lý chi tiêu. Bạn ghi giao dịch hoặc hỏi số liệu nhé."
        )
        return {"kind": "answer", "reply": reply, "draft": None}
    return None


def handle_message(db: Session, space_id: str, text: str, today: date) -> dict:
    """Định tuyến tin nhắn: ưu tiên LLM (nếu bật) → fallback rule (hỏi-đáp → nháp → không hiểu)."""
    if llm.llm_enabled():
        routed = _route_llm(db, space_id, llm.classify_message(text, today), today)
        if routed is not None:
            return routed

    answer = answer_query(db, space_id, text, today)
    if answer is not None:
        return {"kind": "answer", "reply": answer, "draft": None}

    draft = parse_transaction(text, today)
    if draft is not None:
        return {"kind": "transaction", "reply": _transaction_reply(draft), "draft": draft}

    return {
        "kind": "unknown",
        "reply": 'Mình chưa hiểu. Thử: "ăn trưa 50k hôm qua" hoặc "tháng này chi bao nhiêu?".',
        "draft": None,
    }
