# References for Auth + RBAC

## Pattern để mô phỏng (đã có)

### Router + Depends + audit

- **Location:** `conquer/budget-planner/backend/app/api/{transactions,categories,budgets}.py`
- **Relevance:** APIRouter prefix/tags, `Depends(get_db)`, `Depends(get_current_space_id)`, POST 201, ghi `AuditLog` khi xoá. Spec dùng `dependencies=[Depends(require_min_role(...))]` ở route-level để không đổi chữ ký.

### Models (đã có — không sửa)

- **Location:** `app/models/__init__.py`
- `User(id,email unique,password_hash,name,is_active,created_at)`, `Space(id,name,owner_id,currency)`, `Membership(id,user_id,space_id,role,status)`, `AuditLog(id,space_id,actor_id,action,target,created_at)`.

### Audit handler pattern

- **Location:** `app/events/handlers.py` — `audit_transaction_created` (mở session riêng, ghi AuditLog). Spec thêm `actor_id` qua field `user_id` của event.

### Hạ tầng

- `app/core/db.py` (`get_db`, `SessionLocal`, `Base`), `app/core/config.py` (Settings `BP_` prefix), `app/rbac/__init__.py` (`get_current_space_id` — viết lại).
- `tests/conftest.py` (`_fresh_db`, `client`) — thêm fixture auth.

## Thư viện

- Đã cài: `passlib[bcrypt]`, `python-jose[cryptography]`. Thêm: `python-multipart` (OAuth2 form), `email-validator` (EmailStr).
- Bảng `users/spaces/memberships` đã có trong `alembic/versions/5fb2d5eb9124_init_schema.py` → không migration mới.
