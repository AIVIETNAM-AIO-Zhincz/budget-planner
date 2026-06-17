# References for Tóm tắt tài chính tuần

## Similar Implementations

### Lắp nhiều kỳ + endpoint (mẫu forecast)

- **Location:** `conquer/budget-planner/backend/app/services/report.py` (`recent_monthly_expense`) +
  `app/api/reports.py` (`/reports/forecast`)
- **Relevance:** mẫu lắp chuỗi nhiều kỳ bằng cách gọi `build_summary` cho từng cửa sổ, rồi engine thuần
  → schema. `weekly_windows`/`/reports/weekly-summary` làm tương tự với cửa sổ 7 ngày.
- **Key patterns:** vòng lặp cửa sổ + `build_summary(start, end)`; `_next_*_label`.

### Nguồn số liệu

- **Location:** `conquer/budget-planner/backend/app/services/report.py` → `build_summary`
- **Relevance:** trả `total_income/total_expense` + `by_category` cho một khoảng → dùng cho mỗi tuần.

### Schema reports

- **Location:** `conquer/budget-planner/backend/app/schemas/report.py`
- **Relevance:** `CategoryAmount` tái dùng cho `top_categories`; thêm `WeeklyAnomaly`/`WeeklySummary`.

### Chatbot intent (data-driven, "không bịa")

- **Location:** `conquer/budget-planner/backend/app/services/assistant.py` + `app/services/llm.py`
- **Relevance:** `compute_answer`/`answer_query` (keyword; FAQ trước) + `_INTENTS`. Thêm intent
  `weekly_summary`; keyword "tóm tắt"/"tuần ... thế nào" đặt trước rule chi/thu.

### Widget Dashboard

- **Location:** `conquer/budget-planner/frontend/src/pages/Dashboard.jsx` (`SectionCard`)
- **Relevance:** thẻ widget tiêu đề + nội dung → đặt "Tóm tắt tuần" (text + chip cảnh báo). `formatAmount`.

### Test mock LLM

- **Location:** `conquer/budget-planner/backend/tests/test_llm.py` — `monkeypatch.setattr(llm,
  "classify_message", ...)` cho route `weekly_summary`.
