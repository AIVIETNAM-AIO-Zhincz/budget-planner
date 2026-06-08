"""Test AI gợi ý danh mục (baseline + fallback)."""

import pytest

from app.services.categorizer import FALLBACK_CATEGORY, suggest_category


@pytest.mark.parametrize(
    ("note", "expected"),
    [
        ("ăn trưa cùng team", "Ăn uống"),
        ("đi grab về nhà", "Đi lại"),
        ("mua áo trên shopee", "Mua sắm"),
        ("tiền điện tháng 6", "Hoá đơn"),
        ("nhận lương tháng", "Lương"),
    ],
)
def test_suggest_known_categories(note: str, expected: str) -> None:
    assert suggest_category(note) == expected


def test_fallback_when_unknown() -> None:
    assert suggest_category("xyz không rõ ràng") == FALLBACK_CATEGORY


def test_fallback_when_empty() -> None:
    assert suggest_category("") == FALLBACK_CATEGORY
