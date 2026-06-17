# References for Engine đề xuất & đánh giá phân bổ

## Similar Implementations

### Nguồn số liệu (input của engine)

- **Location:** `conquer/budget-planner/backend/app/services/report.py` → `build_summary`
- **Relevance:** đã trả `total_income`, `total_expense`, `by_need_level=[{need_level, amount}]` (map
  giao dịch→need_level qua tên+space, mặc định "optional"). Engine chỉ **đọc dict này**, không truy DB lại.
- **Key patterns:** `outerjoin Category` + `coalesce(need_level,'optional')`; group + sum.

### Mẫu endpoint reports

- **Location:** `conquer/budget-planner/backend/app/api/reports.py`
- **Relevance:** endpoint read-only `/reports/summary` + `/reports/annual` — mẫu cho `/reports/allocation`
  (lọc `space_id`, `_parse(from/to)`, `response_model`).
- **Key patterns:** `Depends(get_current_space_id)`, `_parse`, gọi service rồi trả dict.

### Schema reports

- **Location:** `conquer/budget-planner/backend/app/schemas/report.py`
- **Relevance:** `NeedLevelAmount`/`ReportSummary` — thêm `AllocationGroup` + `ReportAllocation` cùng style.

### Chatbot intent (data-driven, "không bịa")

- **Location:** `conquer/budget-planner/backend/app/services/assistant.py`
- **Relevance:** `compute_answer(db, space_id, intent, today)` map intent cố định → text; `answer_query`
  khớp keyword rule; `_month_range`/`_month_amount` sẵn có (từ slice FAQ). FAQ chạy **trước** answer_query.
- **Key patterns:** thêm intent `allocation_review` vào `compute_answer` + keyword vào `answer_query`.

### Tầng LLM

- **Location:** `conquer/budget-planner/backend/app/services/llm.py`
- **Relevance:** `_INTENTS` + `_SYSTEM` — thêm `allocation_review` (LLM `kind:"question"`, chỉ chọn
  intent; backend tính). `parse_llm_json` validate intent ∈ `_INTENTS`.

### Widget Báo cáo

- **Location:** `conquer/budget-planner/frontend/src/pages/Reports.jsx` + `ChartCard`
- **Relevance:** đã fetch `summary` (getSummary) và render `ChartCard` (donut `by_need_level`,
  `needLevel.*` i18n). Thêm `getAllocation` + `AllocationCard` trong một `ChartCard`.
- **Key patterns:** `useMemo` từ summary, `ChartCard` wrapper (`.gsap-in`), màu need_level, `formatAmount`.

### Test mock LLM

- **Location:** `conquer/budget-planner/backend/tests/test_llm.py`
- **Relevance:** `monkeypatch.setattr(llm, "classify_message", lambda ...)` — mẫu test route
  `allocation_review` không gọi mạng.
