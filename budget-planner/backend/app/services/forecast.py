"""Engine dự báo chi tiêu (trung bình trượt + dải MAD; hàm thuần, không DB).

Dự báo tháng tới = trung bình ``window`` tháng gần nhất; dải tin cậy = ± độ lệch tuyệt đối trung
bình (MAD) của cửa sổ. Rule-based, deterministic — chỉ trung bình dữ liệu thật (không bịa). Dùng cho
cả endpoint ``/reports/forecast`` lẫn chatbot (``assistant.expense_forecast``).
"""

from __future__ import annotations

DEFAULT_WINDOW = 3


def forecast_series(values: list[float], window: int = DEFAULT_WINDOW) -> dict:
    """Dự báo giá trị kỳ tới từ chuỗi lịch sử (cũ→mới) bằng trung bình ``window`` kỳ cuối.

    Args:
        values: chuỗi giá trị theo thời gian, cũ → mới.
        window: số kỳ gần nhất dùng để trung bình.

    Returns:
        dict ``{forecast, low, high, months_used}``; ``forecast=None`` nếu chuỗi rỗng. ``low`` được
        kẹp ≥ 0; ``high = forecast + MAD``.
    """
    recent = values[-window:]
    months_used = len(recent)
    if months_used == 0:
        return {"forecast": None, "low": None, "high": None, "months_used": 0}

    forecast = sum(recent) / months_used
    mad = sum(abs(x - forecast) for x in recent) / months_used
    return {
        "forecast": forecast,
        "low": max(0.0, forecast - mad),
        "high": forecast + mad,
        "months_used": months_used,
    }
