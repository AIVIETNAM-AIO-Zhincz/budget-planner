"""Engine đánh giá & đề xuất phân bổ ngân sách theo quy tắc 50/30/20 (hàm thuần).

Nhận số liệu đã tổng hợp (income, expense, ``by_need_level`` từ ``report.build_summary``) —
**không truy DB**, dễ test. Ánh xạ: thiết yếu = ``mandatory`` ≤ 50% thu nhập; mong muốn =
``optional`` ≤ 30%; **tiết kiệm = (thu − chi)/thu ≥ 20%**; lãng phí (``wasteful``) cảnh báo
cắt giảm riêng (pay-yourself-first).
"""

from __future__ import annotations

from app.core.format import format_vnd as _fmt

# Ngưỡng mục tiêu theo % thu nhập (quy tắc 50/30/20).
TARGETS = {"needs": 0.50, "wants": 0.30, "savings": 0.20}


def _by_level(by_need_level: list[dict]) -> dict[str, float]:
    """Gom amount theo need_level → dict đủ 3 nhóm (mặc định 0)."""
    out = {"mandatory": 0.0, "optional": 0.0, "wasteful": 0.0}
    for row in by_need_level:
        level = row.get("need_level")
        if level in out:
            out[level] += float(row.get("amount") or 0.0)
    return out


def _pct(value: float) -> str:
    """Định dạng phần trăm gọn: 0.453 → '45%'."""
    return f"{value * 100:.0f}%"


def _build_findings(
    has_income: bool,
    needs_ok: bool,
    wants_ok: bool,
    savings_ok: bool,
    needs_pct: float,
    wants_pct: float,
    savings_rate: float,
    wasteful: float,
    income: float,
) -> list[str]:
    """Câu giải thích/đề xuất (tiếng Việt) theo từng tiêu chí."""
    if not has_income:
        return [
            "Chưa ghi nhận thu nhập trong kỳ — hãy thêm giao dịch thu để đánh giá phân bổ theo "
            "quy tắc 50/30/20."
        ]

    findings: list[str] = []
    if savings_ok:
        findings.append(f"Tỷ lệ tiết kiệm {_pct(savings_rate)} (≥ 20%) — rất tốt, cứ duy trì.")
    else:
        findings.append(
            f"Tỷ lệ tiết kiệm chỉ {_pct(savings_rate)} (< 20%). Hãy 'trả cho mình trước': "
            "trích khoản tiết kiệm ngay khi nhận thu nhập, trước khi chi tiêu."
        )
    if not needs_ok:
        findings.append(
            f"Chi thiết yếu {_pct(needs_pct)} > 50% thu nhập — cân nhắc giảm chi phí cố định "
            "(nhà ở, hoá đơn, đi lại)."
        )
    if not wants_ok:
        findings.append(
            f"Chi mong muốn {_pct(wants_pct)} > 30% thu nhập — cắt bớt giải trí/mua sắm chưa cần."
        )
    if wasteful > 0:
        findings.append(f"Có {_fmt(wasteful)} đ chi 'lãng phí' — cắt khoản này để tăng tiết kiệm.")
    findings.append(
        f"Gợi ý 50/30/20 với thu nhập {_fmt(income)} đ: "
        f"thiết yếu {_fmt(TARGETS['needs'] * income)} đ, "
        f"mong muốn {_fmt(TARGETS['wants'] * income)} đ, "
        f"tiết kiệm {_fmt(TARGETS['savings'] * income)} đ."
    )
    return findings


def assess_allocation(income: float, expense: float, by_need_level: list[dict]) -> dict:
    """Đánh giá cơ cấu thu/chi theo 50/30/20 + đề xuất phân bổ.

    Args:
        income: tổng thu của kỳ.
        expense: tổng chi của kỳ.
        by_need_level: ``[{"need_level": ..., "amount": ...}]`` (từ ``build_summary``).

    Returns:
        dict gồm income/expense/savings/savings_rate/wasteful, ``verdict``
        (``good``/``warning``/``unknown``), ``groups`` (needs/wants/savings), ``findings`` và
        ``suggested_{needs,wants,savings}`` (50/30/20 × thu nhập).
    """
    levels = _by_level(by_need_level)
    needs, wants, wasteful = levels["mandatory"], levels["optional"], levels["wasteful"]
    savings = income - expense
    has_income = income > 0

    needs_pct = needs / income if has_income else 0.0
    wants_pct = wants / income if has_income else 0.0
    savings_rate = savings / income if has_income else 0.0

    needs_ok = has_income and needs_pct <= TARGETS["needs"]
    wants_ok = has_income and wants_pct <= TARGETS["wants"]
    savings_ok = has_income and savings_rate >= TARGETS["savings"]

    groups = [
        {
            "key": "needs",
            "actual": needs,
            "actual_pct": needs_pct,
            "target_pct": TARGETS["needs"],
            "ok": needs_ok,
        },
        {
            "key": "wants",
            "actual": wants,
            "actual_pct": wants_pct,
            "target_pct": TARGETS["wants"],
            "ok": wants_ok,
        },
        {
            "key": "savings",
            "actual": savings,
            "actual_pct": savings_rate,
            "target_pct": TARGETS["savings"],
            "ok": savings_ok,
        },
    ]

    if not has_income:
        verdict = "unknown"
    elif needs_ok and wants_ok and savings_ok and wasteful == 0:
        verdict = "good"
    else:
        verdict = "warning"

    findings = _build_findings(
        has_income,
        needs_ok,
        wants_ok,
        savings_ok,
        needs_pct,
        wants_pct,
        savings_rate,
        wasteful,
        income,
    )

    return {
        "income": income,
        "expense": expense,
        "savings": savings,
        "savings_rate": savings_rate,
        "wasteful": wasteful,
        "verdict": verdict,
        "groups": groups,
        "findings": findings,
        "suggested_needs": TARGETS["needs"] * income if has_income else 0.0,
        "suggested_wants": TARGETS["wants"] * income if has_income else 0.0,
        "suggested_savings": TARGETS["savings"] * income if has_income else 0.0,
    }
