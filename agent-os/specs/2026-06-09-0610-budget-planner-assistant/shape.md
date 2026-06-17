# Trợ lý AI (NL input + Q&A) — Shaping Notes

## Scope

Trang "Trợ lý" dạng chat: nhập giao dịch ngôn ngữ tự nhiên (parse → mở form xác nhận) + hỏi-đáp số liệu cơ bản (chi/thu tháng, số dư ví). Parser rule-based tiếng Việt. Full-stack.

## Decisions

- Parser **rule-based** (regex), deterministic, không cần API key ("không để LLM bịa số").
- Luồng: parse → **mở TransactionFormDialog prefill** để xác nhận & lưu (không auto-create).
- Trang "Trợ lý" riêng (nav + chat UI). Q&A: tổng chi/thu tháng, số dư ví.
- Không cần migration. TDD backend.

## Context

- **Visuals:** None.
- **References:** `app/services/categorizer.py` (`suggest_category`), `app/models` (Transaction/Wallet), `app/api/transactions.py`, `app/rbac`. FE: `TransactionFormDialog`, `api/transactions.js`, `nav.js`, `App.jsx`, theme/BrandDialog.
- **Product alignment:** Roadmap Phase 1 — nhập NL + trợ lý hỏi-đáp.

## Standards Applied

- **api/fastapi** — lọc space_id; parse/đọc không tạo dữ liệu (form mới tạo, member+).
- **testing/tdd** — test trước parser (số/ngày/loại) + Q&A + unknown; deterministic (truyền `today`).
- **coding-style** — parser hàm thuần; YAGNI (rule-based). **database/migrations** — không revision mới.
