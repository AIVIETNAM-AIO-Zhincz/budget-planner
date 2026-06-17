# References for Hoàn thiện Transactions

## Backend (mô phỏng/tái dùng)

- `conquer/budget-planner/backend/app/api/transactions.py` — POST/GET + `_check_budget_overflow(db, tx)` (tái dùng cho PATCH).
- `app/api/categories.py`, `budgets.py` — mẫu `GET/{id}` (404 cô lập), `PATCH` (`model_dump(exclude_unset=True)`), `DELETE` (+`AuditLog` actor_id), `dependencies=[require_min_role(...)]`.
- `app/schemas/transaction.py` — Base/Create/Read; thêm `TransactionUpdate`.
- `app/services/budget.py` — `_period_range(period)` cho lọc theo tháng.
- `tests/test_transactions.py` + `conftest.py` — fixture `owner`/`make_member`/`register`.

## Frontend (sửa/tái dùng)

- `src/pages/Transactions.jsx`, `src/components/TransactionFormDialog.jsx`, `src/api/transactions.js`.
- `src/components/ConfirmDialog.jsx`, `CategoryChip.jsx`; `src/api/categories.js` (`listCategories`).
- MUI `Autocomplete` (freeSolo) — đã có trong `@mui/material`.
