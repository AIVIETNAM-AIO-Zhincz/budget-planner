# Budget Planner — Tóm tắt tài chính tuần (Phase 4, AI #3)

## Context

Roadmap **Phase 4** + backlog **6.4** ("nhận tóm tắt tài chính hằng tuần — AI"). Thêm **tóm tắt tuần**:
backend tính số liệu tuần + **phát hiện bất thường** (danh mục chi vọt so mức thường) một cách
deterministic ("không bịa"), dựng **câu tóm tắt tiếng Việt bằng template**. Hiển thị ở **thẻ Dashboard**
+ **intent chatbot** + API.

**Quyết định đã chốt với chủ repo:**
- **Lời văn**: **template thuần** (không LLM) — backend dựng câu từ số liệu + cảnh báo; test xác định.
- **Surface**: thẻ "Tóm tắt tuần" ở **Dashboard** + intent chatbot `weekly_summary` + API
  `/reports/weekly-summary`.
- **Nhánh** `feature/budget-planner-weekly-summary` từ `develop` (bad21e7). **Không model/migration**.

## Sự thật đã khảo sát

- **`services/report.py build_summary(db, space_id, start, end)`** trả `total_income/total_expense` +
  `by_category=[{name, amount}]` cho một khoảng → gọi cho từng cửa sổ 7 ngày để dựng lịch sử tuần.
  Mẫu `recent_monthly_expense` (forecast) y hệt cách lắp nhiều kỳ.
- **`api/reports.py`** mẫu endpoint read-only `/reports/forecast`/`/reports/allocation` (gọi service →
  engine thuần → schema). `schemas/report.py` mẫu schema lồng (`CategoryAmount` tái dùng được).
- **`services/assistant.py`** `compute_answer`/`answer_query` (keyword rule; FAQ chạy trước) + `_INTENTS`
  ở `llm.py`. Thêm intent `weekly_summary` (LLM chỉ chọn intent, backend tính).
- **FE `pages/Dashboard.jsx`** có `SectionCard` (tiêu đề + nội dung) — chỗ đặt widget. Fetch qua các
  `api/*`; thêm `getWeeklySummary`. `formatAmount` ở `utils/format.js`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-15-1336-budget-planner-weekly-summary/` (plan/shape/standards/references).

## Task 2 — BE: engine `weekly.py` (hàm thuần) — TDD

`backend/app/services/weekly.py` (mới), **thuần**:
- Hằng `ANOMALY_FACTOR = 1.5`, `MIN_FLOOR = 200_000` (đ — bỏ nhiễu khoản nhỏ).
- `build_weekly_summary(windows: list[dict]) -> dict`: `windows` (cũ→mới, phần tử cuối = tuần hiện tại)
  mỗi cái `{start, end, income, expense, by_category}`:
  - `income/expense/net` của tuần hiện tại; `expense_change_pct` so tuần trước (None nếu <2 tuần hoặc
    tuần trước = 0).
  - `top_categories` (3 danh mục chi cao nhất tuần này).
  - `anomalies`: với mỗi danh mục tuần này ≥ `MIN_FLOOR`, tính trung bình các tuần trước; nếu
    `avg > 0 và current ≥ ANOMALY_FACTOR × avg` → `{name, current, average, factor}`.
  - `text`: câu tóm tắt tiếng Việt (thu/chi/net + thay đổi % + top + cảnh báo); chưa có giao dịch →
    "Tuần qua chưa có giao dịch nào."
- **Test trước** `tests/test_weekly.py`: tuần thường (income/expense/net/Δ%/top); bất thường (1 danh mục
  vọt ≥1.5× → có anomaly; ổn định → rỗng; khoản < floor → bỏ qua); 1 tuần (Δ None); rỗng → text "chưa có".

## Task 3 — BE: lắp lịch sử tuần + endpoint `/reports/weekly-summary` — TDD

- `report.py`: `weekly_windows(db, space_id, today, weeks=4) -> list[dict]` — cửa sổ 7 ngày hiện tại
  `[today-6, today]` + (weeks-1) tuần trước (qua `build_summary`).
- `schemas/report.py`: `WeeklyAnomaly{name, current, average, factor}` +
  `WeeklySummary{week_start, week_end, income, expense, net, expense_change_pct: float|None,
  top_categories: list[CategoryAmount], anomalies: list[WeeklyAnomaly], text: str}`.
- `api/reports.py`: `GET /reports/weekly-summary` → `weekly_windows` → `build_weekly_summary` →
  WeeklySummary. read-only, lọc `space_id`.
- **Test** `test_reports.py`: tạo chi tuần này + tuần trước → `/reports/weekly-summary` (income/expense/
  net/anomaly đúng); require token 401.

## Task 4 — Chatbot: intent `weekly_summary` — TDD

- `assistant.compute_answer`: `intent=="weekly_summary"` → `weekly_windows`→`build_weekly_summary` →
  trả `text`. Helper `_weekly_reply`.
- `assistant.answer_query`: keyword `"tóm tắt"` hoặc (`"tuần"` + `"thế nào"/"ra sao"/"tổng kết"`) →
  `weekly_summary` (đặt trước rule chi/thu; không đụng forecast "tháng sau").
- `llm.py`: thêm `"weekly_summary"` vào `_INTENTS` + mô tả `_SYSTEM`.
- **Test**: `test_assistant.py` ("tóm tắt tuần này" có giao dịch → reply chứa "Tuần qua"/số);
  `test_llm.py` (parse question `weekly_summary` + route mock).

## Task 5 — FE: thẻ "Tóm tắt tuần" ở Dashboard

- `api/reports.js`: `getWeeklySummary()` → `/reports/weekly-summary`.
- `pages/Dashboard.jsx`: `SectionCard` "Tóm tắt tuần" — câu `text` + chip cảnh báo bất thường (name +
  factor) màu cảnh báo; fetch cùng các list hiện có. Tái dùng `formatAmount`.
- `i18n vi/en`: `dashboard.weeklySummary*` (title, anomaly, none).

## Task 6 — Verify + giao nộp

- `pytest` (toàn bộ + mới) xanh; `ruff check` + `ruff format` sạch; `npm test` + `npm run build` xanh.
- **Live**: ghi chi tuần này + tuần trước (1 danh mục vọt) → Dashboard hiện thẻ tóm tắt + cảnh báo;
  Trợ lý "tóm tắt tuần này" → câu khớp.
- Commit/push, **PR vào `develop`**. **Không** trailer `Co-Authored-By`.

---

## Cấu trúc file

```
backend/app/services/weekly.py              (mới — build_weekly_summary, hàm thuần)
backend/app/services/report.py              (sửa — weekly_windows)
backend/app/schemas/report.py               (sửa — WeeklyAnomaly + WeeklySummary)
backend/app/api/reports.py                  (sửa — GET /reports/weekly-summary)
backend/app/services/assistant.py           (sửa — _weekly_reply + answer_query keyword + compute_answer)
backend/app/services/llm.py                 (sửa — _INTENTS + _SYSTEM weekly_summary)
backend/tests/test_weekly.py                (mới)
backend/tests/{test_reports,test_assistant,test_llm}.py  (sửa)
frontend/src/api/reports.js                 (sửa — getWeeklySummary)
frontend/src/pages/Dashboard.jsx            (sửa — SectionCard tóm tắt tuần)
frontend/src/i18n/locales/{vi,en}.json      (sửa — dashboard.weeklySummary*)
```
Tái dùng: `build_summary` (income/expense/by_category), pattern `recent_monthly_expense`/`/reports/
forecast`, `compute_answer`/`answer_query`/`_INTENTS`, `SectionCard`/`formatAmount`, mock
`classify_message`. `CategoryAmount` schema tái dùng. **Không model/migration.**

## Standards áp dụng

- **testing/tdd** — `test_weekly.py` thuần trước (thường + biên: 1 tuần, rỗng, dưới floor, ổn định
  không anomaly); test API + chatbot (rule + LLM mock); giữ test cũ xanh.
- **root/coding-style + naming** — hàm thuần, type hint, docstring tiếng Việt; `UPPER_SNAKE`
  (`ANOMALY_FACTOR`/`MIN_FLOOR`); ruff sạch; YAGNI (không config ngưỡng).
- **api/fastapi** — endpoint read-only `/reports/*`, Pydantic schema, lọc `space_id`.
- (Không **database/migrations**.)

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
cd ../frontend && npm test && npm run build
# live: chi tuần này + tuần trước (1 danh mục vọt) → Dashboard thẻ "Tóm tắt tuần" + cảnh báo;
#        Trợ lý "tóm tắt tuần này" → câu khớp
```
Kịch bản: tuần trước Ăn uống 1tr, tuần này Ăn uống 3tr → anomaly Ăn uống 3× (≥1.5×, ≥200k); text nêu
thu/chi/net + "Chi tăng …% so tuần trước" + cảnh báo. Tuần rỗng → "chưa có giao dịch". Test BE+FE + build xanh.
