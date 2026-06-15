"""Test mô hình ML phân loại danh mục: generalize ngoài keyword + fallback + eval."""

from sklearn.model_selection import cross_val_score

from app.services.categorizer import FALLBACK_CATEGORY, build_pipeline, suggest_category
from app.services.category_data import CATEGORIES, TRAINING_DATA


def test_ml_generalizes_beyond_keywords() -> None:
    # "cuốc xe ôm về nhà" không khớp keyword Đi lại nào → phải do ML đoán.
    assert suggest_category("cuốc xe ôm về nhà") == "Đi lại"


def test_ml_beats_rule_on_conflict() -> None:
    # rule map "vé" → Đi lại, nhưng ML học "vé concert/ca nhạc" → Giải trí (ML chạy trước).
    assert suggest_category("vé concert ngoài trời") == "Giải trí"


def test_low_confidence_falls_back_to_other() -> None:
    # Ghi chú vô nghĩa: ML không đủ tự tin + không khớp rule → "Khác".
    assert suggest_category("qwerty zxcv asdf") == FALLBACK_CATEGORY


def test_training_labels_within_categories() -> None:
    assert {c for _, c in TRAINING_DATA} == set(CATEGORIES)


def test_eval_cross_val_accuracy() -> None:
    """Eval: 4-fold CV (StratifiedKFold, không shuffle → xác định) → accuracy trung bình ≥ 0.70."""
    notes = [n for n, _ in TRAINING_DATA]
    labels = [c for _, c in TRAINING_DATA]
    scores = cross_val_score(build_pipeline(), notes, labels, cv=4)
    assert scores.mean() >= 0.70
