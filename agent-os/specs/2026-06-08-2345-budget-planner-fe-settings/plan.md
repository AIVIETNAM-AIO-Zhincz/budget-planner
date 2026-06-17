# Budget Planner — FE Settings (+ endpoint backend đổi mật khẩu / profile / space)

## Context

Trang **Settings** còn là `ComingSoon` placeholder — trang cuối của shell. Spec này hiện thực 4 mục: **đổi mật khẩu**, **đổi tên hiển thị**, **sửa không gian hiện tại** (tên + tiền tệ), **tạo không gian mới**. Cần bổ sung 3 endpoint backend (`POST /auth/change-password`, `PATCH /auth/me`, `PATCH /spaces/{id}`); `POST /spaces` đã có. Full-stack.

**Quyết định đã chốt:**
- 4 mục: đổi mật khẩu · đổi tên hiển thị · sửa space (tên+tiền tệ, owner/admin) · tạo space mới.
- **Dropdown tiền tệ** (VND/USD/EUR/JPY/GBP/SGD…).
- TDD backend. Không cần migration (không đổi model). Nhánh `feature/budget-planner-fe-settings` từ `develop`.

## Hợp đồng hiện có

- `app/api/auth.py`: register/login/refresh/me. `app/core/security.py`: `hash_password`, `verify_password`.
- `app/api/spaces.py`: `GET /spaces`, `POST /spaces`. `SpaceRead{id,name,owner_id,currency,role}`.
- `app/rbac`: `get_current_user`, `require_min_role`. FE: `auth/AuthContext` (`useAuth`: user, spaces, spaceId, selectSpace, **+ reload mới**), `api/auth.js`, `api/spaces.js`, `pages/Settings.jsx` (ComingSoon), `BrandDialog`/`PageHeader`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-08-2345-budget-planner-fe-settings/`.

## Task 2 — Backend: endpoints + tests (TDD)

- `app/schemas/auth.py`: `PasswordChange(current_password: str, new_password: str Field(min_length=8))`, `ProfileUpdate(name: str max_length=255)`.
- `app/schemas/space.py`: `SpaceUpdate(name: str|None min_length=1, currency: str|None max_length=8)`.
- `app/api/auth.py`:
  - `POST /auth/change-password` (`Depends(get_current_user)`) → verify `current_password`; sai → **400**; đúng → set `hash_password(new)`, commit; trả **204**.
  - `PATCH /auth/me` (`get_current_user`) → cập nhật `name`; trả `UserRead`.
- `app/api/spaces.py`:
  - `PATCH /spaces/{space_id}` (`current = require_min_role("admin")`) → nếu `space_id != current.space_id` → **404**; áp `SpaceUpdate` (exclude_unset) lên Space; trả `SpaceRead` (kèm role). (owner/admin qua header X-Space-Id.)
- `tests/test_auth.py` (thêm): change-password đúng → 204 + login mật khẩu mới OK + mật khẩu cũ 401; sai current → 400; new < 8 → 422; PATCH /auth/me đổi tên.
- `tests/test_spaces.py` (mới): `POST /spaces` tạo + là owner; `GET /spaces` liệt kê; `PATCH /spaces` owner đổi tên/tiền tệ (200); member → 403; space khác → 404.

## Task 3 — FE api + AuthContext

- `src/api/auth.js`: `changePassword({current_password,new_password})` (POST, 204→null), `updateProfile({name})` (PATCH /auth/me).
- `src/api/spaces.js`: `createSpace({name,currency})` (POST), `updateSpace(id, patch)` (PATCH).
- `src/auth/AuthContext.jsx`: expose **`reload`** (= `loadSession`, nạp lại me+spaces) vào context value để Settings gọi sau khi đổi profile/space.

## Task 4 — Trang Settings (4 thẻ)

`src/pages/Settings.jsx` (thay `ComingSoon`) — `PageHeader` + các `Paper` thẻ:
1. **Hồ sơ**: TextField tên (prefill `user.name`) → `updateProfile` → `reload` → toast.
2. **Đổi mật khẩu**: current + new (+ xác nhận) → `changePassword` → toast; map lỗi 400 (sai mật khẩu)/422.
3. **Không gian hiện tại** (chỉ owner/admin): tên + **CurrencySelect** (prefill từ `spaces.find(spaceId)`) → `updateSpace(spaceId, …)` → `reload` → toast. Member/viewer: hiện thông tin read-only.
4. **Tạo không gian mới**: tên + CurrencySelect → `createSpace` → `reload` → `selectSpace(newId)` → toast.
- `src/components/CurrencySelect.jsx` (mới, nhỏ): `TextField select` danh sách tiền tệ phổ biến.
- Mỗi thẻ có `Alert` lỗi + `Snackbar` thành công riêng/chung; nút submit có trạng thái loading.

## Task 5 — i18n

`vi.json`/`en.json`: `settings.*` (profile {title,name,save}, password {title,current,new,confirm,save,mismatch,changed,wrongCurrent}, space {title,name,currency,save,updated,readonly}, createSpace {title,name,currency,create,created}, currencies nhãn nếu cần). Mọi chữ `t()`.

## Task 6 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh; `alembic` autogenerate no-op.
- FE: `npm run build` xanh.
- Live (uvicorn + dev): đăng nhập → Settings → đổi tên hiển thị (TopBar/menu cập nhật) → đổi mật khẩu (đăng xuất, đăng nhập lại mật khẩu mới) → đổi tiền tệ space (switcher/Dashboard hiển thị) → tạo space mới (tự chuyển sang) → member đăng nhập thấy mục "Không gian" read-only.

---

## Cấu trúc file

```
backend/app/schemas/auth.py · space.py     (sửa — PasswordChange/ProfileUpdate/SpaceUpdate)
backend/app/api/auth.py · spaces.py        (sửa — change-password, PATCH me, PATCH space)
backend/tests/test_auth.py                 (sửa — change-password/profile)
backend/tests/test_spaces.py               (mới — create/list/patch)
frontend/src/api/auth.js · spaces.js       (sửa — change-password/profile/create/update)
frontend/src/auth/AuthContext.jsx          (sửa — expose reload)
frontend/src/components/CurrencySelect.jsx (mới)
frontend/src/pages/Settings.jsx            (thay ComingSoon)
frontend/src/i18n/locales/vi.json · en.json (sửa — settings.*)
```
Tái dùng (không sửa): `PageHeader`, `BrandDialog` (không cần), `apiFetch`/`ApiError`, `require_min_role`, `hash_password/verify_password`, `useAuth`.

## Standards áp dụng

- **api/fastapi** — RBAC (PATCH space = admin+ qua header; change-password = chính chủ); HTTP code (400 sai mật khẩu, 403, 404, 422); không log mật khẩu.
- **testing/tdd** — test trước cho change-password/profile/space; happy + lỗi.
- **naming/coding-style** — field `snake_case`; YAGNI. **database/migrations** — không revision mới.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live: uvicorn app.main:app --port 8000 ; npm run dev  (đã chạy nền sẵn)
```
Kịch bản: đổi tên/mật khẩu/tiền tệ · tạo space mới (tự chuyển) · member thấy read-only.
