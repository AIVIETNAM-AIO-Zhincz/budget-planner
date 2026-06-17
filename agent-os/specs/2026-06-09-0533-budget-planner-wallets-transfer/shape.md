# Wallets + Transfer — Shaping Notes

## Scope

CRUD ví + chuyển tiền (backend) + giao dịch tự cập nhật số dư ví (create trừ/cộng, edit/delete hoàn lại) + trang Ví & chọn ví trong form giao dịch (FE). Full-stack.

## Decisions

- Giao dịch gắn `wallet_id`: chi → trừ ví, thu → cộng ví; sửa = hoàn cũ + áp mới; xoá = hoàn lại.
- Transfer: `POST /wallets/transfer` chỉnh số dư 2 ví + audit (không tạo giao dịch).
- RBAC: đọc viewer+, CRUD ví admin+, transfer member+. Cho phép số dư âm (Phase 0).
- FE: nav "Ví" + trang CRUD/transfer + chọn ví trong form giao dịch.
- Không cần migration (Wallet + Transaction.wallet_id đã có). TDD backend.

## Context

- **Visuals:** None.
- **References:** `app/api/categories.py`/`budgets.py` (mẫu CRUD + RBAC + audit), `app/api/transactions.py` (create/update/delete — chèn số dư), model `Wallet`. FE: `pages/Categories.jsx`/`Budgets.jsx`, `ConfirmDialog`, `BrandDialog`, `nav.js`, `TransactionFormDialog`.
- **Product alignment:** Roadmap — ví (cash/bank/e-wallet), số dư, chuyển tiền giữa ví.

## Standards Applied

- **api/fastapi** — RBAC server-side; HTTP 400/403/404/422; lọc space_id; audit `wallet.transfer`/`wallet.deleted`.
- **testing/tdd** — test trước CRUD/transfer/đối soát số dư.
- **naming/coding-style** — field `snake_case`; service số dư hàm thuần; không revision mới.
