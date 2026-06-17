# FAQ tri thức tài chính — Shaping Notes

## Scope

Thêm năng lực **hỏi-đáp kiến thức tài chính cơ bản** cho chatbot (trang Trợ lý). Đây là slice #1 của
loạt "chatbot tư vấn" còn thiếu so với Production Description (FAQ + rule-based). Giới hạn trong slice
này: **một bộ KB câu hỏi-đáp tuyển chọn** (5 chủ đề lõi), khớp câu hỏi người dùng → trả nội dung chuẩn,
cá nhân hoá bằng số liệu thật khi liên quan. Không làm engine đề xuất phân bổ, hồ sơ người dùng, hay
đánh giá mục tiêu (các slice sau).

## Decisions (đã chốt với chủ repo)

1. **Phạm vi**: FAQ tri thức tài chính (chọn trước, 1 feature/1 PR theo tiền lệ `need-level`).
2. **Triển khai**: service thuần (`faq.py`, test xác định) + tích hợp chatbot qua intent mới +
   widget gợi ý câu hỏi (chip) ở trang Trợ lý. Tái dùng endpoint `/assistant/message`, không thêm route.
3. **Nguồn & khớp**: KB tuyển chọn (deterministic, không bịa) + **LLM chỉ khớp câu hỏi → id entry** +
   fallback keyword rule. Bám triết lý hiện có: *LLM phân loại, backend trả nội dung chuẩn*.
4. **Cá nhân hoá**: có, khi liên quan — vài entry dùng số liệu thật (vd quỹ khẩn cấp = 3–6× chi tiêu
   tháng thật; tiết kiệm 20% ≈ X đ theo thu nhập tháng). Số liệu tái dùng cách tính `_month_total`.

**Quyết định kỹ thuật:** không model/migration (KB tĩnh trong code); `kind="faq"` mới trong
`AssistantReply` (kind là str tự do, không phá schema); nhánh `feature/budget-planner-faq` từ `develop`.

## Context

- **Visuals:** None.
- **References:** `services/categorizer.py` (mẫu KB-keyword thuần), `services/assistant.py`
  (`handle_message`, `_route_llm`, `_month_total`), `services/llm.py` (`_INTENTS`, `_SYSTEM`,
  `parse_llm_json`), `pages/Assistant.jsx` (mẫu chip quick-prompt), `tests/test_llm.py` (mock
  `classify_message`). Xem `references.md`.
- **Product alignment:** roadmap **Phase 3 (AI phân tích & trợ lý)** + backlog **3.5/3.6**;
  Production Description mục FAQ ("nên tiết kiệm bao nhiêu %", "quỹ khẩn cấp", "tự do tài chính").

## Standards Applied

- **testing/tdd** — viết test thuần cho `faq.py` trước; case thường + biên; test cả đường LLM (mock)
  lẫn fallback; giữ test cũ xanh.
- **root/coding-style** — hàm thuần, type hint, docstring tiếng Việt, ruff/format sạch, YAGNI.
- **root/naming** — `snake_case`, `UPPER_SNAKE` cho `FAQ_INTENTS`.
- **api/fastapi** — tái dùng router/endpoint read-only, lọc theo `space_id`, giữ envelope `AssistantReply`.
- (Không áp **database/migrations** — slice không đổi schema.)
