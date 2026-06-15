"""Engine đánh giá khả thi mục tiêu tiết kiệm (hàm thuần, không DB).

Cho một mục tiêu (số tiền đích, đã để dành, khả năng để dành mỗi tháng, hạn còn lại theo tháng) →
đánh giá khả thi: bao lâu đạt, mỗi tháng cần bao nhiêu để kịp hạn. Dùng cho cả chatbot (mục tiêu
nhập bằng lời) lẫn thẻ khả thi ở trang Goals.
"""

from __future__ import annotations

import math
import re


def parse_timeframe_months(text: str) -> int | None:
    """Trích mốc thời gian thành số tháng: 'X năm' → X×12, 'X tháng' → X; None nếu không có."""
    t = text.lower()
    m = re.search(r"(\d+)\s*năm", t)
    if m:
        return int(m.group(1)) * 12
    m = re.search(r"(\d+)\s*tháng", t)
    if m:
        return int(m.group(1))
    return None


def assess_goal(
    target_amount: float,
    saved_amount: float,
    monthly_capacity: float,
    months_left: int | None = None,
) -> dict:
    """Đánh giá khả thi của một mục tiêu tiết kiệm.

    Args:
        target_amount: số tiền đích.
        saved_amount: đã để dành.
        monthly_capacity: khả năng để dành mỗi tháng (net thu − chi).
        months_left: số tháng còn lại tới hạn (None nếu không đặt hạn).

    Returns:
        dict gồm remaining/monthly_capacity/months_needed/required_monthly/months_left/feasible và
        ``verdict`` (``done``/``no_surplus``/``on_track``/``tight``).
    """
    remaining = max(0.0, target_amount - saved_amount)
    result = {
        "target_amount": target_amount,
        "saved_amount": saved_amount,
        "remaining": remaining,
        "monthly_capacity": monthly_capacity,
        "months_needed": None,
        "required_monthly": None,
        "months_left": months_left,
        "feasible": None,
        "verdict": "",
    }

    if remaining <= 0:
        result["verdict"] = "done"
        return result
    if monthly_capacity <= 0:
        result["verdict"] = "no_surplus"
        return result

    result["months_needed"] = math.ceil(remaining / monthly_capacity)

    if months_left is not None:
        if months_left <= 0:  # hạn đã qua → cần toàn bộ ngay
            result["required_monthly"] = remaining
            result["feasible"] = False
            result["verdict"] = "tight"
        else:
            required = remaining / months_left
            result["required_monthly"] = required
            result["feasible"] = required <= monthly_capacity
            result["verdict"] = "on_track" if result["feasible"] else "tight"
    else:
        result["verdict"] = "on_track"

    return result
