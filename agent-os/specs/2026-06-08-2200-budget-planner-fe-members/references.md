# References for FE Members

## FE pattern để mô phỏng

### Trang Categories / Budgets (PR #3)

- **Location:** `conquer/budget-planner/frontend/src/pages/Categories.jsx`, `Budgets.jsx`
- **Relevance:** Khuôn trang có API: fetch + loading skeleton + empty + `Alert` lỗi (map `ApiError`) + `Snackbar` + dialog + `ConfirmDialog` xoá + refetch.

### Component tái dùng

- `src/components/BrandDialog.jsx` (form dialog), `ConfirmDialog.jsx` (xác nhận xoá), `PageHeader.jsx` (tiêu đề + actions).
- `src/api/client.js` — `apiFetch`, `ApiError`.
- `src/auth/AuthContext.jsx` — `useAuth()` → `user`, `spaces`, `spaceId` (suy ra role hiện tại).

## Backend (hợp đồng — PR #4)

- **Location:** `conquer/budget-planner/backend/app/api/members.py`
- `GET /members` → `[{id,user_id,email,name,role,status}]`.
- `POST /members {email,role}` (admin+) → 201; 404 email chưa có user; 409 trùng.
- `PATCH /members/{id} {role}` (admin+) → 200; chặn đổi owner; chỉ owner gán owner.
- `DELETE /members/{id}` (admin+) → 204; không xoá owner.
