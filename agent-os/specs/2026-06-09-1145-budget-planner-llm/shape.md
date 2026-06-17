# Trợ lý LLM thật — Shaping Notes

## Scope

Thêm tầng LLM (OpenAI-compatible, httpx) cho Trợ lý: phân loại ý định + trích giao dịch; số liệu hỏi-đáp vẫn tính từ DB. Không key/lỗi → fallback rule. Không model/migration/FE.

## Decisions

- Provider OpenAI-compatible (`{base_url}/chat/completions`, json_object, temperature 0).
- Phạm vi cả hỏi-đáp: LLM trả `{kind, draft?, question?}`; transaction→draft validate, question→backend tính số từ DB, other→trả lời thân thiện.
- Không key/timeout/JSON sai → fallback rule. Config env `BP_LLM_*`. TDD mock (không gọi mạng CI).
- "Không để LLM bịa số": số liệu luôn từ DB.

## Context

- **Visuals:** None.
- **References:** `app/services/assistant.py` (parse_transaction/answer_query/handle_message), `app/core/config.py` (Settings), `app/services/categorizer.suggest_category`, `httpx` (đã dep), `tests/test_assistant.py`.
- **Product alignment:** Roadmap Phase 3 — trợ lý LLM.

## Standards Applied

- **api/fastapi** — hợp đồng `/assistant/message` không đổi; LLM lỗi không hỏng request.
- **testing/tdd** — test trước parse_llm_json/compute/định tuyến; mock LLM; fallback no-key = rule.
- **database/migrations** — không model mới ⇒ no-op.
- **naming/coding-style** — hàm thuần; bắt mọi lỗi mạng → None; YAGNI (1 provider, httpx).
