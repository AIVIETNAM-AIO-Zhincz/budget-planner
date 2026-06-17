# References for Đánh giá khả thi mục tiêu

## Similar Implementations

### Engine assess_* (mẫu cho goal.py)

- **Location:** `conquer/budget-planner/backend/app/services/allocation.py`
- **Relevance:** mẫu engine thuần `assess_allocation` (nhận số liệu → verdict + findings). `goal.py` làm
  tương tự với `assess_goal` (verdict on_track/tight/no_surplus/done).
- **Key patterns:** hằng + hàm thuần, không DB, trả dict.

### Goals (model + API + schema)

- **Location:** `backend/app/models/__init__.py` (Goal), `backend/app/schemas/goal.py` (GoalRead có
  `saved_amount`/`percent`), `backend/app/api/goals.py` (`_to_read` per-goal, gọi ở list/get/create/
  contribute/update).
- **Relevance:** thêm `feasibility` vào GoalRead; `_to_read(db, goal, cap)` nhận capacity tính 1 lần.
- **Key patterns:** `saved_amount = wallet.balance`; `deadline (date|None)`.

### Nguồn capacity

- **Location:** `backend/app/services/report.py build_summary`
- **Relevance:** thêm `current_month_net(db, space_id, today)` = income − expense tháng hiện tại.

### Chatbot parse + route

- **Location:** `backend/app/services/assistant.py`
- **Relevance:** `parse_amount` (thêm "tỷ"); `_month_amount`/`build_summary` đã import; `handle_message`
  (chèn goal sau answer_query, trước parse_transaction); `_route_llm` (xử lý kind goal).
- **Key patterns:** keyword gate + `parse_amount`; reply dict `{kind, reply, draft}`.

### Tầng LLM

- **Location:** `backend/app/services/llm.py`
- **Relevance:** thêm kind `goal` → `{target_amount, months}` (validate). `parse_llm_json` theo `kind`.

### Widget Goals

- **Location:** `conquer/budget-planner/frontend/src/pages/Goals.jsx` (GoalCard)
- **Relevance:** card hiện `percent`/`deadline` → thêm dòng khả thi từ `g.feasibility`. `formatAmount`,
  `LinearProgress`, `Chip` pattern sẵn có.

### Test mock LLM

- **Location:** `backend/tests/test_llm.py` — `monkeypatch.setattr(llm, "classify_message", ...)`.
