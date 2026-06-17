# References for Trợ lý LLM

## Backend (tái dùng/mô phỏng)

- `conquer/budget-planner/backend/app/services/assistant.py` — `parse_transaction`, `answer_query` (rút compute helpers `_expense_month`/`_income_month`/`_wallet_summary`), `handle_message` (chèn LLM-first + fallback), `_fmt`/`_month_range`.
- `app/services/categorizer.py` — `suggest_category(note)` (điền danh mục cho draft từ LLM).
- `app/core/config.py` — `Settings(env_prefix="BP_")` → thêm `llm_*`.
- `httpx` (đã trong requirements) — gọi `{base_url}/chat/completions`.
- `tests/conftest.py` (`owner`), `tests/test_assistant.py` (giữ xanh — no key = rule).

## External

- OpenAI-compatible Chat Completions: `POST {base_url}/chat/completions`, header `Authorization: Bearer <key>`, body `{model, messages, temperature:0, response_format:{type:"json_object"}}`, đọc `choices[0].message.content`.
