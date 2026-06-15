"""Eval nhanh mô hình phân loại danh mục: in accuracy + classification_report (F1).

Chạy từ thư mục backend:  python scripts/eval_categorizer.py
"""

from __future__ import annotations

from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import cross_val_predict, train_test_split

from app.services.categorizer import build_pipeline
from app.services.category_data import TRAINING_DATA


def main() -> None:
    """In accuracy holdout + báo cáo F1 theo nhãn (cross-val prediction)."""
    notes = [n for n, _ in TRAINING_DATA]
    labels = [c for _, c in TRAINING_DATA]

    x_train, x_test, y_train, y_test = train_test_split(
        notes, labels, test_size=0.25, random_state=42, stratify=labels
    )
    model = build_pipeline()
    model.fit(x_train, y_train)
    print(f"Holdout accuracy (25% test): {accuracy_score(y_test, model.predict(x_test)):.3f}")

    # Báo cáo F1 trên toàn bộ dữ liệu qua dự đoán cross-val (mỗi mẫu dự đoán khi ngoài fold).
    preds = cross_val_predict(build_pipeline(), notes, labels, cv=4)
    print(f"\nCross-val accuracy (4-fold): {accuracy_score(labels, preds):.3f}\n")
    print(classification_report(labels, preds, zero_division=0))


if __name__ == "__main__":
    main()
