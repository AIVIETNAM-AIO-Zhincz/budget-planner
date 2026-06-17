# References for Wallets + Transfer

## Backend (mô phỏng/tái dùng)

- `conquer/budget-planner/backend/app/api/categories.py`, `budgets.py` — mẫu CRUD: `_get_owned` (404 cô lập), POST/PATCH (`model_dump(exclude_unset=True)`), DELETE + `AuditLog`, `dependencies=[Depends(require_min_role(...))]`.
- `app/api/transactions.py` — create/update/delete (member+) — chèn cập nhật số dư; mẫu `_get_owned`.
- `app/models/__init__.py` — `Wallet(id, space_id, name, type, balance)`, `Transaction.wallet_id`.
- `app/rbac` — `require_min_role`, `get_current_user`, `get_current_space_id`.
- `tests/conftest.py` — fixture `owner`/`make_member`/`register`.

## Frontend (mô phỏng/tái dùng)

- `src/pages/Budgets.jsx` — mẫu trang thẻ + CRUD + ConfirmDialog + snackbar.
- `src/components/BrandDialog.jsx`, `ConfirmDialog.jsx`, `PageHeader.jsx`.
- `src/api/client.js` (`apiFetch`), `src/auth/AuthContext` (`useAuth` → role), `src/utils/format.js` (`formatAmount`).
- `src/constants/nav.js`, `src/App.jsx` (lazy route), `src/components/TransactionFormDialog.jsx`.
- MUI `Autocomplete`/`Select` cho chọn ví.
