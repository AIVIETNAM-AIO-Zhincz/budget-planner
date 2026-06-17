# FE Settings — Shaping Notes

## Scope

Trang Settings (4 mục): đổi mật khẩu, đổi tên hiển thị, sửa không gian hiện tại (tên+tiền tệ), tạo không gian mới. Thêm 3 endpoint backend (`POST /auth/change-password`, `PATCH /auth/me`, `PATCH /spaces/{id}`). Full-stack.

## Decisions

- 4 mục như trên; **dropdown tiền tệ** (VND/USD/EUR/JPY/GBP/SGD…).
- Sửa space = owner/admin (qua header X-Space-Id, `require_min_role("admin")`); đổi mật khẩu = chính chủ.
- Sai mật khẩu hiện tại → 400. Không cần migration. TDD backend.

## Context

- **Visuals:** None.
- **References:** `app/api/auth.py`/`spaces.py` (mẫu endpoint + RBAC), `core/security` (hash/verify), `categories/budgets PATCH` (model_dump exclude_unset). FE: `auth/AuthContext` (useAuth), `api/auth.js`/`spaces.js`, `pages/Categories.jsx` (mẫu form/toast), `PageHeader`.
- **Product alignment:** Roadmap Phase 0 — profile/bảo mật + không gian.

## Standards Applied

- **api/fastapi** — RBAC server-side; HTTP code (400/403/404/422); không log mật khẩu.
- **testing/tdd** — test trước; happy + lỗi.
- **naming/coding-style** — field `snake_case`; YAGNI; không revision mới.
