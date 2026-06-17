# ML phân loại giao dịch — Shaping Notes

## Scope

Nâng `categorizer.suggest_category` từ luật từ khoá (baseline 3.1) lên **mô hình scikit-learn**
(TF-IDF + Naive Bayes) học từ **dataset seed tuyển chọn**, phục vụ **hybrid ML → rule → "Khác"**,
giữ nguyên interface `suggest_category(note) -> str`. Backlog 3.2. Backend-only.

## Decisions (đã chốt với chủ repo)

1. **Dataset**: seed tuyển chọn team viết (~15+ ví dụ/danh mục, tiếng Việt tự nhiên), commit dạng
   **module Python** (`.gitignore` chặn `*.csv`).
2. **Phục vụ**: hybrid — ML (độ tự tin ≥ ngưỡng) → rule keyword → "Khác".
3. **Vòng đời model**: train-on-load, cache singleton (không commit binary; train vài ms).
4. **Bộ phân loại**: `TfidfVectorizer(ngram_range=(1,2))` + `MultinomialNB`.
5. **Nhánh** `feature/budget-planner-ml-categorizer` từ `develop`. Độc lập PR #42 (chỉ đụng
   `categorizer.py`). `scikit-learn>=1.4` đã có sẵn.

## Context

- **Visuals:** None.
- **References:** `services/categorizer.py` (rule baseline + fallback), 4 nơi gọi `suggest_category`
  (`api/transactions.py`, `services/llm.py`, `services/assistant.py`), `tests/test_categorizer.py`
  (giữ xanh), `.gitignore` (chặn csv/data/models). Xem `references.md`.
- **Product alignment:** roadmap **Phase 4** + backlog **3.2** (ML + eval), **3.7** (dataset + eval set).

## Standards Applied

- **testing/tdd** — giữ `test_categorizer.py` xanh; thêm test ML (generalize ngoài keyword + fallback) +
  **eval có ngưỡng** (accuracy ≥ 0.75, split cố định); AI có fallback, không assert output ngẫu nhiên.
- **root/coding-style + naming** — `UPPER_SNAKE` (`CONFIDENCE_THRESHOLD`/`TRAINING_DATA`/`CATEGORIES`),
  type hint, docstring tiếng Việt; import sklearn **lazy** (degrade khi lỗi); ruff sạch.
- (Không **api/fastapi**, **database/migrations** — không endpoint/schema/migration.)
