# References for Saving Goals

## Backend (tái dùng/mô phỏng)

- `conquer/budget-planner/backend/app/api/wallets.py` `transfer` — lõi chuyển tiền (rút ra `transfer_funds` trong `app/services/wallet.py`; route giữ 400/404 + audit).
- `app/api/budgets.py` `_to_read` — dựng Read kèm tiến độ (spent/percent) → mẫu cho GoalRead (saved=ví.balance, percent).
- `app/services/wallet.py` — đã có `apply_effect`; thêm `transfer_funds`.
- `app/models/__init__.py` (`_uuid`/`_now`, Mapped, `__all__`), `app/rbac`, `alembic/env.py`.
- `tests/conftest.py` (`owner`/`make_member`); `tests/test_wallets.py` (phải vẫn xanh).

## Frontend (tái dùng/mô phỏng)

- `src/components/TransferDialog.jsx` — mẫu chọn ví + số tiền → `ContributeDialog`.
- `src/components/WalletFormDialog.jsx` — mẫu form (select ví, number) → `GoalFormDialog`.
- `src/pages/Budgets.jsx` — `LinearProgress` + percent + savedOf; `src/pages/Wallets.jsx` — trang CRUD RBAC-aware.
- `src/api/{wallets,client}.js`, `nav.js`, `App.jsx`, `TopBar.jsx`, `utils/format.js`.
