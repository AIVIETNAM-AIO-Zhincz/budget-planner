"""AI gợi ý danh mục cho giao dịch (baseline rule + chỗ cắm ML).

Phase 0 dùng luật từ khoá tiếng Việt làm baseline, luôn có **fallback**
"Khác" khi không chắc. Slice sau thay bằng mô hình scikit-learn đã train.
"""

from __future__ import annotations

# Bản đồ từ khoá → danh mục (baseline). Mở rộng dần hoặc thay bằng ML.
_KEYWORD_RULES: dict[str, tuple[str, ...]] = {
    "Ăn uống": ("ăn", "trưa", "tối", "sáng", "cafe", "cà phê", "coffee", "trà sữa", "nhà hàng"),
    "Đi lại": ("grab", "taxi", "xăng", "gửi xe", "bus", "vé", "be ", "gojek"),
    "Mua sắm": ("shopee", "lazada", "tiki", "quần", "áo", "giày", "mua"),
    "Hoá đơn": ("điện", "nước", "internet", "wifi", "tiền nhà", "thuê", "hoá đơn"),
    "Giải trí": ("phim", "game", "netflix", "spotify", "du lịch"),
    "Sức khoẻ": ("thuốc", "bệnh viện", "khám", "nha khoa"),
    "Lương": ("lương", "salary", "thưởng"),
}

FALLBACK_CATEGORY = "Khác"


def suggest_category(note: str) -> str:
    """Gợi ý danh mục từ ghi chú giao dịch.

    Args:
        note: Mô tả/ghi chú giao dịch (vd "ăn trưa cùng team").

    Returns:
        Tên danh mục gợi ý; trả về ``"Khác"`` (fallback) nếu không khớp luật nào.
    """
    if not note:
        return FALLBACK_CATEGORY
    text = note.lower()
    for category, keywords in _KEYWORD_RULES.items():
        if any(kw in text for kw in keywords):
            return category
    return FALLBACK_CATEGORY
