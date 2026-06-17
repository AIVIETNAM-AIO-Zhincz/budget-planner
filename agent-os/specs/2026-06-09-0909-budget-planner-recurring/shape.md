# Recurring Transactions — Shaping Notes

## Scope

Mẫu giao dịch định kỳ (daily/weekly/monthly) + sinh giao dịch tự động khi mở app (catch-up tới hôm nay) + nút "Chạy ngay". Cần model `RecurringRule` + migration mới. Full-stack.

## Decisions

- Sinh: auto khi mở app (FE gọi `/recurring/run`) + nút thủ công; catch-up `next_run <= today`.
- Tần suất: daily/weekly/monthly (mỗi kỳ 1 lần). Hết `end_date` → tắt rule.
- RBAC: đọc viewer+, CRUD/run member+. Cần migration (autogenerate). TDD.

## Context

- **Visuals:** None.
- **References:** `app/services/wallet.py` (`apply_effect`), `app/api/categories.py`/`budgets.py` (CRUD mẫu), `app/models` (Transaction/Wallet), `alembic/env.py`. FE: `Wallets.jsx`/`Budgets.jsx`, `TransactionFormDialog`, `AppLayout.jsx`, `nav.js`.
- **Product alignment:** Roadmap Phase 4 — giao dịch định kỳ.

## Standards Applied

- **api/fastapi** — RBAC (viewer+/member+); lọc space_id; audit xoá.
- **testing/tdd** — test trước advance/run_due/CRUD; deterministic (today truyền vào).
- **database/migrations** — 1 revision mới qua autogenerate, review; verify no-op sau đó.
- **naming/coding-style** — snake_case; service hàm thuần; YAGNI (không scheduler).
