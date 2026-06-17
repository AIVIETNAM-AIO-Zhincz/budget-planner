# Budget Planner — FAQ tri thức tài chính (Phase 3, slice #1)

## Context

Đối chiếu **Production Description**, phần "chatbot tư vấn tài chính" về cơ bản chưa được xây: trang
Trợ lý hiện chỉ là **trợ lý nhập giao dịch NL** + hỏi-đáp 3 số liệu (chi/thu tháng, số dư ví). Mô tả
sản phẩm yêu cầu chatbot **hỏi-đáp kiến thức tài chính cơ bản** ("nên tiết kiệm bao nhiêu %?", "quỹ
khẩn cấp nên có bao nhiêu?", "tự do tài chính cần bao nhiêu?") và **giải thích khuyến nghị**. Backlog
story **3.5/3.6** và roadmap **Phase 3 (AI phân tích & trợ lý)** đều còn Todo.

Slice này thêm **FAQ tri thức tài chính** — feature đầu trong loạt "chatbot tư vấn" (1 feature/1 PR
theo tiền lệ `need-level`). Quyết định đã chốt với chủ repo:

- **Nguồn**: KB tuyển chọn (team viết, deterministic, không bịa) + LLM khớp câu hỏi → entry + fallback
  keyword rule. Bám đúng triết lý hiện có: *LLM chỉ phân loại, backend trả nội dung chuẩn*.
- **Cá nhân hoá**: có, khi liên quan — vài câu dùng số liệu thật của user (vd quỹ khẩn cấp = 3–6× chi
  tiêu tháng thật).
- **Triển khai**: service thuần (test xác định) + tích hợp chatbot qua intent mới + widget gợi ý câu
  hỏi (chip) ở trang Trợ lý.
- **Không cần model/migration** — KB là dữ liệu tĩnh trong code (khác `need-level` ở chỗ này).
- Nhánh `feature/budget-planner-faq` từ `develop`.

## Sự thật đã khảo sát

- **`services/assistant.py`** `handle_message` định tuyến: LLM route → `answer_query` (số liệu) →
  `parse_transaction` → unknown. `_month_total` trả **chuỗi đã format**; `compute_answer` map intent
  cố định → câu trả lời. `_route_llm` dịch kết quả LLM (`transaction|question|other`).
- **`services/llm.py`** `_INTENTS=("expense_month","income_month","wallet_balance")`; `_SYSTEM` ép JSON
  `{kind,draft,question,reply}`; `parse_llm_json` validate theo `kind`. Lỗi mạng/JSON → `None` (fallback).
- **`services/categorizer.py`** là mẫu KB-keyword thuần (`_KEYWORD_RULES` + fallback) — tái dùng pattern.
- **`schemas/assistant.py`** `AssistantReply.kind: str` (transaction|answer|unknown) — `kind` là str tự
  do, thêm giá trị `"faq"` không phá schema; `draft` để `None`.
- **`api/assistant.py`** chỉ 1 endpoint `POST /assistant/message` (read-only) — **không cần endpoint mới**.
- **`core/format.py`** `format_vnd` để format số tiền.
- **FE `pages/Assistant.jsx`** đã có `quickPrompts=[q1,q2,q3]` render thành chip clickable (mẫu widget);
  `push({role:"bot", text:res.reply, draft:...})`. `api/assistant.js` trả nguyên `{kind,reply,draft}`.
- **Tests**: `test_assistant.py` (parser thuần + API), `test_llm.py` (`parse_llm_json` + route qua mock
  `classify_message`). Pattern test rõ — bám theo.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-11-1550-budget-planner-faq/` gồm `plan.md` (file này), `shape.md` (scope +
4 quyết định đã chốt), `standards.md` (nội dung chuẩn áp dụng), `references.md` (categorizer/assistant/
llm/Assistant.jsx). Không có visuals.

## Task 2 — BE: service `faq.py` (KB thuần) — TDD

`backend/app/services/faq.py` (mới), toàn **hàm thuần**:
- `FAQ_INTENTS: tuple[str, ...]` — id các entry (để LLM khớp, giống `_INTENTS`).
- Registry entry: mỗi entry có `keywords` (tuple) + hàm dựng câu trả lời `answer(ctx: dict) -> str`
  (ctx chứa số liệu thật; nếu thiếu → trả phần kiến thức chung). Format tiền qua `format_vnd`.
- `match_faq(text: str) -> str | None` — khớp keyword (lowercase), None nếu không trúng.
- `answer_faq(faq_id: str, ctx: dict) -> str | None` — None nếu id lạ.

**Entry tuyển chọn (≥5, tiếng Việt):**
1. `saving_rate` — "nên tiết kiệm bao nhiêu %": nguyên tắc ~20% (50/30/20); nếu có `monthly_income` →
   "20% ≈ X đ/tháng".
2. `emergency_fund` — "quỹ khẩn cấp nên có bao nhiêu": 3–6× chi tiêu/tháng; nếu có `monthly_expense` →
   "≈ A–B đ".
3. `financial_freedom` — "cần bao nhiêu để tự do tài chính": quy tắc 4% / 25× chi tiêu năm; nếu có
   `monthly_expense` → "≈ 25 × 12 × chi tháng = N đ".
4. `rule_50_30_20` — giải thích 50% thiết yếu / 30% mong muốn / 20% tiết kiệm.
5. `pay_yourself_first` — giải thích "trích tiết kiệm/đầu tư/trả nợ trước rồi mới phân bổ phần còn lại".

**Test trước** `tests/test_faq.py`: `match_faq` (mỗi entry 1 câu trúng + 1 câu None); `answer_faq` static
(không ctx → có nội dung kiến thức) + personalized (ctx có số → chuỗi chứa số đã format); id lạ → None;
mọi `FAQ_INTENTS` đều `answer_faq` ra chuỗi.

## Task 3 — BE: nối FAQ vào `assistant.py` (rule path) — TDD

- Tách helper số thuần `_month_amount(db, space_id, tx_type, today) -> float`; `_month_total` format lại
  từ nó (DRY).
- `_faq_context(db, space_id, today) -> dict` → `{"monthly_expense":…, "monthly_income":…}`.
- `handle_message` chèn FAQ **sau `answer_query`, trước `parse_transaction`**:
  `faq_id = faq.match_faq(text)` → nếu trúng, trả `{"kind":"faq","reply":faq.answer_faq(faq_id, ctx),"draft":None}`.
- **Test** (mở rộng `test_assistant.py`): "quỹ khẩn cấp nên có bao nhiêu?" → `kind=="faq"`, reply có nội
  dung; có giao dịch chi → reply chứa số cá nhân hoá; "50/30/20 là gì" → faq. Giữ test cũ xanh (thứ tự
  định tuyến không đụng case giao dịch/số liệu hiện có).

## Task 4 — BE: LLM khớp FAQ (giữ "không bịa") — TDD

`services/llm.py`:
- import `FAQ_INTENTS`; bổ sung `_SYSTEM` thêm nhánh `kind:"faq"` với field `"faq": <id>|null` (liệt kê
  id hợp lệ), nhấn "CHỈ chọn id, KHÔNG tự trả lời".
- `parse_llm_json`: `kind=="faq"` → `{"kind":"faq","faq":id}` nếu `id in FAQ_INTENTS`, else `None`.
- `assistant._route_llm`: `kind=="faq"` → `answer_faq(res["faq"], ctx)`; None → fallback.
- **Test** (mở rộng `test_llm.py`): `parse_llm_json` faq hợp lệ/ id lạ→None; `handle_message` mock
  `classify_message` trả `{"kind":"faq","faq":"emergency_fund"}` → `kind=="faq"` + reply chuẩn (không từ LLM).

## Task 5 — FE: widget gợi ý câu hỏi + hiển thị FAQ

- `pages/Assistant.jsx`: thêm bộ chip FAQ (3 câu ví dụ từ Production Description) cạnh quick-prompt hiện
  có (tái dùng đúng pattern `Chip … onClick={()=>send(p)}`). Tuỳ chọn nhãn nhỏ "💡 Kiến thức" khi
  `res.kind==="faq"` (lưu `kind` vào message). `greeting` cập nhật: mời hỏi kiến thức tài chính.
- `i18n vi/en`: `assistant.faq1/faq2/faq3`, (tuỳ chọn) `assistant.knowledgeTag`. `api/assistant.js` không đổi.

## Task 6 — Verify + giao nộp

- `pytest` (toàn bộ cũ + mới) xanh; `ruff check .` sạch; **`ruff format`** (CI chạy `ruff format --check`).
- `npm test` + `npm run build` xanh.
- **Live** (BE :8000 + FE :5173, LLM tắt → đi rule): hỏi "quỹ khẩn cấp nên có bao nhiêu?" → câu trả lời
  KB; thêm vài giao dịch chi → câu trả lời chứa số cá nhân hoá; chip FAQ bấm được.
- Commit/push, **PR vào `develop`** (GitFlow). **Không** thêm trailer `Co-Authored-By`.

---

## Cấu trúc file

```
backend/app/services/faq.py                 (mới — KB + match_faq + answer_faq, hàm thuần)
backend/app/services/assistant.py           (sửa — _month_amount, _faq_context, route FAQ, _route_llm)
backend/app/services/llm.py                 (sửa — kind "faq" + FAQ_INTENTS)
backend/app/schemas/assistant.py            (sửa nhẹ — comment kind: …|faq|…)
backend/tests/test_faq.py                   (mới — match/answer thuần)
backend/tests/test_assistant.py             (sửa — API FAQ + cá nhân hoá)
backend/tests/test_llm.py                   (sửa — parse faq + route faq)
frontend/src/pages/Assistant.jsx            (sửa — chip FAQ + nhãn kind)
frontend/src/i18n/locales/{vi,en}.json      (sửa — assistant.faq1..3, knowledgeTag)
```
Tái dùng: pattern KB-keyword của `categorizer.py`; `format_vnd`; endpoint `/assistant/message` (không
thêm route); pattern chip của `Assistant.jsx`; pattern test mock `classify_message` của `test_llm.py`.
**Không model/migration** (KB tĩnh trong code).

## Standards áp dụng

- **testing/tdd** — test thuần trước cho `faq.py`; mỗi hàm có case thường + biên; giữ test cũ xanh; có
  test FAQ qua đường LLM (mock) lẫn fallback.
- **root/coding-style** + **root/naming** — hàm thuần, type hint, docstring tiếng Việt, `snake_case`,
  `UPPER_SNAKE` cho `FAQ_INTENTS`; ruff format/check sạch.
- **api/fastapi** — tái dùng router/endpoint hiện có (read-only), không phá envelope `AssistantReply`.
- (Không áp **database/migrations** — slice không đổi schema.)

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
cd ../frontend && npm test && npm run build
# live :5173 (LLM tắt): "quỹ khẩn cấp nên có bao nhiêu?" → KB; có giao dịch chi → số cá nhân hoá; chip FAQ
```
Kịch bản: hỏi kiến thức tài chính (5 entry) → câu trả lời chuẩn; cá nhân hoá khi có số liệu; LLM (mock)
khớp id → backend trả nội dung chuẩn (không bịa); fallback keyword khi LLM tắt/lỗi. Test BE+FE + build xanh.
```
