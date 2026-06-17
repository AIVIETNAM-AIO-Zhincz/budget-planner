# Budget Planner — Trợ lý dùng LLM thật (OpenAI-compatible)

## Context

Trợ lý hiện parse bằng **regex rule-based** (`app/services/assistant.py`). Spec này thêm tầng **LLM** (OpenAI-compatible qua `httpx`) để **phân loại ý định + trích giao dịch** linh hoạt hơn; **số liệu hỏi-đáp vẫn tính từ DB** (LLM chỉ chọn intent, KHÔNG bịa số). Khi không có API key hoặc LLM lỗi → **fallback về rule** (giữ nguyên hành vi cũ, test cũ vẫn xanh). Không model/migration; không cần FE (hợp đồng `/assistant/message` giữ nguyên `{kind, reply, draft}`). `httpx>=0.27` đã có sẵn.

**Quyết định đã chốt:**
- Provider **OpenAI-compatible**: `POST {base_url}/chat/completions`, `response_format={"type":"json_object"}`, `temperature=0`.
- Phạm vi: **cả hỏi-đáp** — LLM trả JSON `{kind, draft?, question?}`; **transaction** dùng draft (đã validate), **question** → backend tự tính số từ DB theo intent, **other** → trả lời thân thiện.
- Không key/timeout/JSON sai → fallback rule (`answer_query` → `parse_transaction` → unknown).
- Config qua env `BP_LLM_*`. Nhánh `feature/budget-planner-llm` từ `develop`. TDD (mock LLM, không gọi mạng trong test/CI).

## Hợp đồng hiện có

- `app/services/assistant.py` — `parse_transaction(text,today)`, `answer_query(db,space,text,today)` (tính số dư ví + chi/thu tháng), `handle_message(db,space,text,today)` (answer→draft→unknown). `_fmt`, `_month_range`.
- `app/core/config.py` — `Settings(BaseSettings, env_prefix="BP_")`. `app/api/assistant.py` — `POST /assistant/message` gọi `handle_message`.
- `httpx` (đã dep). `tests/test_assistant.py` (giữ xanh — chạy không key = rule).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-1145-budget-planner-llm/`.

## Task 2 — Backend: LLM service + refactor assistant (TDD)

- `app/core/config.py` (bổ sung): `llm_api_key: str = ""`, `llm_model: str = "gpt-4o-mini"`, `llm_base_url: str = "https://api.openai.com/v1"`, `llm_timeout: float = 12.0`.
- `app/services/assistant.py` (refactor nhỏ): rút compute helpers từ `answer_query`:
  - `_expense_month(db, space, today) -> str`, `_income_month(...)`, `_wallet_summary(...)`; `compute_answer(db, space, intent, today) -> str | None` (dispatch intent ∈ `expense_month`/`income_month`/`wallet_balance`). `answer_query` (rule) tái dùng các helper này (giữ logic cũ).
- `app/services/llm.py` (mới):
  - `llm_enabled() -> bool` = `bool(settings.llm_api_key)`.
  - `parse_llm_json(raw: str, today) -> dict | None` (**thuần, test offline**): đọc JSON `{kind, draft, question}`; với `transaction` validate draft (amount>0, type∈income/expense, date ISO/none→today, category trống→`suggest_category`); với `question` chỉ nhận intent thuộc tập cố định; sai → None.
  - `_call_llm(messages: list) -> str | None`: `httpx.post({base_url}/chat/completions, Bearer key, json json_object, timeout)`; trả `content` hoặc None nếu lỗi/timeout (bắt mọi exception → None).
  - `classify_message(text, today) -> dict | None`: dựng system+user prompt (mô tả schema + danh mục gợi ý + "chỉ trích, không bịa số"), gọi `_call_llm` → `parse_llm_json`.
- `app/services/assistant.py` `handle_message`: nếu `llm_enabled()` → `res = classify_message(text, today)`; theo `res.kind`: `transaction`→`{kind:"transaction", draft, reply}`; `question`→`compute_answer(...)` → `{kind:"answer", reply}` (None→fallback); `other`→`{kind:"answer", reply: res.reply or câu mặc định}`. Nếu LLM None/disabled → **đường rule cũ** nguyên vẹn.
- `tests/test_llm.py`: `parse_llm_json` (transaction hợp lệ/thiếu amount→None/ category trống→suggest; question intent hợp lệ/intent lạ→None; JSON hỏng→None); `handle_message` với key bật + **monkeypatch `classify_message`** (transaction/question/other định tuyến đúng; số liệu question lấy từ DB); không key → `classify_message` không được gọi (rule path). `tests/test_assistant.py` cũ vẫn xanh.

## Task 3 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh (assistant cũ + llm mới); `alembic` autogenerate **no-op** (không đổi model).
- FE: `npm run build` xanh (không đổi FE; chỉ kiểm không vỡ).
- Live: **không key** → restart, `"ăn trưa 50k hôm qua"` vẫn ra draft (rule), `"tháng này chi bao nhiêu?"` vẫn trả số (rule). *(Tuỳ chọn, người dùng tự thử LLM: `! export BP_LLM_API_KEY=...` rồi restart → câu mơ hồ vẫn parse được; số liệu vẫn từ DB.)*

---

## Cấu trúc file

```
backend/app/core/config.py        (sửa — llm_api_key/model/base_url/timeout)
backend/app/services/llm.py       (mới — classify_message + parse_llm_json + _call_llm)
backend/app/services/assistant.py (sửa — compute helpers + handle_message LLM-first/fallback)
backend/tests/test_llm.py         (mới)
```
Tái dùng: `suggest_category`, `answer_query` compute (rút helper), `httpx`, `settings`.

## Standards áp dụng

- **api/fastapi** — hợp đồng `/assistant/message` không đổi; LLM lỗi không làm hỏng request (fallback). Không log key/nội dung nhạy cảm.
- **testing/tdd** — test trước `parse_llm_json`/`compute_answer`/định tuyến; **mock LLM** (không gọi mạng trong CI); fallback no-key = rule (regression).
- **database/migrations** — không model mới ⇒ no-op.
- **naming/coding-style** — `parse_llm_json`/`compute_answer` thuần; bắt mọi lỗi mạng → None (an toàn); YAGNI (1 provider, httpx, không SDK mới). "Không để LLM bịa số": số liệu hỏi-đáp luôn tính từ DB.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live (không key): restart uvicorn :8000 — rule fallback hoạt động
# (có key): ! export BP_LLM_API_KEY=sk-... ; restart → LLM-first, số liệu vẫn từ DB
```
Kịch bản: không key → rule như cũ; có key → LLM phân loại/trích, số liệu hỏi-đáp vẫn deterministic từ DB.
