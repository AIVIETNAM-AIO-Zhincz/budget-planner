# Đánh giá khả thi mục tiêu — Shaping Notes

## Scope

Thêm năng lực **đánh giá khả thi mục tiêu tiết kiệm** cho chatbot + trang Goals (Production Description:
"đưa ra một mục tiêu → khả thi không, mất bao lâu, cần bao nhiêu/tháng"). Slice #3 của loạt "chatbot tư
vấn" (sau FAQ #35, allocation #36). Giới hạn: engine thuần + chatbot phân tích mục tiêu nhập bằng lời +
thẻ khả thi cho Goal sẵn có. KHÔNG làm hồ sơ người dùng (slice sau).

## Decisions (đã chốt với chủ repo)

1. **Phạm vi**: đánh giá khả thi mục tiêu.
2. **Khả năng để dành/tháng** = **net tháng hiện tại (thu − chi)** từ giao dịch (tái dùng). Net ≤ 0 →
   verdict `no_surplus` + gợi ý.
3. **Triển khai**: chatbot (parse NL "để dành 100tr trong 2 năm") + widget Goals (thẻ khả thi: ETA +
   cần/tháng). Engine thuần + API (nhúng vào GoalRead).
4. **Stack trên nhánh allocation**: `feature/budget-planner-goal-feasibility` từ
   `feature/budget-planner-allocation` (cả ba slice đụng `assistant.py`/`llm.py`; #35/#36 chưa merge
   develop). PR base = nhánh allocation, retarget develop sau.
5. **Không model/migration** — Goals đã có `target_amount/saved_amount/deadline`.

## Context

- **Visuals:** None.
- **References:** `models.Goal`, `schemas/goal.py GoalRead`, `api/goals.py _to_read`,
  `services/report.py build_summary`, `services/assistant.py` (parse_amount, _month_amount,
  compute_answer/_route_llm), `services/llm.py` (kinds), `services/allocation.py` (mẫu `assess_*`),
  `pages/Goals.jsx` (GoalCard). Xem `references.md`.
- **Product alignment:** roadmap **Phase 3 (AI phân tích & trợ lý)** — gợi ý cá nhân hoá; Production
  Description mục đánh giá mục tiêu.

## Standards Applied

- **testing/tdd** — `test_goal.py` thuần viết trước; case thường + biên (done, no_surplus, hạn đã qua,
  ceil); test API (feasibility) + chatbot (rule + LLM mock); giữ test cũ xanh.
- **root/coding-style + naming** — hàm thuần, type hint, docstring tiếng Việt; ruff sạch; YAGNI.
- **api/fastapi** — GoalRead schema rõ; lọc `space_id`; feasibility nhúng GoalRead (không endpoint thừa).
- (Không **database/migrations** — không đổi schema.)
