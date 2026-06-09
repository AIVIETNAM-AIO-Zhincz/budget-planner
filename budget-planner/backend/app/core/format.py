"""Định dạng giá trị hiển thị."""

from __future__ import annotations


def format_vnd(value: float) -> str:
    """Số tiền kiểu Việt Nam: 1250000 → '1.250.000'."""
    return f"{int(value):,}".replace(",", ".")
