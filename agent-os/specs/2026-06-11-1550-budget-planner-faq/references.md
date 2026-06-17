# References for FAQ tri thức tài chính

## Similar Implementations

### KB-keyword thuần (mẫu cho `faq.py`)

- **Location:** `conquer/budget-planner/backend/app/services/categorizer.py`
- **Relevance:** đúng pattern cần dùng — bản đồ keyword → nhãn + **fallback**, hàm thuần `suggest_category`.
- **Key patterns:** dict `_KEYWORD_RULES`, lowercase + `any(kw in text ...)`, hằng fallback. FAQ làm
  tương tự nhưng trả về **id entry** (rồi `answer_faq` dựng câu trả lời).

### Định tuyến trợ lý (chèn FAQ vào đây)

- **Location:** `conquer/budget-planner/backend/app/services/assistant.py`
- **Relevance:** `handle_message` (LLM route → `answer_query` → `parse_transaction` → unknown) là nơi
  chèn nhánh FAQ (sau `answer_query`, trước `parse_transaction`). `_route_llm` xử lý kết quả LLM.
- **Key patterns:** `_month_total` (sẽ tách `_month_amount` số thuần để cá nhân hoá); `compute_answer`
  map intent cố định; trả dict `{kind, reply, draft}`.

### Tầng LLM (thêm kind "faq")

- **Location:** `conquer/budget-planner/backend/app/services/llm.py`
- **Relevance:** `_INTENTS` + `_SYSTEM` + `parse_llm_json` — thêm nhánh `kind:"faq"` với field `faq:<id>`
  ràng buộc theo `FAQ_INTENTS`. Triết lý "LLM chỉ phân loại, không bịa".
- **Key patterns:** validate theo `kind`; lỗi → `None` để fallback.

### Widget chip (frontend)

- **Location:** `conquer/budget-planner/frontend/src/pages/Assistant.jsx`
- **Relevance:** `quickPrompts` render thành `Chip` clickable → mẫu cho bộ chip gợi ý câu hỏi FAQ.
- **Key patterns:** `Chip … clickable onClick={() => send(p)}`; `push({role,text,draft})` —
  thêm lưu `kind` để gắn nhãn "Kiến thức". `api/assistant.js` đã trả nguyên `{kind,reply,draft}`.

### Test mock LLM

- **Location:** `conquer/budget-planner/backend/tests/test_llm.py`
- **Relevance:** mẫu `monkeypatch.setattr(llm, "classify_message", lambda ...)` để test route mà không
  gọi mạng — tái dùng cho test route FAQ.

## Pure-function format

- **Location:** `conquer/budget-planner/backend/app/core/format.py` — `format_vnd` để format số tiền
  trong câu trả lời cá nhân hoá.
