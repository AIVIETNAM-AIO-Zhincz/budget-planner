# References for Trợ lý AI

## Backend (tái dùng/mô phỏng)

- `conquer/budget-planner/backend/app/services/categorizer.py` — `suggest_category(note)` (keyword rule) → dùng cho danh mục của draft.
- `app/models/__init__.py` — `Transaction(amount,type,category_name,date,...)`, `Wallet(balance)`.
- `app/services/budget.py` / `app/services/wallet.py` — mẫu truy vấn tổng theo khoảng ngày / số dư.
- `app/api/audit.py` — mẫu router list ngắn. `app/rbac` — `get_current_space_id`.
- `tests/conftest.py` — fixture `owner`/`make_member`/`register`.

## Frontend (tái dùng/mô phỏng)

- `src/components/TransactionFormDialog.jsx` — prefill/edit (đổi `isEdit` theo `initial?.id`).
- `src/api/transactions.js` (`createTransaction`), `src/api/client.js` (`apiFetch`/`ApiError`).
- `src/constants/nav.js`, `src/App.jsx` (lazy route), `src/layout/TopBar.jsx`.
- `src/utils/format.js` (`formatAmount`), theme MUI (bong bóng chat bằng `Paper`/`Box`).
