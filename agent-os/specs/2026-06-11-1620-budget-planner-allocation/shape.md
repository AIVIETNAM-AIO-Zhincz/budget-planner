# Engine đề xuất & đánh giá phân bổ — Shaping Notes

## Scope

Thêm **engine đánh giá ngân sách hiện tại "hợp lý/chưa" + đề xuất phân bổ** theo quy tắc 50/30/20 và
pay-yourself-first — feature trung tâm của Production Description ("qua thu/chi hiện tại đánh giá phân bổ
đã hợp lý chưa, nếu chưa thì đề xuất"). Slice #2 của loạt "chatbot tư vấn" (sau FAQ — PR #35). Giới hạn:
engine thuần trên số liệu thật + endpoint + chatbot intent + 1 thẻ ở trang Báo cáo. KHÔNG làm hồ sơ
người dùng hay đánh giá khả thi mục tiêu (slice sau).

## Decisions (đã chốt với chủ repo)

1. **Phạm vi**: Engine đề xuất & đánh giá phân bổ.
2. **Gốc thu nhập**: thu nhập **thực tế** của tháng từ giao dịch (tái dùng `build_summary`/`_month_*`),
   chưa cần model hồ sơ. Tháng chưa ghi thu → verdict `"unknown"` + tư vấn chung.
3. **Ánh xạ rule 50/30/20**: thiết yếu = `mandatory` ≤ 50% thu nhập · mong muốn = `optional` ≤ 30% ·
   **tiết kiệm = (thu − chi)/thu ≥ 20%** · `wasteful` (lãng phí) cảnh báo cắt giảm riêng.
4. **Widget**: trang **Báo cáo** (cạnh donut `by_need_level`). Chatbot intent `allocation_review` + API
   `/reports/allocation` luôn có.
5. **Stack trên nhánh FAQ**: `feature/budget-planner-allocation` tạo từ `feature/budget-planner-faq`
   (FAQ #35 chưa merge develop, hai slice đụng cùng `assistant.py`/`llm.py`). PR base = nhánh FAQ, retarget
   develop sau khi FAQ merge.
6. **Không model/migration** — engine là hàm thuần.

## Context

- **Visuals:** None.
- **References:** `services/report.py build_summary` (income/expense/by_need_level), `api/reports.py`
  (mẫu endpoint), `schemas/report.py`, `services/assistant.py` (`compute_answer`/`answer_query`/
  `_month_range`), `services/llm.py` (`_INTENTS`/`_SYSTEM`), `pages/Reports.jsx` + `ChartCard`. Xem
  `references.md`.
- **Product alignment:** roadmap **Phase 3 (AI phân tích & trợ lý)** — "gợi ý tiết kiệm cá nhân hoá";
  Production Description mục đánh giá phân bổ + đề xuất (50/30/20, pay-yourself-first).

## Standards Applied

- **testing/tdd** — `test_allocation.py` thuần viết trước; case thường + biên (income=0, vượt ngưỡng,
  wasteful); test API + chatbot (LLM mock + rule); giữ test cũ xanh.
- **root/coding-style + naming** — hàm thuần, type hint, docstring tiếng Việt, `UPPER_SNAKE` (`TARGETS`),
  ruff sạch; YAGNI.
- **api/fastapi** — endpoint read-only `/reports/*`, Pydantic schema, lọc `space_id`.
- (Không **database/migrations** — không đổi schema.)
