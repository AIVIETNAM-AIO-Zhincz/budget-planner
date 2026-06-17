# Budget Planner — Engine đề xuất & đánh giá phân bổ (Phase 3, slice #2)

## Context

Đối chiếu **Production Description**, phần lõi của chatbot tư vấn là: *"thông qua thu nhập, chi tiêu
hiện tại để đánh giá xem phân bổ như hiện tại đã hợp lý hay chưa, nếu chưa thì đưa ra đề xuất"* (quy tắc
50/30/20, pay-yourself-first). Slice #1 (FAQ tri thức — PR #35) đã xong; slice này thêm **engine đánh giá
& đề xuất phân bổ ngân sách** — feature trung tâm còn thiếu.

**Quyết định đã chốt với chủ repo:**
- **Gốc thu nhập**: thu nhập **thực tế** của tháng từ giao dịch (tái dùng số liệu có sẵn); chưa cần model
  hồ sơ. Tháng chưa ghi thu → trả tư vấn chung (verdict "unknown").
- **Ánh xạ rule 50/30/20**: thiết yếu = `mandatory` ≤ 50% thu nhập · mong muốn = `optional` ≤ 30% ·
  **tiết kiệm = (thu − chi)/thu ≥ 20%** · `wasteful` (lãng phí) cảnh báo cắt giảm riêng (đã tự trừ vào
  tiết kiệm vì nằm trong tổng chi).
- **Widget**: đặt ở **trang Báo cáo**, cạnh donut `by_need_level` hiện có. Chatbot intent + API luôn có.
- **Không model/migration** — engine là hàm thuần trên số liệu `build_summary`.
- Nhánh `feature/budget-planner-allocation` từ `develop`.

## Sự thật đã khảo sát

- **`services/report.py build_summary`** đã trả `total_income`, `total_expense`, `balance`,
  `by_need_level=[{need_level, amount}]` (map giao dịch→need_level qua tên+space, mặc định "optional").
  → Engine chỉ cần **đọc dict này**, không truy DB lại.
- **`api/reports.py`** mẫu endpoint read-only lọc `space_id` + `_parse` khoảng ngày; schema
  `schemas/report.py ReportSummary`. Thêm endpoint `/reports/allocation` cùng pattern.
- **`services/assistant.py`** `compute_answer(db, space_id, intent, today)` map intent cố định → câu
  trả lời (không bịa); `answer_query` khớp keyword rule; `_month_range`/`_month_amount` sẵn có; FAQ chạy
  **trước** answer_query. `handle_message` order: LLM → FAQ → answer_query → nháp → unknown.
- **`services/llm.py`** `_INTENTS=("expense_month","income_month","wallet_balance")` + `_SYSTEM` liệt kê
  intent; thêm `allocation_review` vào đây (LLM `kind:"question"`, backend tính — giữ "không bịa").
- **FE `pages/Reports.jsx`** đã fetch `summary` (getSummary) và render `ChartCard` + donut
  `by_need_level` (`needLevel.*` i18n, `pieOption`). Thêm `getAllocation` + thẻ đánh giá. `utils/format.js`
  `formatAmount`; `i18n vi/en` có `needLevel.*`, `reports.*`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-11-1620-budget-planner-allocation/` (plan.md, shape.md, standards.md,
references.md). Không visuals.

## Task 2 — BE: engine `allocation.py` (hàm thuần) — TDD

`backend/app/services/allocation.py` (mới), **thuần** (nhận số liệu, không DB):
- `TARGETS = {"needs": 0.50, "wants": 0.30, "savings": 0.20}` (UPPER_SNAKE hằng).
- `assess_allocation(income: float, expense: float, by_need_level: list[dict]) -> dict`:
  - Gom `by_need_level` → `mandatory/optional/wasteful` (mặc định 0 nếu thiếu).
  - `savings = income − expense`; `savings_rate = savings/income` (income>0).
  - `needs = mandatory`, `wants = optional`; pct theo income.
  - `groups`: 3 dòng `{key, actual, actual_pct, target_pct, ok}` (needs ≤50%, wants ≤30%, savings ≥20%).
  - `verdict`: `"good"` nếu cả 3 đạt và `wasteful==0`; `"warning"` nếu lệch; `"unknown"` nếu income≤0.
  - `findings: list[str]` (tiếng Việt): câu giải thích/đề xuất theo từng tiêu chí lệch + pay-yourself-first
    + cảnh báo `wasteful` (kèm số tiền). `suggested_{needs,wants,savings}` = 50/30/20 × income.
- **Test trước** `tests/test_allocation.py`: case tốt (đạt cả 3 → good, không finding cảnh báo); case
  needs>50%/wants>30%/savings<20% (warning + finding tương ứng); wasteful>0 (finding cắt giảm);
  income=0 (unknown + suggested=0); pct tính đúng.

## Task 3 — BE: endpoint `/reports/allocation` — TDD

- `schemas/report.py`: `AllocationGroup{key,actual,actual_pct,target_pct,ok}` +
  `ReportAllocation{income,expense,savings,savings_rate,wasteful,verdict,groups,findings,
  suggested_needs,suggested_wants,suggested_savings}`.
- `api/reports.py`: `GET /reports/allocation?from&to` → `build_summary` rồi `assess_allocation(...)`;
  read-only, lọc `space_id`, mẫu `_parse`.
- **Test** `tests/test_reports.py`: tạo income + category need_level + transaction → `/reports/allocation`
  trả verdict/groups/findings đúng; require token (401 khi thiếu).

## Task 4 — Chatbot: intent `allocation_review` — TDD

- `assistant.compute_answer`: thêm nhánh `intent=="allocation_review"` → `build_summary` tháng hiện tại
  (`_month_range`) → `assess_allocation` → ghép **text** (verdict + vài finding chính). Helper
  `_allocation_reply(assessment) -> str`.
- `assistant.answer_query`: keyword rule → "phân bổ" + is_question, "hợp lý chưa", "đánh giá ngân sách/chi
  tiêu" → trả `compute_answer(..., "allocation_review", ...)`. (FAQ chạy trước nên "50/30/20 là gì" vẫn ra
  kiến thức; "phân bổ của tôi hợp lý chưa" ra đánh giá.)
- `llm.py`: thêm `"allocation_review"` vào `_INTENTS` + mô tả trong `_SYSTEM` (LLM chỉ chọn intent).
- **Test**: `test_assistant.py` — "phân bổ của tôi đã hợp lý chưa?" (có income+chi) → `kind=="answer"`,
  reply chứa verdict/đề xuất; `test_llm.py` — `parse_llm_json` question `allocation_review` hợp lệ +
  route qua mock `classify_message`.

## Task 5 — FE: thẻ "Mức độ hợp lý (50/30/20)" ở Báo cáo

- `api/reports.js`: `getAllocation(range)` → `/reports/allocation`.
- `components/AllocationCard.jsx` (mới): nhận assessment → chip verdict (Hợp lý/Cần điều chỉnh), 3 dòng
  needs/wants/savings (actual% vs target%, màu ok/over), danh sách `findings`. Tái dùng `formatAmount`,
  màu need_level.
- `pages/Reports.jsx`: fetch allocation cùng summary; render `AllocationCard` trong `ChartCard`
  (`.gsap-in`, reduced-motion qua wrapper). Hiện khi `hasData`.
- `i18n vi/en`: `reports.allocation*` (title, verdictGood/Warning/Unknown, needs/wants/savings, target,
  actual...). `utils/charts.js`/màu tái dùng.

## Task 6 — Verify + giao nộp

- `pytest` (toàn bộ + mới) xanh; `ruff check .` + `ruff format` sạch (CI `ruff format --check`).
- `npm test` + `npm run build` xanh.
- **Live** (BE :8000 + FE :5173): ghi vài giao dịch thu + chi (gắn need_level) → Báo cáo hiện thẻ đánh
  giá + đề xuất; hỏi Trợ lý "phân bổ của tôi đã hợp lý chưa?" → câu đánh giá khớp.
- Commit/push, **PR vào `develop`** (GitFlow). **Không** trailer `Co-Authored-By`.

---

## Cấu trúc file

```
backend/app/services/allocation.py          (mới — assess_allocation, hàm thuần)
backend/app/schemas/report.py               (sửa — AllocationGroup + ReportAllocation)
backend/app/api/reports.py                  (sửa — GET /reports/allocation)
backend/app/services/assistant.py           (sửa — compute_answer allocation_review + answer_query keyword)
backend/app/services/llm.py                 (sửa — _INTENTS + _SYSTEM thêm allocation_review)
backend/tests/test_allocation.py            (mới — engine thuần)
backend/tests/{test_reports,test_assistant,test_llm}.py  (sửa — endpoint + chatbot)
frontend/src/api/reports.js                 (sửa — getAllocation)
frontend/src/components/AllocationCard.jsx  (mới — thẻ đánh giá)
frontend/src/pages/Reports.jsx              (sửa — fetch + render thẻ)
frontend/src/i18n/locales/{vi,en}.json      (sửa — reports.allocation*)
```
Tái dùng: `build_summary` (income/expense/by_need_level), pattern endpoint `_parse`+`space_id`,
`compute_answer`/`_month_range`, `ChartCard`/`formatAmount`/màu need_level, mock `classify_message`.
**Không model/migration.**

## Standards áp dụng

- **testing/tdd** — `test_allocation.py` thuần viết trước; case thường + biên (income=0, vượt từng
  ngưỡng, wasteful); test API + chatbot (LLM mock + rule); giữ test cũ xanh.
- **root/coding-style + naming** — hàm thuần, type hint, docstring tiếng Việt, `UPPER_SNAKE` (`TARGETS`),
  ruff sạch; YAGNI (không config rule, không model hồ sơ).
- **api/fastapi** — endpoint read-only theo tài nguyên `/reports/*`, Pydantic schema, lọc `space_id`.
- (Không **database/migrations** — không đổi schema.)

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
cd ../frontend && npm test && npm run build
# live :5173: ghi thu+chi (need_level) → Báo cáo thẻ "Mức độ hợp lý (50/30/20)" + đề xuất;
#             Trợ lý: "phân bổ của tôi đã hợp lý chưa?" → đánh giá khớp số liệu
```
Kịch bản: thu 20tr, chi 12tr (mandatory 9tr/optional 2tr/wasteful 1tr) → needs 45% ok, wants 10% ok,
tiết kiệm 40% ok nhưng wasteful>0 → cảnh báo cắt 1tr lãng phí; đề xuất 50/30/20 = 10tr/6tr/4tr. Test
BE+FE + build xanh; ruff sạch.
