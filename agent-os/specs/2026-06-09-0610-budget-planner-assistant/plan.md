# Budget Planner — Trợ lý AI (nhập NL + hỏi-đáp số liệu, rule-based)

## Context

Roadmap Phase 1: "Nhập giao dịch bằng ngôn ngữ tự nhiên" + trợ lý hỏi-đáp. Spec này thêm **trang "Trợ lý"** dạng chat: gõ "ăn trưa 50k hôm qua" → bot **parse** thành nháp giao dịch → **mở form xác nhận** (prefill) để lưu; và trả lời vài câu hỏi số liệu cơ bản ("tháng này chi bao nhiêu?", "số dư ví?"). Parser **rule-based** (regex tiếng Việt, deterministic, không cần API key — đúng "không để LLM tự bịa số"). Full-stack.

**Quyết định đã chốt:**
- Parser **rule-based**; luồng parse → **mở form xác nhận** (không tạo tự động).
- Trang **"Trợ lý"** riêng (nav + chat UI). Phạm vi: **nhập giao dịch NL + hỏi-đáp số liệu** (chi/thu tháng, số dư ví).
- Không cần migration. TDD backend. Nhánh `feature/budget-planner-assistant` từ `develop` (sync trước — PR #9 đã merge).

## Hợp đồng hiện có

- `app/services/categorizer.py` — `suggest_category(note)` (gợi ý danh mục theo keyword) → tái dùng cho draft.
- `app/models`: `Transaction`, `Wallet`. `app/rbac`: `get_current_space_id`, `get_current_user`.
- FE: `TransactionFormDialog` (prefill/edit), `api/transactions.js` (createTransaction), `nav.js`, `App.jsx` lazy route, theme/BrandDialog, `formatAmount`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-0610-budget-planner-assistant/`.

## Task 2 — Backend Trợ lý: parser + Q&A + endpoint (TDD)

- `app/services/assistant.py` (rule-based, hàm thuần nhận `today` để test):
  - `parse_amount(text) -> float|None`: "50k"/"50 k", "1tr"/"1.5tr"/"1 triệu", "50 nghìn/ngàn", "50.000"/"50000"/"1.000.000".
  - `parse_date(text, today) -> date`: "hôm nay/qua/kia", "X ngày trước", "dd/mm[/yyyy]"; mặc định today.
  - `parse_type(text) -> str`: keyword thu/nhận/lương/thưởng/bán → income, else expense.
  - `parse_transaction(text, today) -> dict|None`: có số tiền → `{amount,type,note,category_name(suggest),date}`; note = text gọn (bỏ token số/ngày nếu được).
  - `answer_query(db, space_id, text, today) -> str|None`: intent "chi/thu + tháng/bao nhiêu" → tổng chi/thu tháng hiện tại; "số dư/ví" → tổng số dư + theo ví; None nếu không khớp.
  - `handle_message(db, space_id, text, today) -> dict`: thử `answer_query` → `{kind:"answer", reply}`; rồi `parse_transaction` → `{kind:"transaction", reply, draft}`; còn lại `{kind:"unknown", reply}`.
- `app/schemas/assistant.py`: `AssistantRequest(text)`, `TransactionDraft(amount,type,note,category_name,date)`, `AssistantReply(kind, reply, draft: TransactionDraft|None)`.
- `app/api/assistant.py`: `POST /assistant/message` (`Depends(get_current_space_id)` — viewer+; không tạo dữ liệu, chỉ parse/đọc). Wire `main.py`.
- `tests/test_assistant.py`: parse số tiền (k/tr/nghìn/dấu chấm); ngày (hôm qua/kia/X ngày trước); loại (thu/chi); draft đầy đủ + danh mục; Q&A chi tháng (tạo vài chi → hỏi → reply chứa số); số dư ví; unknown.

## Task 3 — FE api + nav + route + dialog prefill

- `src/api/assistant.js`: `sendMessage(text)` (POST /assistant/message).
- `src/constants/nav.js`: thêm `assistant` (icon chat) nhóm overview; `App.jsx` lazy route `/assistant`; TopBar title; i18n `nav.assistant`.
- `src/components/TransactionFormDialog.jsx`: đổi `isEdit = Boolean(initial?.id)` để **prefill cho tạo mới** (nháp không có id → chế độ tạo, điền sẵn). (Trang Transactions không ảnh hưởng — bản ghi sửa luôn có id.)

## Task 4 — FE Trang Trợ lý (chat)

`src/pages/Assistant.jsx`:
- Khung chat: danh sách bong bóng (user phải, bot trái), ô nhập + nút gửi (Enter để gửi). Lời chào gợi ý mẫu câu.
- Gửi: thêm bong bóng user → `sendMessage` → thêm bong bóng bot (`reply`). Nếu `kind==="transaction"` → bong bóng bot kèm **thẻ nháp** (số tiền/loại/danh mục/ngày) + nút **"Mở form xác nhận"** → mở `TransactionFormDialog` với `initial = draft` (tạo mới, prefill). Lưu xong → toast + bot xác nhận "Đã lưu".
- Trạng thái gửi (loading), lỗi `ApiError` → bong bóng bot lỗi.

## Task 5 — i18n

`vi.json`/`en.json`: `nav.assistant`, `pages.assistant`/`assistantDesc`, `assistant.*` (greeting, placeholder, send, draftTitle, openForm, saved, error, unknown, examples). Mọi chữ `t()`.

## Task 6 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh; `alembic` autogenerate no-op.
- FE: `npm run build` xanh.
- Live (restart backend + dev): vào Trợ lý → "ăn trưa 50k hôm qua" → bot hiểu Chi 50.000 / Ăn uống / hôm qua → mở form prefill → lưu (số dư ví nếu chọn). "tháng này chi bao nhiêu?" → bot trả tổng chi. "số dư ví?" → bot liệt kê.

---

## Cấu trúc file

```
backend/app/services/assistant.py · schemas/assistant.py · api/assistant.py  (mới)
backend/app/main.py                         (sửa — include assistant)
backend/tests/test_assistant.py             (mới)
frontend/src/api/assistant.js               (mới)
frontend/src/pages/Assistant.jsx            (mới)
frontend/src/components/TransactionFormDialog.jsx  (sửa — isEdit theo id)
frontend/src/constants/nav.js · App.jsx · layout/TopBar.jsx  (sửa)
frontend/src/i18n/locales/vi.json · en.json (sửa)
```
Tái dùng: `suggest_category`, `Transaction`/`Wallet` model, `get_current_space_id`, `TransactionFormDialog`, `createTransaction`, `formatAmount`, `BrandDialog`/theme.

## Standards áp dụng

- **api/fastapi** — endpoint lọc `space_id`; HTTP code chuẩn; không tạo dữ liệu ở parse (chỉ form xác nhận mới tạo, member+).
- **testing/tdd** — test trước parser (số/ngày/loại) + Q&A + unknown; deterministic (truyền `today`).
- **coding-style** — parser là **hàm thuần** dễ test; YAGNI (rule-based, không thêm dep). **database/migrations** — không revision mới.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live: restart uvicorn :8000 ; dev :5173
```
Kịch bản: nhập NL → form prefill → lưu · hỏi chi tháng/số dư ví · câu lạ → "chưa hiểu".
