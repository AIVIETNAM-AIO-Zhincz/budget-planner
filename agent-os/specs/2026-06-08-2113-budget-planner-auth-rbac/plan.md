# Budget Planner — Backend Auth (JWT) + RBAC

## Context

Toàn bộ API hiện cô lập dữ liệu qua header `X-Space-Id` **không xác thực** — ai gửi header gì cũng truy cập được. Spec này thêm **xác thực JWT** (đăng ký/đăng nhập) và **phân quyền RBAC theo Membership** (Owner/Admin/Member/Viewer), thay `demo-space` hardcode bằng không gian thật của user, và **bắt buộc token** trên mọi endpoint dữ liệu. Đây là nền tảng bảo mật + cộng tác (roadmap Phase 0 "Space + RBAC + audit log").

**Phát hiện then chốt:**
- Model + bảng `users`/`spaces`/`memberships`/`audit_logs` **đã có sẵn** → **KHÔNG cần migration mới**.
- `passlib[bcrypt]` + `python-jose[JWT]` **đã cài**; cần **thêm** `python-multipart` (OAuth2 form) + `email-validator` (EmailStr).
- Config **chưa có** JWT secret/expiry → thêm.
- `get_current_space_id` hiện chỉ đọc header → **viết lại** thành xác thực token + kiểm Membership.

**Quyết định đã chốt:**
- **Bắt buộc token** trên mọi endpoint dữ liệu (không fallback). → **FE hiện tại sẽ tạm hỏng** đến khi làm spec FE-login kế tiếp (nên làm ngay sau).
- **OAuth2 password form** cho login + **access & refresh token** (rotate access).
- **Đầy đủ quản lý thành viên**: spaces (list/create) + members (list/invite/đổi vai trò/xoá) + audit log.
- Backend-only. Nhánh `feature/budget-planner-auth-rbac` từ `develop`. **TDD**.

## Mô hình quyền

Thứ tự vai trò: `viewer < member < admin < owner`. Không gian hiện tại lấy từ header `X-Space-Id`, **được xác thực** là user có Membership active.
- **Đọc** (mọi GET dữ liệu): cần membership bất kỳ (viewer+).
- **Giao dịch** `POST /transactions`: **member+**.
- **Categories/Budgets** `POST/PATCH/DELETE`: **admin+**.
- **Members** invite/đổi vai trò/xoá: **admin+**; chỉ **owner** mới gán/đổi vai trò `owner`; không ai xoá/hạ owner.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-08-2113-budget-planner-auth-rbac/` (plan/shape/standards/references + visuals/ rỗng). Standards: `api/fastapi` (RBAC server-side, HTTP code, audit), `testing/tdd`, `naming`, `coding-style`, `database/migrations` (không revision mới).

## Task 2 — Deps + config + security utils

- `requirements.txt`: thêm `python-multipart>=0.0.9`, `email-validator>=2.1`.
- `app/core/config.py`: thêm `secret_key: str`, `access_token_expire_minutes: int = 30`, `refresh_token_expire_days: int = 7`, `jwt_algorithm: str = "HS256"` (env `BP_*`).
- `app/core/security.py` (mới — hàm thuần): `pwd_context` (bcrypt), `hash_password`, `verify_password`; `create_access_token(sub)`, `create_refresh_token(sub)`, `decode_token(token)` (jose; payload `{sub, type, exp}`; raise khi sai/hết hạn).

## Task 3 — RBAC dependencies (viết lại `app/rbac/__init__.py`)

- `oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")`.
- `get_current_user(token, db) -> User` — decode access token, load user, 401 nếu sai/inactive.
- `get_current_membership(user, x_space_id Header, db) -> Membership` — kiểm user có Membership active trong space; 403 nếu không.
- `get_current_space_id(membership) -> str` — trả `membership.space_id` (**giữ tên** để router GET cũ chỉ cần thêm auth, ít sửa).
- `require_min_role(min_role)` — factory trả dependency raise 403 nếu `rank(role) < rank(min)`; dùng ở **route-level** `dependencies=[...]` để **không đổi chữ ký** hàm hiện có.

## Task 4 — Auth router (`app/api/auth.py`) + schemas

- `app/schemas/auth.py`: `UserCreate(email: EmailStr, password: str Field(min_length=8), name="")`, `UserRead(from_attributes; id,email,name,is_active)`, `Token(access_token, refresh_token, token_type="bearer")`, `RefreshRequest(refresh_token)`.
- Endpoints:
  - `POST /auth/register` (JSON) → tạo user (hash pw), **auto-tạo Space** + Membership `owner`; 201 `UserRead`. 409 nếu email trùng.
  - `POST /auth/login` (`OAuth2PasswordRequestForm`: username=email) → verify → `Token`. 401 sai.
  - `POST /auth/refresh` (JSON `RefreshRequest`) → verify refresh → access mới (+ refresh cũ). 401 sai.
  - `GET /auth/me` (`Depends(get_current_user)`) → `UserRead`.
- Wire vào `app/main.py`.

## Task 5 — Spaces + Members routers + schemas

- `app/schemas/space.py`: `SpaceCreate(name, currency="VND")`, `SpaceRead(id,name,owner_id,currency,role)` (role của user hiện tại), `MemberRead(id,user_id,email,name,role,status)`, `MemberInvite(email: EmailStr, role="member")`, `RoleUpdate(role pattern owner|admin|member|viewer)`.
- `app/api/spaces.py`: `GET /spaces` (các space user là thành viên + role), `POST /spaces` (tạo, user thành owner) 201.
- `app/api/members.py` (không gian hiện tại từ header):
  - `GET /members` (membership+) → list `MemberRead` (join User).
  - `POST /members` (admin+) → mời theo email (user phải tồn tại) → tạo Membership; 201; audit `member.invited`. 404 nếu email chưa có user; 409 nếu đã là thành viên.
  - `PATCH /members/{id}` (admin+) → `RoleUpdate`; chặn đổi vai trò owner & chỉ owner mới gán owner; audit `member.role_changed`.
  - `DELETE /members/{id}` (admin+) → xoá (không xoá owner); 204; audit `member.removed`.
- Wire vào `main.py`. Audit có `actor_id = current_user.id`.

## Task 6 — Bật RBAC trên endpoint hiện có + actor_id

- Thêm `dependencies=[Depends(require_min_role("member"))]` cho `POST /transactions`; `require_min_role("admin")` cho `POST/PATCH/DELETE /categories` và `/budgets`. (route-level — không đổi chữ ký.)
- GET endpoints: thêm xác thực bằng cách `get_current_space_id` nay đã yêu cầu token (tự động qua chuỗi Depends) — không cần sửa router GET.
- **actor_id**: delete category/budget thêm `user: User = Depends(get_current_user)` → `AuditLog(actor_id=user.id, ...)`. Giao dịch: set `Transaction.user_id = current_user.id`; thêm `user_id` vào event `TransactionCreated` + handler `audit_transaction_created` ghi `actor_id`.

## Task 7 — Tests (TDD) + viết lại conftest

- `tests/conftest.py`: thêm fixture/helper `register(email,password,name)` → đăng ký + login + lấy `space_id` (từ `GET /spaces`) → trả `{token, space_id, headers}` (`Authorization: Bearer` + `X-Space-Id`). Helper `invite(owner_headers, space_id, email, role)`.
- **Cập nhật toàn bộ test cũ** (`test_transactions`, `test_categories`, `test_budgets`, `test_budget_overflow`) sang dùng auth headers; test cô lập space (`s1/s2`) → 2 user/2 space.
- Test mới:
  - `test_auth.py`: register 201 + email trùng 409; login đúng/sai (200/401); `/auth/me`; refresh ra access mới; endpoint dữ liệu thiếu token → 401.
  - `test_rbac.py`: viewer GET được nhưng `POST /transactions` → 403; member tạo transaction OK nhưng `POST /categories` → 403; admin tạo category OK; user ngoài space → 403.
  - `test_members.py`: owner mời member 201 (audit `member.invited`); đổi vai trò; admin không đổi được owner; xoá member 204; member thường gọi `POST /members` → 403.

## Task 8 — Verify

- `pytest -q` xanh (test cũ đã sửa + mới).
- `ruff check app tests` + (root) `ruff check .`/`ruff format --check .` sạch.
- `alembic upgrade head` OK; `revision --autogenerate` ⇒ no-op (model↔migration khớp).
- Live smoke (uvicorn): register → login (form) → `GET /spaces` lấy space → tạo category (admin OK) → mời 1 user làm viewer → viewer `POST /transactions` 403 → `/auth/me` đúng → gọi `/transactions` không token 401.

---

## Cấu trúc file

```
backend/requirements.txt                      (sửa — +multipart, +email-validator)
backend/app/core/config.py                    (sửa — JWT settings)
backend/app/core/security.py                  (mới — hash + JWT)
backend/app/rbac/__init__.py                  (viết lại — auth + membership + require_min_role)
backend/app/schemas/auth.py · space.py        (mới)
backend/app/api/auth.py · spaces.py · members.py  (mới)
backend/app/api/transactions.py · categories.py · budgets.py  (sửa — dependencies RBAC + actor_id)
backend/app/events/events.py · handlers.py    (sửa — user_id/actor_id cho transaction audit)
backend/app/main.py                           (sửa — include 3 router)
backend/tests/conftest.py                     (sửa — fixture auth)
backend/tests/test_*.py (cũ)                   (sửa — dùng auth)
backend/tests/test_auth.py · test_rbac.py · test_members.py  (mới)
```
KHÔNG sửa: models, migration (bảng đã có).

## Standards áp dụng

- **api/fastapi** — RBAC **bắt buộc server-side** theo (vai trò × không gian × tài nguyên); HTTP code đúng (401 chưa auth, 403 thiếu quyền, 404, 409, 422); lọc `space_id`; **audit log** cho hành động nhạy cảm (member/role/delete) kèm `actor_id`; không log mật khẩu/token.
- **testing/tdd** — viết test trước; happy + **lỗi quyền (403)** + thiếu token (401); test độc lập.
- **naming / coding-style / database/migrations** — như chuẩn; helper thuần (security); không revision mới.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
pip install -r requirements.txt           # cài multipart + email-validator
ruff check app tests && pytest -q          # phải xanh
alembic upgrade head                       # + autogenerate ⇒ no changes
uvicorn app.main:app --port 8000           # smoke: register/login/RBAC 403/me/401
```
