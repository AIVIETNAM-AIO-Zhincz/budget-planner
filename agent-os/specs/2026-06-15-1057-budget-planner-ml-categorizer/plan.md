# Budget Planner — ML phân loại giao dịch (Phase 4, AI #2)

## Context

Roadmap **Phase 4** + backlog **3.2** ("AI phân loại nâng cao — model sklearn + eval"). Hiện
`categorizer.suggest_category` chỉ là **luật từ khoá** (baseline 3.1). Slice này thêm **mô hình
scikit-learn** (TF-IDF + Naive Bayes) học từ **dataset seed tuyển chọn**, phục vụ theo **hybrid
ML → rule → "Khác"**, giữ nguyên interface `suggest_category(note) -> str`. Đúng chủ đề khoá
"AI & Data Science".

**Quyết định đã chốt với chủ repo:**
- **Dataset**: **seed tuyển chọn** team viết (~15+ ví dụ/danh mục, tiếng Việt tự nhiên), commit dạng
  **module Python** (`.gitignore` chặn `*.csv`/`data/`/`models/`).
- **Phục vụ**: **hybrid** — ưu tiên ML (nếu độ tự tin ≥ ngưỡng), thấp/lỗi → rule keyword, cuối → "Khác".
- **Vòng đời model**: **train-on-load**, cache singleton trong tiến trình (KHÔNG commit `.pkl` — tránh
  binary bị gitignore; train ~vài trăm mẫu chỉ vài ms).
- **Bộ phân loại**: `TfidfVectorizer` + `MultinomialNB` (pipeline sklearn).
- **Nhánh** `feature/budget-planner-ml-categorizer` từ `develop`. **Backend-only** (không đổi FE/API/
  schema/migration). Độc lập PR #42 (chỉ đụng `categorizer.py`). `scikit-learn>=1.4` **đã có** trong
  requirements.

## Sự thật đã khảo sát

- **`services/categorizer.py`**: `_KEYWORD_RULES` (dict), `FALLBACK_CATEGORY="Khác"`,
  `suggest_category(note)` trả category hoặc fallback. Dùng ở 4 nơi: `api/transactions.py` (create +
  import), `services/llm.py`, `services/assistant.py` — tất cả chỉ gọi `suggest_category(note) -> str`
  → **giữ nguyên chữ ký**.
- **`tests/test_categorizer.py`**: assert 5 ghi chú → đúng danh mục + "Khác" cho lạ/rỗng → **phải giữ xanh**
  (seed phủ các ví dụ này để ML đoán đúng; rule vẫn là lưới).
- **`.gitignore`**: chặn `*.csv`, `*.parquet`, `data/`, `models/` → dataset để **module Python** (code).
- **`requirements.txt`**: đã có `scikit-learn>=1.4` (sklearn 1.7.2 trong venv).
- **`Makefile`**: có target `test`/`lint` — thêm `eval-categorizer`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-15-1057-budget-planner-ml-categorizer/` (plan/shape/standards/references).

## Task 2 — BE: dataset seed `category_data.py`

`backend/app/services/category_data.py` (mới):
- Docstring **data card**: mục đích, 7 nhãn, nguồn (seed team viết), hạn chế (nhỏ, tiếng Việt, miền chi
  tiêu cá nhân).
- `CATEGORIES: tuple[str, ...]` = (Ăn uống, Đi lại, Mua sắm, Hoá đơn, Giải trí, Sức khoẻ, Lương).
- `TRAINING_DATA: list[tuple[str, str]]` — ~15+ mẫu/nhãn, **ghi chú tự nhiên** (vượt ngoài keyword: vd
  "bún bò sáng nay", "đổ xăng xe máy", "vé xem phim cuối tuần") để model học khái quát, gồm cả các cụm
  trong `test_categorizer.py`.

## Task 3 — BE: categorizer hybrid ML + rule + eval — TDD

`backend/app/services/categorizer.py` (sửa):
- Tách `_rule_match(note) -> str | None` (logic keyword cũ, None nếu không khớp).
- ML lazy: `_get_model()` dựng `Pipeline([("tfidf", TfidfVectorizer(lowercase=True, ngram_range=(1,2))),
  ("clf", MultinomialNB())])` fit `TRAINING_DATA`, cache module-level; bọc try/except → None nếu sklearn/
  train lỗi (degrade về rule). `_ml_suggest(note) -> str | None`: predict + `predict_proba`; ≥
  `CONFIDENCE_THRESHOLD` (UPPER_SNAKE, ~0.4) → nhãn, else None.
- `suggest_category(note)`: rỗng → "Khác"; `_ml_suggest` → nếu có; `_rule_match` → nếu có; else "Khác".
- **Test**: `tests/test_categorizer.py` **giữ nguyên** (xanh); thêm `tests/test_categorizer_ml.py`:
  ML đoán đúng ghi chú **ngoài keyword** (vd "bún bò sáng nay" → Ăn uống); độ tin thấp ("qwerty zxcv")
  → "Khác"; **eval**: train/test split cố định (random_state) trên `TRAINING_DATA` → accuracy ≥ 0.75.
- Script `backend/scripts/eval_categorizer.py` (mới): in `accuracy` + `classification_report` (F1) +
  Makefile target `eval-categorizer` (cho báo cáo/data card).

## Task 4 — Verify + giao nộp

- `pytest` (toàn bộ + mới) xanh (model train-on-load không phá test cũ); `ruff check` + `ruff format`
  sạch. (Không FE → bỏ npm; chạy `npm test`/`build` nhanh để chắc không vô tình ảnh hưởng — kỳ vọng xanh.)
- `make eval-categorizer` in accuracy/F1 (đính kèm mô tả PR).
- **Live** (tuỳ chọn): Trợ lý "bún bò 50k" → danh mục Ăn uống (ML), "abcxyz 20k" → Khác.
- Commit/push, **PR vào `develop`**. **Không** trailer `Co-Authored-By`.

---

## Cấu trúc file

```
backend/app/services/category_data.py       (mới — seed dataset + data card)
backend/app/services/categorizer.py         (sửa — hybrid ML→rule→Khác, train-on-load cache)
backend/scripts/eval_categorizer.py          (mới — in accuracy/F1)
backend/tests/test_categorizer_ml.py         (mới — ML generalize + eval + fallback)
conquer/budget-planner/Makefile              (sửa — target eval-categorizer)
```
Tái dùng: `_KEYWORD_RULES`/`FALLBACK_CATEGORY` (rule fallback), interface `suggest_category(note)->str`
(không đổi 4 nơi gọi). **Không đổi FE/API/schema/migration.**

## Standards áp dụng

- **testing/tdd** — giữ `test_categorizer.py` xanh; thêm test ML (generalize ngoài keyword + fallback) +
  **eval có ngưỡng** (accuracy ≥ 0.75, split cố định — AI có fallback, không assert output ngẫu nhiên).
- **root/coding-style + naming** — `UPPER_SNAKE` (`CONFIDENCE_THRESHOLD`, `TRAINING_DATA`, `CATEGORIES`),
  type hint, docstring tiếng Việt; ruff sạch; import sklearn **lazy** (degrade khi lỗi).
- (Không **api/fastapi**, **database/migrations** — không endpoint/schema/migration mới.)

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
.venv/bin/python scripts/eval_categorizer.py   # accuracy + classification_report (F1)
cd ../frontend && npm test && npm run build     # backend-only, kỳ vọng không đổi
```
Kịch bản: `suggest_category("bún bò sáng nay")` → "Ăn uống" (ML, không có keyword "bún bò");
`suggest_category("đổ xăng")` → "Đi lại"; `suggest_category("qwerty")` → "Khác"; eval accuracy ≥ 0.75.
Test BE xanh (gồm 5 case keyword cũ); ruff sạch.
