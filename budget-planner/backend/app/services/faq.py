"""KB hỏi-đáp kiến thức tài chính cá nhân (hàm thuần, không DB).

Câu trả lời do team tuyển chọn (deterministic, **không bịa**). Khớp câu hỏi người dùng bằng
từ khoá → id entry; ``answer_faq`` dựng câu trả lời, **cá nhân hoá** bằng số liệu thật khi có
(truyền qua ``ctx``: ``monthly_income``/``monthly_expense``). LLM (nếu bật) chỉ chọn id entry —
xem ``services.llm`` + ``services.assistant``.
"""

from __future__ import annotations

from collections.abc import Callable

from app.core.format import format_vnd as _fmt


def _saving_rate(ctx: dict) -> str:
    """Nên tiết kiệm bao nhiêu % thu nhập."""
    base = (
        "Nguyên tắc phổ biến: tiết kiệm tối thiểu ~20% thu nhập mỗi tháng (theo quy tắc 50/30/20). "
        "Tốt nhất là tự động trích khoản tiết kiệm ngay khi nhận lương, trước khi chi tiêu."
    )
    income = ctx.get("monthly_income") or 0
    if income > 0:
        base += (
            f" Với thu nhập ~{_fmt(income)} đ/tháng của bạn, 20% ≈ {_fmt(0.2 * income)} đ/tháng."
        )
    return base


def _emergency_fund(ctx: dict) -> str:
    """Quỹ khẩn cấp nên có bao nhiêu (bội số tăng theo số người phụ thuộc)."""
    # Có người phụ thuộc → cần đệm dày hơn (6–12 tháng thay vì 3–6).
    low, high = (6, 12) if (ctx.get("dependents") or 0) > 0 else (3, 6)
    base = (
        f"Quỹ khẩn cấp nên đủ trang trải chi tiêu thiết yếu trong {low}–{high} tháng, phòng khi "
        "mất thu nhập hoặc có sự cố bất ngờ. Giữ ở nơi thanh khoản cao (tiền mặt/tài khoản dễ "
        "rút), tách khỏi tiền đầu tư."
    )
    expense = ctx.get("monthly_expense") or 0
    if expense > 0:
        base += (
            f" Với chi tiêu ~{_fmt(expense)} đ/tháng, quỹ khẩn cấp nên khoảng "
            f"{_fmt(low * expense)}–{_fmt(high * expense)} đ."
        )
    return base


def _financial_freedom(ctx: dict) -> str:
    """Cần bao nhiêu để tự do tài chính (quy tắc 4%)."""
    base = (
        "Tự do tài chính (theo quy tắc 4%) là khi tài sản đầu tư đủ lớn để rút ~4%/năm trang trải "
        "chi tiêu — tương đương khoảng 25 lần chi tiêu một năm."
    )
    expense = ctx.get("monthly_expense") or 0
    if expense > 0:
        annual = 12 * expense
        target = 25 * annual
        base += (
            f" Với chi tiêu ~{_fmt(expense)} đ/tháng (~{_fmt(annual)} đ/năm), con số tham khảo "
            f"≈ 25 × {_fmt(annual)} = {_fmt(target)} đ."
        )
    return base


def _rule_50_30_20(ctx: dict) -> str:
    """Giải thích quy tắc 50/30/20."""
    base = (
        "Quy tắc 50/30/20 chia thu nhập sau thuế thành: 50% nhu cầu thiết yếu (ăn ở, đi lại, hoá "
        "đơn), 30% mong muốn (giải trí, mua sắm), 20% tiết kiệm & trả nợ. Đây là điểm khởi đầu để "
        "cân đối ngân sách, có thể điều chỉnh theo hoàn cảnh."
    )
    income = ctx.get("monthly_income") or 0
    if income > 0:
        base += (
            f" Với thu nhập ~{_fmt(income)} đ: thiết yếu ≈ {_fmt(0.5 * income)} đ, "
            f"mong muốn ≈ {_fmt(0.3 * income)} đ, tiết kiệm ≈ {_fmt(0.2 * income)} đ."
        )
    return base


def _pay_yourself_first(ctx: dict) -> str:
    """Giải thích nguyên tắc 'trả cho mình trước'."""
    return (
        "‘Trả cho mình trước’ (pay yourself first): ngay khi có thu nhập, hãy trích phần tiết kiệm/"
        "đầu tư/trả nợ TRƯỚC, rồi mới phân bổ phần còn lại cho chi tiêu — thay vì để dành phần dư "
        "cuối tháng. Cách này giúp duy trì tỷ lệ tiết kiệm ổn định."
    )


# Đăng ký entry: id → (từ khoá khớp, hàm dựng câu trả lời). Thứ tự = ưu tiên khớp.
_FAQ: dict[str, tuple[tuple[str, ...], Callable[[dict], str]]] = {
    "saving_rate": (
        (
            "nên tiết kiệm",
            "tiết kiệm bao nhiêu",
            "để dành bao nhiêu",
            "tiết kiệm mỗi tháng",
            "bao nhiêu % thu nhập",
        ),
        _saving_rate,
    ),
    "emergency_fund": (
        ("quỹ khẩn cấp", "khẩn cấp", "emergency fund", "phòng thân"),
        _emergency_fund,
    ),
    "financial_freedom": (
        ("tự do tài chính", "financial freedom", "nghỉ hưu sớm", "quy tắc 4%"),
        _financial_freedom,
    ),
    "rule_50_30_20": (
        ("50/30/20", "50 30 20", "quy tắc phân bổ", "quy tắc ngân sách"),
        _rule_50_30_20,
    ),
    "pay_yourself_first": (
        ("trả cho mình trước", "trả cho bản thân trước", "pay yourself"),
        _pay_yourself_first,
    ),
}

# Tập id hợp lệ (để LLM khớp; khớp với assistant._route_llm).
FAQ_INTENTS: tuple[str, ...] = tuple(_FAQ.keys())


def match_faq(text: str) -> str | None:
    """Khớp câu hỏi người dùng → id entry FAQ bằng từ khoá; None nếu không trúng."""
    if not text:
        return None
    t = text.lower()
    for faq_id, (keywords, _answer) in _FAQ.items():
        if any(kw in t for kw in keywords):
            return faq_id
    return None


def answer_faq(faq_id: str, ctx: dict) -> str | None:
    """Dựng câu trả lời cho ``faq_id`` (cá nhân hoá qua ``ctx``); None nếu id lạ."""
    entry = _FAQ.get(faq_id)
    if entry is None:
        return None
    return entry[1](ctx)
