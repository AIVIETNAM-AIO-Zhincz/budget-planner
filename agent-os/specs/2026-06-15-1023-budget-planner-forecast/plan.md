# Budget Planner — Dự báo chi tiêu tháng sau (Phase 4, AI #1)

## Context

Roadmap **Phase 4** (AI phân tích): *"Dự báo chi tiêu tháng sau"*. Sau khi hoàn tất cụm chatbot tư vấn
(v0.3.0), đây là feature AI đầu của Phase 4. Mục tiêu: ước lượng **tổng chi tháng tới + theo danh mục**
từ lịch sử, bằng **trung bình trượt 3 tháng** — rule-based, hàm thuần, bám triết lý *không bịa* (chỉ
trung bình dữ liệu thật).

**Quyết định đã chốt với chủ repo:**
- **Phương pháp**: trung bình trượt **3 tháng hoàn chỉnh gần nhất** (loại tháng hiện tại đang dở), kèm
  dải `± độ lệch tuyệt đối trung bình (MAD)`.
- **Phạm vi**: **tổng chi** + **theo danh mục** (top N danh mục theo chi gần đây).
- **Surface**: thẻ "Dự báo chi tháng sau" ở trang **Báo cáo** + **intent chatbot** + API (nhất quán
  allocation/goal).
- **Nhánh** `feature/budget-planner-forecast` từ `develop`. **Không model/migration** (tính trên dữ liệu
  giao dịch có sẵn).

## Sự thật đã khảo sát

- **`services/report.py`**: `build_summary(db, space_id, start, end)` trả `total_expense` +
  `by_category=[{name, amount}]` cho một khoảng → gọi cho từng tháng để dựng chuỗi lịch sử;
  `_period_range`/`_month_range` (assistant) cho mốc tháng. `current_month_net` mẫu hàm phụ trợ.
- **`api/reports.py`**: mẫu endpoint read-only `/reports/allocation` (gọi build_summary → engine thuần →
  schema). Thêm `/reports/forecast` cùng pattern.
- **`schemas/report.py`**: `NeedLevelAmount`/`ReportAllocation` mẫu schema lồng list.
- **`services/assistant.py`**: `compute_answer`/`answer_query` (keyword rule, FAQ chạy trước),
  `_INTENTS` ở `llm.py`. Thêm intent `expense_forecast` (LLM chỉ chọn intent, backend tính).
  ⚠ Keyword forecast phải khớp **trước** rule "chi/thu + tháng" (vì "dự báo chi tháng sau" chứa "chi"+"tháng").
- **FE `pages/Reports.jsx`**: fetch summary + `ChartCard`; `formatAmount`. Thêm `getForecast` + thẻ.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-15-1023-budget-planner-forecast/` (plan/shape/standards/references).

## Task 2 — BE: engine `forecast.py` (hàm thuần) — TDD

`backend/app/services/forecast.py` (mới), **thuần**:
- `forecast_series(values: list[float], window: int = 3) -> dict`:
  - dùng tối đa `window` phần tử cuối (mới nhất); `months_used = min(len, window)`.
  - `forecast = mean(window cuối)`; `mad = mean(|x − forecast|)`; `low = max(0, forecast − mad)`,
    `high = forecast + mad`.
  - rỗng (`len==0`) → `{"forecast": None, "low": None, "high": None, "months_used": 0}`.
- **Test trước** `tests/test_forecast.py`: 3 tháng → trung bình đúng + dải; 1–2 tháng (window co lại);
  rỗng → None; giá trị bằng nhau → mad=0 (low=high=forecast).

## Task 3 — BE: lắp lịch sử + endpoint `/reports/forecast` — TDD

- `report.py`: `recent_monthly_expense(db, space_id, today, months=3) -> list[dict]` — với mỗi tháng
  hoàn chỉnh gần nhất (M-3..M-1) gọi `build_summary` → `{"total": total_expense, "by_category": {name:amount}}`.
- `schemas/report.py`: `CategoryForecast{name, forecast, low, high}` +
  `ReportForecast{month:str, method:str, months_used:int, total_forecast:float|None, total_low,
  total_high, by_category: list[CategoryForecast]}`.
- `api/reports.py`: `GET /reports/forecast` → dựng chuỗi total + per-category (top ~5 theo chi gần đây)
  → `forecast_series` từng chuỗi → ReportForecast (month = nhãn tháng sau). read-only, lọc `space_id`.
- **Test** `test_reports.py`: tạo 3 tháng chi (vd 1tr/2tr/3tr danh mục Ăn uống) → `/reports/forecast`
  total_forecast = 2tr; by_category có Ăn uống; require token 401.

## Task 4 — Chatbot: intent `expense_forecast` — TDD

- `assistant.compute_answer`: `intent=="expense_forecast"` → dựng text từ forecast tháng hiện tại
  ("Dự báo chi tháng sau ~X đ (khoảng A–B), dựa trên N tháng gần nhất"; chưa đủ dữ liệu → câu hướng dẫn).
  Helper `_forecast_reply`.
- `assistant.answer_query`: keyword `"dự báo"` / `"tháng sau"` / `"tháng tới"` → `expense_forecast`
  (đặt **trước** rule chi/thu).
- `llm.py`: thêm `"expense_forecast"` vào `_INTENTS` + mô tả `_SYSTEM`.
- **Test**: `test_assistant.py` (3 tháng chi → "dự báo chi tháng sau" → reply chứa số + "Dự báo");
  `test_llm.py` (parse question `expense_forecast` + route mock).

## Task 5 — FE: thẻ "Dự báo chi tháng sau" ở Báo cáo

- `api/reports.js`: `getForecast()` → `/reports/forecast`.
- `pages/Reports.jsx`: fetch forecast; `ChartCard` "Dự báo chi tháng sau" — số tổng + dải (A–B) +
  danh sách vài danh mục (forecast). Hiện khi đủ dữ liệu; thiếu → câu nhắc. Tái dùng `formatAmount`.
- `i18n vi/en`: `reports.forecast*` (title, range, basis, byCategory, notEnough).

## Task 6 — Verify + giao nộp

- `pytest` (toàn bộ + mới) xanh; `ruff check` + `ruff format` sạch; `npm test` + `npm run build` xanh.
- **Live**: ghi chi ở 3 tháng gần nhất → Báo cáo hiện thẻ dự báo; Trợ lý "dự báo chi tháng sau" → khớp số.
- Commit/push, **PR vào `develop`**. **Không** trailer `Co-Authored-By`.

---

## Cấu trúc file

```
backend/app/services/forecast.py            (mới — forecast_series, hàm thuần)
backend/app/services/report.py              (sửa — recent_monthly_expense)
backend/app/schemas/report.py               (sửa — CategoryForecast + ReportForecast)
backend/app/api/reports.py                  (sửa — GET /reports/forecast)
backend/app/services/assistant.py           (sửa — _forecast_reply + answer_query keyword + compute_answer)
backend/app/services/llm.py                 (sửa — _INTENTS + _SYSTEM expense_forecast)
backend/tests/test_forecast.py              (mới)
backend/tests/{test_reports,test_assistant,test_llm}.py  (sửa)
frontend/src/api/reports.js                 (sửa — getForecast)
frontend/src/pages/Reports.jsx              (sửa — thẻ dự báo)
frontend/src/i18n/locales/{vi,en}.json      (sửa — reports.forecast*)
```
Tái dùng: `build_summary` (total_expense + by_category), pattern endpoint `/reports/allocation`,
`compute_answer`/`answer_query`/`_INTENTS`, `ChartCard`/`formatAmount`, mock `classify_message`.
**Không model/migration.**

## Standards áp dụng

- **testing/tdd** — `test_forecast.py` thuần trước (thường + biên: rỗng, 1–2 tháng, mad=0); test API +
  chatbot (rule + LLM mock); giữ test cũ xanh.
- **root/coding-style + naming** — hàm thuần, type hint, docstring tiếng Việt; ruff sạch; YAGNI (top-N
  danh mục cố định, không cấu hình).
- **api/fastapi** — endpoint read-only `/reports/*`, Pydantic schema, lọc `space_id`.
- (Không **database/migrations**.)

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
cd ../frontend && npm test && npm run build
# live: ghi chi 3 tháng gần nhất → Báo cáo thẻ "Dự báo chi tháng sau"; Trợ lý "dự báo chi tháng sau"
```
Kịch bản: chi 3 tháng = 1tr/2tr/3tr (Ăn uống) → dự báo tháng sau ~2tr, dải theo MAD (~0.67tr) → khoảng
1.33–2.67tr; thẻ Báo cáo + Trợ lý khớp. Thiếu <1 tháng → "chưa đủ dữ liệu". Test BE+FE + build xanh.
