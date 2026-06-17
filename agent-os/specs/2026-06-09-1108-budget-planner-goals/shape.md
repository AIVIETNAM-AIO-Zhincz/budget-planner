# Saving Goals — Shaping Notes

## Scope

Mục tiêu tiết kiệm gắn một ví tiết kiệm; tiến độ = số dư ví / target; "Góp" = chuyển tiền từ ví nguồn → ví tiết kiệm. Cần model `Goal` + migration #3. Full-stack.

## Decisions

- Mô hình "ví tiết kiệm + chuyển tiền": `Goal{name, target_amount, wallet_id, deadline?}`; tiến độ = `wallet.balance/target` (soi ví, không lưu saved riêng).
- "Góp x" = `transfer_funds(from_wallet → goal.wallet)` (cập nhật 2 số dư), không tạo giao dịch.
- RBAC: CRUD + góp = member+; đọc viewer+.

## Context

- **Visuals:** None.
- **References:** `app/api/wallets.py` transfer (rút lõi ra `transfer_funds`), `app/api/budgets.py` `_to_read` (Read kèm tiến độ), `pages/Wallets.jsx`/`Budgets.jsx`, `TransferDialog`/`WalletFormDialog`.
- **Product alignment:** Roadmap — mục tiêu tiết kiệm.

## Standards Applied

- **api/fastapi** — RBAC viewer+/member+; lọc space_id; 400/404; audit goal.deleted/contribute.
- **testing/tdd** — test trước CRUD/contribute/biên + tiến độ; không phá test_wallets sau refactor.
- **database/migrations** — 1 revision mới qua autogenerate, verify no-op.
- **naming/coding-style** — snake_case; `transfer_funds` thuần (route lo audit/commit); YAGNI.
