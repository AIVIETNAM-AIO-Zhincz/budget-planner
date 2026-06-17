# Dự báo chi tiêu tháng sau — Shaping Notes

## Scope

Thêm **dự báo chi tiêu tháng sau** (tổng + theo danh mục) từ lịch sử bằng **trung bình trượt 3 tháng**.
Feature AI đầu của Phase 4, sau khi hoàn tất cụm chatbot tư vấn (v0.3.0). Engine thuần + endpoint +
intent chatbot + thẻ Báo cáo. KHÔNG dùng ML phức tạp (YAGNI) — rule-based, bám "không bịa".

## Decisions (đã chốt với chủ repo)

1. **Phương pháp**: trung bình trượt 3 tháng hoàn chỉnh gần nhất (loại tháng đang dở) + dải ± MAD (độ
   lệch tuyệt đối trung bình).
2. **Phạm vi**: tổng chi + theo danh mục (top ~5 theo chi gần đây).
3. **Surface**: thẻ "Dự báo chi tháng sau" ở Báo cáo + intent chatbot `expense_forecast` + API
   `/reports/forecast` (nhất quán allocation/goal).
4. **Nhánh** `feature/budget-planner-forecast` từ `develop`. **Không model/migration**.

## Context

- **Visuals:** None.
- **References:** `services/report.py build_summary` (total_expense + by_category), `api/reports.py`
  (`/reports/allocation` mẫu), `schemas/report.py`, `services/assistant.py` (compute_answer/answer_query),
  `services/llm.py` (_INTENTS), `pages/Reports.jsx` (ChartCard). Xem `references.md`.
- **Product alignment:** roadmap **Phase 4 (AI phân tích)** — "Dự báo chi tiêu tháng sau".

## Standards Applied

- **testing/tdd** — `test_forecast.py` thuần viết trước; case thường + biên (rỗng, 1–2 tháng, mad=0);
  test API + chatbot (rule + LLM mock); giữ test cũ xanh.
- **root/coding-style + naming** — hàm thuần, type hint, docstring tiếng Việt; ruff sạch; YAGNI.
- **api/fastapi** — endpoint read-only `/reports/forecast`, Pydantic schema, lọc `space_id`.
- (Không **database/migrations** — không đổi schema.)
