# Budget Planner — Đánh giá khả thi mục tiêu (Phase 3, slice #3)

## Context

Production Description: *"Khi đưa ra một mục tiêu tài chính, chatbot có thể đánh giá mục tiêu đó có khả
thi với mức thu nhập hiện tại không? và mất bao lâu? với số tiền bao nhiêu?"*. Slice #1 (FAQ — PR #35)
và #2 (engine phân bổ — PR #36) đã xong; slice này thêm **đánh giá khả thi mục tiêu tiết kiệm**.

**Quyết định đã chốt với chủ repo:**
- **Khả năng để dành/tháng** = **net tháng hiện tại (thu − chi)** từ giao dịch (tái dùng). Net ≤ 0 →
  verdict `no_surplus` + gợi ý.
- **Triển khai**: **chatbot** (phân tích mục tiêu nhập bằng lời "để dành 100tr trong 2 năm") + **widget
  Goals** (thẻ khả thi cho từng Goal sẵn có: ETA + cần/tháng). Engine thuần + API luôn có.
- **Không model/migration** — engine là hàm thuần; Goals đã có sẵn `target_amount/saved_amount/deadline`.
- **Stack trên nhánh allocation**: `feature/budget-planner-goal-feasibility` tạo từ
  `feature/budget-planner-allocation` (FAQ #35 + allocation #36 chưa merge develop; cả ba đụng
  `assistant.py`/`llm.py`). PR base = nhánh allocation; retarget develop sau khi #35→#36 merge.

## Sự thật đã khảo sát

- **Goal** (`models/__init__.py`): `target_amount`, `wallet_id`, `deadline (date|None)`, `fund_type`.
  `GoalRead` (`schemas/goal.py`) đã có `saved_amount` (= số dư ví), `percent`. `_to_read` (`api/goals.py`)
  dựng GoalRead per-goal; endpoint list/get/create/contribute/update đều gọi nó.
- **`services/report.py build_summary`** cho income/expense theo khoảng → thêm `current_month_net`.
- **`services/assistant.py`**: `parse_amount` (50k/1.5tr/50.000 — **chưa hỗ trợ "tỷ"**); `_month_amount`;
  `compute_answer`/`answer_query`/`_route_llm`/`handle_message` (LLM → FAQ → answer_query → nháp →
  unknown); đã import `build_summary`.
- **`services/llm.py`**: kind `transaction|question|faq|other`; thêm kind `goal` (trích target+timeframe).
- **FE `pages/Goals.jsx`**: GoalCard hiện `percent`, `deadline`/`noDeadline`. Thêm dòng khả thi.
  `formatAmount`; i18n `goals.*`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-12-1725-budget-planner-goal-feasibility/` (plan/shape/standards/references).

## Task 2 — BE: engine `goal.py` (hàm thuần) — TDD

`backend/app/services/goal.py` (mới), **thuần**:
- `parse_timeframe_months(text) -> int | None`: "X năm" → X×12; "X tháng" → X; None nếu không có.
- `assess_goal(target_amount, saved_amount, monthly_capacity, months_left=None) -> dict`:
  - `remaining = max(0, target − saved)`; nếu 0 → `verdict="done"`.
  - `monthly_capacity ≤ 0` → `verdict="no_surplus"` (months_needed=None).
  - else `months_needed = ceil(remaining/capacity)`; nếu `months_left` có:
    `required_monthly = remaining/months_left`, `feasible = required_monthly ≤ capacity`,
    `verdict = "on_track"|"tight"`; hạn đã qua (`months_left ≤ 0`) → `tight`. Không deadline → `on_track`.
  - trả `target/saved/remaining/monthly_capacity/months_needed/required_monthly/months_left/feasible/verdict`.
- **Test trước** `tests/test_goal.py`: parse_timeframe (năm/tháng/none); assess_goal mọi verdict
  (done, no_surplus, on_track không hạn, on_track kịp hạn, tight không kịp, hạn đã qua); ceil đúng.

## Task 3 — BE: `parse_amount` hỗ trợ "tỷ" + `current_month_net` — TDD

- `assistant.parse_amount`: thêm nhánh `tỷ|tỉ` (×1e9) trước nhánh tr; `_clean_note` thêm `tỷ|tỉ`.
  **Test** `test_assistant.py`: `parse_amount("2 tỷ")==2_000_000_000`; giữ test cũ xanh.
- `report.current_month_net(db, space_id, today) -> float` = income − expense tháng hiện tại (qua
  `build_summary`). **Test** `test_reports.py` (hoặc test_goal qua API ở Task 4).

## Task 4 — BE: GoalRead.feasibility + chatbot intent goal — TDD

- `schemas/goal.py`: `GoalFeasibility{verdict, months_needed:int|None, required_monthly:float|None,
  months_left:int|None, monthly_capacity:float, feasible:bool|None}`; `GoalRead.feasibility`.
- `api/goals.py`: tính `cap = current_month_net(...)` 1 lần/endpoint; `_to_read(db, goal, cap)` gọi
  `assess_goal(target, saved, cap, months_left=_months_until(deadline, today))`. Helper `_months_until`.
- `assistant.py`: `parse_goal(text)` (gate keyword "mục tiêu/để dành/muốn (có)/dành dụm/tích góp" +
  `parse_amount` → `{target_amount, months}`); `_goal_reply(db, space_id, target, months, today)` (cap =
  `current_month_net`, `assess_goal(target, 0, cap, months)`, ghép text khả thi); `handle_message` chèn
  goal **sau answer_query, trước parse_transaction**; `_route_llm` xử lý kind `goal`.
- `llm.py`: kind `goal` → `{target_amount, months|null}` (validate >0); `_SYSTEM` mô tả.
- **Test**: `test_goals.py` (GoalRead có feasibility đúng khi có thu/chi); `test_assistant.py`
  ("muốn để dành 100tr trong 2 năm" → kind answer + ETA/khả thi); `test_llm.py` (parse goal + route mock).

## Task 5 — FE: dòng khả thi trong GoalCard

- `Goals.jsx`: với mỗi goal dùng `g.feasibility` → caption/chip:
  on_track ("Dự kiến đạt sau ~N tháng" + "kịp hạn ✓" nếu có deadline) · tight (chip warning "Khó kịp hạn"
  + "cần ~X ₫/tháng, hiện ~Y ₫/tháng") · no_surplus ("Tháng này chưa có dư để dành") · done (ẩn).
  Tái dùng `formatAmount`, `LinearProgress` pattern.
- `i18n vi/en`: `goals.feasibility.*` (etaMonths, onTrackDeadline, tight, needPerMonth, noSurplus).

## Task 6 — Verify + giao nộp

- `pytest` (toàn bộ + mới) xanh; `ruff check .` + `ruff format` sạch (CI `ruff format --check`).
- `npm test` + `npm run build` xanh.
- **Live**: ghi thu>chi tháng này; tạo Goal có/không deadline → thẻ hiện ETA/cần/tháng; hỏi Trợ lý
  "tôi muốn để dành 100 triệu trong 2 năm" → đánh giá khả thi.
- Commit/push, **PR base = `feature/budget-planner-allocation`**. **Không** trailer `Co-Authored-By`.

---

## Cấu trúc file

```
backend/app/services/goal.py                (mới — parse_timeframe_months + assess_goal, thuần)
backend/app/services/report.py              (sửa — current_month_net)
backend/app/services/assistant.py           (sửa — parse_amount 'tỷ', parse_goal, _goal_reply, route)
backend/app/services/llm.py                 (sửa — kind 'goal')
backend/app/schemas/goal.py                 (sửa — GoalFeasibility + GoalRead.feasibility)
backend/app/api/goals.py                    (sửa — cap + _to_read(cap) + _months_until)
backend/tests/test_goal.py                  (mới — engine thuần)
backend/tests/{test_assistant,test_llm,test_goals,test_reports}.py  (sửa)
frontend/src/pages/Goals.jsx                (sửa — dòng khả thi)
frontend/src/i18n/locales/{vi,en}.json      (sửa — goals.feasibility.*)
```
Tái dùng: `build_summary`/`_month_amount`, `parse_amount`, `_to_read`, `assess_*` pattern (như
allocation), GoalCard/`formatAmount`, mock `classify_message`. **Không model/migration.**

## Standards áp dụng

- **testing/tdd** — `test_goal.py` thuần trước; case thường + biên (done, no_surplus, hạn đã qua,
  ceil); test API (feasibility) + chatbot (rule + LLM mock); giữ test cũ xanh.
- **root/coding-style + naming** — hàm thuần, type hint, docstring tiếng Việt; ruff sạch; YAGNI.
- **api/fastapi** — GoalRead schema rõ; lọc `space_id`; không thêm endpoint thừa (feasibility nhúng
  GoalRead). Chatbot read-only.
- (Không **database/migrations**.)

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
cd ../frontend && npm test && npm run build
# live: thu>chi tháng này + tạo Goal → thẻ ETA/cần-tháng; Trợ lý "để dành 100tr trong 2 năm" → khả thi
```
Kịch bản: net tháng 5tr; Goal 60tr không deadline → "đạt sau ~12 tháng" (on_track); Goal 60tr deadline
6 tháng → cần 10tr/tháng > 5tr → tight "khó kịp hạn"; net ≤ 0 → no_surplus. Chatbot "để dành 100tr trong
2 năm" (saved 0): cần ~4,17tr/tháng, so net hiện tại → on_track/tight. Test BE+FE + build xanh.
