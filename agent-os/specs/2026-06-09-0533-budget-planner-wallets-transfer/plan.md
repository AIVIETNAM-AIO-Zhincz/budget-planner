# Budget Planner — Wallets + Transfer (số dư theo giao dịch)

## Context

Model `Wallet(name, type cash|bank|e-wallet, balance)` và `Transaction.wallet_id` đã có sẵn nhưng **chưa có router/UI**, và số dư ví chưa được dùng. Spec này thêm: **CRUD ví + chuyển tiền** (backend), **giao dịch tự cập nhật số dư ví** (tạo trừ/cộng, sửa/xoá hoàn lại đúng), và **trang Ví + chọn ví trong form giao dịch** (FE). Full-stack.

**Quyết định đã chốt:**
- **Giao dịch ↔ số dư:** giao dịch gắn `wallet_id` thì chi → trừ ví, thu → cộng ví; **sửa** = hoàn lại hiệu ứng cũ + áp hiệu ứng mới; **xoá** = hoàn lại.
- **Transfer:** `POST /wallets/transfer` điều chỉnh số dư 2 ví + ghi audit (không tạo giao dịch).
- **FE:** thêm nav "Ví" + trang CRUD ví + chuyển tiền; dropdown chọn ví trong form giao dịch.
- **RBAC:** đọc ví = viewer+; CRUD ví = admin+; transfer = member+. Cho phép số dư **âm** (Phase 0, không chặn). TDD backend. Không cần migration.

## Hợp đồng hiện có

- `app/models`: `Wallet(id, space_id, name, type, balance)`, `Transaction(... wallet_id ...)`.
- `app/api/transactions.py`: create/update/delete (member+) — sẽ chèn cập nhật số dư.
- `app/api/categories.py`/`budgets.py`: mẫu CRUD (GET/{id} 404, PATCH exclude_unset, DELETE+audit, `dependencies=[require_min_role(...)]`).
- FE: `api/*.js` (apiFetch), `pages/Categories.jsx`/`Budgets.jsx` (mẫu trang), `ConfirmDialog`, `BrandDialog`, `nav.js`, `App.jsx` (lazy route), `TransactionFormDialog`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-0533-budget-planner-wallets-transfer/`.

## Task 2 — Backend Wallets: schema + service + router (TDD)

- `app/schemas/wallet.py`: `WalletBase(name min1/max255; type pattern "^(cash|bank|e-wallet)$" default "cash")`, `WalletCreate(+ balance: float default 0.0)`, `WalletUpdate(partial; balance optional)`, `WalletRead(from_attributes; id,space_id,name,type,balance)`, `TransferRequest(from_wallet_id, to_wallet_id, amount: float gt 0)`.
- `app/services/wallet.py` (hàm thuần): `wallet_effect(type, amount) = amount if income else -amount`; `apply_effect(db, space_id, wallet_id, type, amount)` (cộng effect vào ví nếu ví thuộc space); `reverse_effect(...)` (trừ effect). Bỏ qua nếu `wallet_id` None/không thuộc space.
- `app/api/wallets.py` (`prefix="/wallets"`): `GET ""` (viewer+); `POST ""` (admin+); `GET "/{id}"`; `PATCH "/{id}"` (admin+); `DELETE "/{id}"` (admin+, null hoá `wallet_id` các giao dịch trỏ tới nó + audit `wallet.deleted`); `POST "/transfer"` (member+) → kiểm 2 ví thuộc space + khác nhau + amount>0; `from.balance -= amount`, `to.balance += amount`; audit `wallet.transfer`; trả `{from, to}` (2 WalletRead).
- Wire vào `app/main.py`.
- `tests/test_wallets.py`: CRUD + RBAC (viewer/member 403 với admin op); cross-space 404; transfer chỉnh số dư đúng; from==to → 400; ví khác space → 404.

## Task 3 — Backend Transactions: cập nhật số dư (TDD)

- `app/api/transactions.py`:
  - `create_transaction`: sau khi lưu, `apply_effect(db, space, tx.wallet_id, tx.type, tx.amount)` + commit.
  - `update_transaction`: chụp `(old_wallet, old_type, old_amount)` **trước** khi áp patch → `reverse_effect(old…)`; sau áp patch → `apply_effect(new…)`; commit.
  - `delete_transaction`: `reverse_effect(tx…)` trước khi xoá; commit.
- `tests/test_transactions.py` (thêm): tạo ví; chi có wallet → số dư giảm; thu → tăng; sửa amount → số dư phản ánh; đổi wallet → chuyển hiệu ứng; xoá → hoàn lại.

## Task 4 — FE api + nav + route

- `src/api/wallets.js`: `listWallets`, `createWallet`, `updateWallet`, `deleteWallet`, `transfer({from_wallet_id,to_wallet_id,amount})`.
- `src/constants/nav.js`: thêm mục `wallets` (icon ví) vào nhóm "manage". `App.jsx`: lazy route `/wallets`. i18n `nav.wallets`.

## Task 5 — FE Trang Ví (CRUD + transfer, RBAC-aware)

- `src/pages/Wallets.jsx`: thẻ/bảng ví (tên · loại chip · **số dư** mono format) + nút Thêm/Sửa/Xoá (ẩn nếu không admin+) + nút **Chuyển tiền** (member+). skeleton/empty/error/snackbar; tổng số dư.
- `src/components/WalletFormDialog.jsx` (BrandDialog): name, type (ToggleButton/Select cash/bank/e-wallet), balance (số, chỉ khi tạo hoặc cho sửa). `ConfirmDialog` xoá.
- `src/components/TransferDialog.jsx` (BrandDialog): chọn ví nguồn + ví đích (Select từ listWallets) + amount → `transfer`.

## Task 6 — FE chọn ví trong form giao dịch

- `src/components/TransactionFormDialog.jsx`: thêm Select **ví** (tải `listWallets`, allowNone "Không có ví", prefill `initial.wallet_id`) → gửi `wallet_id`. (Trang Transactions không đổi cấu trúc bảng.)

## Task 7 — i18n

`vi.json`/`en.json`: `wallets.*` (add/edit/delete/empty, types {cash,bank,ewallet}, balance, total, transfer {title,from,to,amount,submit,sameWallet,done}, form {name,type,balance}, created/updated/deleted, loadError/saveError) + `nav.wallets` + `transactions.form.wallet`/`walletNone`.

## Task 8 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh; `alembic` autogenerate no-op.
- FE: `npm run build` xanh.
- Live (uvicorn + dev): tạo 2 ví; chuyển tiền (số dư đổi đúng); tạo giao dịch chi gắn ví A (A giảm); sửa số tiền (A phản ánh); đổi sang ví B (A hoàn lại, B giảm); xoá (B hoàn lại); viewer/member thấy nút ẩn đúng.

---

## Cấu trúc file

```
backend/app/schemas/wallet.py          (mới)
backend/app/services/wallet.py         (mới — effect thuần)
backend/app/api/wallets.py             (mới — CRUD + transfer)
backend/app/api/transactions.py        (sửa — cập nhật số dư)
backend/app/main.py                    (sửa — include wallets router)
backend/tests/test_wallets.py          (mới) · test_transactions.py (sửa)
frontend/src/api/wallets.js            (mới)
frontend/src/pages/Wallets.jsx         (mới) · App.jsx · constants/nav.js (sửa)
frontend/src/components/WalletFormDialog.jsx · TransferDialog.jsx (mới)
frontend/src/components/TransactionFormDialog.jsx (sửa — chọn ví)
frontend/src/i18n/locales/vi.json · en.json (sửa)
```
Tái dùng (không sửa model/migration): `ConfirmDialog`, `BrandDialog`, `PageHeader`, `apiFetch`/`ApiError`, `require_min_role`, `useAuth`, `formatAmount`.

## Standards áp dụng

- **api/fastapi** — RBAC (đọc viewer+, CRUD admin+, transfer member+); HTTP code (400 transfer sai, 403, 404, 422); lọc space_id; audit `wallet.transfer`/`wallet.deleted` kèm actor_id.
- **testing/tdd** — test trước cho CRUD/transfer/đối soát số dư; happy + 403 + cô lập.
- **naming/coding-style** — field `snake_case`; service số dư là **hàm thuần**; YAGNI. **database/migrations** — không revision mới.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live: backend :8000 (chạy nền) + dev :5173 — restart backend để nạp code mới
```
Kịch bản: 2 ví · chuyển tiền · giao dịch trừ/cộng số dư · sửa/đổi-ví/xoá hoàn lại đúng.
