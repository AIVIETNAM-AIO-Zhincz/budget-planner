# Standards for Trợ lý LLM

---

## api/fastapi

- Hợp đồng `POST /assistant/message` (`{kind, reply, draft}`) **không đổi**. LLM lỗi/timeout → fallback, không raise.
- Không log API key/nội dung tin nhắn nhạy cảm.

## testing/tdd

- Test trước: `parse_llm_json` (transaction/question/other + sai → None), `compute_answer` (intent → số từ DB), định tuyến `handle_message` (mock `classify_message`).
- **Không gọi mạng trong CI** (mock LLM). Regression: không key → đường rule cũ (test_assistant vẫn xanh).

## database/migrations

- Không model mới ⇒ không revision; verify autogenerate no-op.

## naming / coding-style

- `parse_llm_json`/`compute_answer` thuần (nhận `today`); `_call_llm` bắt mọi exception → None. YAGNI (1 provider, httpx, không SDK).
- "Không để LLM bịa số": số liệu hỏi-đáp luôn tính từ DB theo intent.
