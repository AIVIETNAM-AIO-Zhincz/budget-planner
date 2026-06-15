"""Engine tóm tắt tài chính tuần + phát hiện bất thường (hàm thuần, không DB).

Nhận chuỗi cửa sổ 7 ngày (cũ→mới, phần tử cuối = tuần hiện tại) đã tổng hợp sẵn (từ
``report.weekly_windows``) → tính thu/chi/net + thay đổi so tuần trước + top danh mục + cảnh báo
**bất thường** (danh mục chi vọt so mức thường), rồi dựng câu tóm tắt tiếng Việt bằng template
(deterministic, không bịa).
"""

from __future__ import annotations

from datetime import date

from app.core.format import format_vnd as _fmt

ANOMALY_FACTOR = 1.5  # chi tuần này ≥ 1.5× trung bình các tuần trước → cảnh báo
MIN_FLOOR = 200_000.0  # đ — bỏ qua nhiễu của các khoản nhỏ


def _pct_change(current: float, previous: float) -> float | None:
    """% thay đổi so kỳ trước; None nếu kỳ trước = 0 (không đủ cơ sở)."""
    if previous <= 0:
        return None
    return (current - previous) / previous * 100


def _anomalies(current_by_cat: dict, prior_windows: list[dict]) -> list[dict]:
    """Danh mục chi tuần này vọt ≥ ANOMALY_FACTOR× trung bình các tuần trước (và ≥ MIN_FLOOR)."""
    out: list[dict] = []
    if not prior_windows:
        return out
    for name, amount in current_by_cat.items():
        if amount < MIN_FLOOR:
            continue
        avg = sum(w["by_category"].get(name, 0.0) for w in prior_windows) / len(prior_windows)
        if avg > 0 and amount >= ANOMALY_FACTOR * avg:
            out.append({"name": name, "current": amount, "average": avg, "factor": amount / avg})
    out.sort(key=lambda a: a["factor"], reverse=True)
    return out


def _fmt_date(d: date) -> str:
    return d.strftime("%d/%m")


def _build_text(cur: dict, change: float | None, top: list[dict], anomalies: list[dict]) -> str:
    """Dựng câu tóm tắt tiếng Việt từ số liệu (template)."""
    span = f"{_fmt_date(cur['start'])}–{_fmt_date(cur['end'])}"
    if cur["income"] <= 0 and cur["expense"] <= 0:
        return f"Tuần qua ({span}) chưa có giao dịch nào."
    net = cur["income"] - cur["expense"]
    net_word = "dư" if net >= 0 else "âm"
    parts = [
        f"Tuần qua ({span}): thu {_fmt(cur['income'])} đ, chi {_fmt(cur['expense'])} đ, "
        f"{net_word} {_fmt(abs(net))} đ."
    ]
    if change is not None:
        parts.append(f"Chi {'tăng' if change >= 0 else 'giảm'} {abs(change):.0f}% so tuần trước.")
    if top:
        parts.append("Chi nhiều nhất: " + ", ".join(t["name"] for t in top) + ".")
    for a in anomalies:
        parts.append(
            f"⚠ {a['name']} cao bất thường (~{a['factor']:.1f}× mức thường, "
            f"{_fmt(a['current'])} đ)."
        )
    return " ".join(parts)


def build_weekly_summary(windows: list[dict]) -> dict:
    """Tóm tắt tuần hiện tại (windows[-1]) so với các tuần trước.

    Args:
        windows: cửa sổ 7 ngày cũ→mới, mỗi cái ``{start, end, income, expense, by_category}``.

    Returns:
        dict gồm week_start/week_end/income/expense/net/expense_change_pct, top_categories,
        anomalies, text.
    """
    cur = windows[-1]
    prior = windows[:-1]
    change = _pct_change(cur["expense"], prior[-1]["expense"]) if prior else None
    top = [
        {"name": name, "amount": amount}
        for name, amount in sorted(cur["by_category"].items(), key=lambda kv: kv[1], reverse=True)[
            :3
        ]
    ]
    anomalies = _anomalies(cur["by_category"], prior)
    return {
        "week_start": cur["start"],
        "week_end": cur["end"],
        "income": cur["income"],
        "expense": cur["expense"],
        "net": cur["income"] - cur["expense"],
        "expense_change_pct": change,
        "top_categories": top,
        "anomalies": anomalies,
        "text": _build_text(cur, change, top, anomalies),
    }
