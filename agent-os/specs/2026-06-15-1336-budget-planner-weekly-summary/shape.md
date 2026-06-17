# Tóm tắt tài chính tuần — Shaping Notes

## Scope

Thêm **tóm tắt tài chính tuần**: backend tính số liệu tuần (thu/chi/net + thay đổi % so tuần trước +
top danh mục) và **phát hiện bất thường** (danh mục chi vọt so mức thường), dựng **câu tóm tắt tiếng
Việt bằng template** (deterministic, không bịa). Phase 4, backlog 6.4. Hiển thị thẻ Dashboard + intent
chatbot + API.

## Decisions (đã chốt với chủ repo)

1. **Lời văn**: template thuần (không LLM) — test xác định.
2. **Surface**: thẻ "Tóm tắt tuần" ở Dashboard + intent chatbot `weekly_summary` + API
   `/reports/weekly-summary`.
3. **Phương pháp bất thường**: danh mục tuần này ≥ `MIN_FLOOR` (200k) và ≥ `ANOMALY_FACTOR` (1.5×)
   trung bình các tuần trước → cảnh báo. Cửa sổ 7 ngày (hiện tại + 3 tuần trước).
4. **Nhánh** `feature/budget-planner-weekly-summary` từ `develop`. **Không model/migration**.

## Context

- **Visuals:** None.
- **References:** `services/report.py build_summary` (+ `recent_monthly_expense` mẫu lắp nhiều kỳ),
  `api/reports.py` (`/reports/forecast` mẫu), `schemas/report.py` (`CategoryAmount`),
  `services/assistant.py` (compute_answer/answer_query) + `llm.py` (_INTENTS), `pages/Dashboard.jsx`
  (`SectionCard`). Xem `references.md`.
- **Product alignment:** roadmap **Phase 4 (AI phân tích)** + backlog **6.4** (tóm tắt tuần AI).

## Standards Applied

- **testing/tdd** — `test_weekly.py` thuần trước; case thường + biên (1 tuần → Δ None, rỗng → "chưa có",
  khoản < floor bỏ qua, ổn định → không anomaly); test API + chatbot (rule + LLM mock); giữ test cũ xanh.
- **root/coding-style + naming** — hàm thuần, type hint, docstring tiếng Việt; `UPPER_SNAKE`
  (`ANOMALY_FACTOR`/`MIN_FLOOR`); ruff sạch; YAGNI.
- **api/fastapi** — endpoint read-only `/reports/weekly-summary`, Pydantic schema, lọc `space_id`.
- (Không **database/migrations** — không đổi schema.)
