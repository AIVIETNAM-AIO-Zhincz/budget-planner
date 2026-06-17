# References for Dự báo chi tiêu tháng sau

## Similar Implementations

### Engine thuần + endpoint (mẫu allocation)

- **Location:** `conquer/budget-planner/backend/app/services/allocation.py` +
  `app/api/reports.py` (`/reports/allocation`)
- **Relevance:** mẫu engine thuần `assess_*` + endpoint gọi `build_summary` → engine → schema.
  `forecast.py`/`/reports/forecast` làm tương tự.

### Nguồn lịch sử

- **Location:** `conquer/budget-planner/backend/app/services/report.py` → `build_summary`
- **Relevance:** trả `total_expense` + `by_category=[{name, amount}]` cho một khoảng → gọi cho từng
  tháng (M-3..M-1) dựng chuỗi. Thêm `recent_monthly_expense(db, space_id, today, months)`.
- **Key patterns:** `build_summary(start, end)`; mốc tháng như `current_month_net`/`_month_range`.

### Schema reports

- **Location:** `conquer/budget-planner/backend/app/schemas/report.py`
- **Relevance:** `NeedLevelAmount`/`ReportAllocation` mẫu — thêm `CategoryForecast` + `ReportForecast`.

### Chatbot intent (data-driven, "không bịa")

- **Location:** `conquer/budget-planner/backend/app/services/assistant.py` + `app/services/llm.py`
- **Relevance:** `compute_answer`/`answer_query` (keyword rule; FAQ chạy trước) + `_INTENTS`. Thêm
  intent `expense_forecast`. ⚠ Keyword forecast đặt **trước** rule "chi/thu + tháng".

### Widget Báo cáo

- **Location:** `conquer/budget-planner/frontend/src/pages/Reports.jsx` + `ChartCard`
- **Relevance:** fetch summary + `ChartCard` + `formatAmount`. Thêm `getForecast` + thẻ dự báo.

### Test mock LLM

- **Location:** `conquer/budget-planner/backend/tests/test_llm.py` — `monkeypatch.setattr(llm,
  "classify_message", ...)` cho route `expense_forecast`.
