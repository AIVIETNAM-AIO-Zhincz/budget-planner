# References for Recurring Transactions

## Backend (tái dùng/mô phỏng)

- `conquer/budget-planner/backend/app/services/wallet.py` — `apply_effect(db, space_id, wallet_id, type, amount)` (cập nhật số dư khi sinh giao dịch).
- `app/api/categories.py`/`budgets.py` — mẫu CRUD (`_get_owned` 404, PATCH exclude_unset, DELETE+audit, `dependencies=[require_min_role(...)]`).
- `app/models/__init__.py` — `Transaction`, `Wallet`; helper `_uuid`/`_now`; thêm `RecurringRule`.
- `alembic/env.py` — autogenerate từ `Base.metadata` (import `app.models`); init `5fb2d5eb9124_init_schema.py` (mẫu cấu trúc migration).
- `tests/conftest.py` — fixture `owner`/`make_member`/`register`.

## Frontend (tái dùng/mô phỏng)

- `src/components/TransactionFormDialog.jsx` — mẫu form (Autocomplete danh mục, select ví, DatePicker) cho `RecurringFormDialog`.
- `src/pages/Wallets.jsx`/`Budgets.jsx` — mẫu trang CRUD (RBAC-aware, ConfirmDialog, snackbar).
- `src/layout/AppLayout.jsx` — `useAuth().spaceId` (gắn auto-run useEffect).
- `src/constants/nav.js`, `src/App.jsx`, `src/layout/TopBar.jsx`, `src/utils/format.js` (`formatAmount`).
