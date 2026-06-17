# References for FE Settings

## Backend (mô phỏng/tái dùng)

- `conquer/budget-planner/backend/app/api/auth.py` — register/login/refresh/me (mẫu router auth). Thêm change-password + PATCH me.
- `app/api/spaces.py` — GET/POST spaces. Thêm PATCH (mẫu `require_min_role` từ members.py).
- `app/core/security.py` — `hash_password`, `verify_password`.
- `app/api/categories.py`/`budgets.py` — mẫu PATCH `model_dump(exclude_unset=True)`.
- `tests/conftest.py` — fixture `owner`/`make_member`/`register`.

## Frontend (sửa/tái dùng)

- `src/auth/AuthContext.jsx` — `useAuth` (user/spaces/spaceId/selectSpace). Thêm `reload`.
- `src/api/auth.js` (login form/register/me), `src/api/spaces.js` (listSpaces).
- `src/pages/Categories.jsx` — mẫu form + Alert + Snackbar + busy.
- `src/components/PageHeader.jsx`. MUI `TextField select` cho CurrencySelect.
