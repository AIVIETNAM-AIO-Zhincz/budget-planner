"""AI gợi ý danh mục cho giao dịch — hybrid ML → rule → fallback.

Ưu tiên mô hình scikit-learn (TF-IDF + Logistic Regression, train-on-load từ
``category_data.TRAINING_DATA``); nếu độ tự tin dưới ngưỡng hoặc mô hình không khả dụng → luật từ
khoá tiếng Việt (lưới an toàn); cuối cùng → "Khác". Giữ nguyên chữ ký
``suggest_category(note) -> str`` (4 nơi gọi không đổi).
"""

from __future__ import annotations

from app.services.category_data import TRAINING_DATA

# Bản đồ từ khoá → danh mục (lưới an toàn khi ML không chắc).
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
# Ngưỡng xác suất tối thiểu để tin dự đoán của mô hình; thấp hơn → fallback rule (ghi chú mơ hồ).
CONFIDENCE_THRESHOLD = 0.25

_model = None  # pipeline đã fit (cache train-on-load)
_model_failed = False


def _rule_match(note: str) -> str | None:
    """Khớp danh mục bằng luật từ khoá; None nếu không trúng."""
    text = note.lower()
    for category, keywords in _KEYWORD_RULES.items():
        if any(kw in text for kw in keywords):
            return category
    return None


def build_pipeline():
    """Tạo pipeline TF-IDF (từ + bigram) + Logistic Regression (chưa fit).

    Tách riêng để ``_get_model``, test eval lẫn script eval dùng chung một cấu hình.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline

    return Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
            ("clf", LogisticRegression(max_iter=1000, random_state=42)),
        ]
    )


def _get_model():
    """Dựng + cache pipeline fit toàn bộ seed (train-on-load); None nếu sklearn vắng/lỗi."""
    global _model, _model_failed
    if _model is not None or _model_failed:
        return _model
    try:
        pipeline = build_pipeline()
        pipeline.fit([n for n, _ in TRAINING_DATA], [c for _, c in TRAINING_DATA])
        _model = pipeline
    except Exception:  # sklearn vắng hoặc train lỗi → degrade về rule
        _model_failed = True
        _model = None
    return _model


def _ml_suggest(note: str) -> str | None:
    """Dự đoán danh mục bằng mô hình nếu đủ tự tin (≥ ngưỡng); None nếu không."""
    model = _get_model()
    if model is None:
        return None
    try:
        proba = model.predict_proba([note])[0]
    except Exception:
        return None
    best = max(range(len(proba)), key=lambda i: proba[i])
    if proba[best] >= CONFIDENCE_THRESHOLD:
        return str(model.classes_[best])
    return None


def suggest_category(note: str) -> str:
    """Gợi ý danh mục từ ghi chú: ML (đủ tự tin) → luật từ khoá → "Khác".

    Args:
        note: Mô tả/ghi chú giao dịch (vd "ăn trưa cùng team").

    Returns:
        Tên danh mục gợi ý; ``"Khác"`` (fallback) nếu ML không chắc và không khớp luật nào.
    """
    if not note or not note.strip():
        return FALLBACK_CATEGORY
    return _ml_suggest(note) or _rule_match(note) or FALLBACK_CATEGORY
