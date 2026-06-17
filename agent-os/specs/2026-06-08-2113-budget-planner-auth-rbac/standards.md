# Standards for Auth + RBAC

---

## api/fastapi

- Router theo tài nguyên; Pydantic schema; HTTP code đúng (`401` chưa auth, `403` thiếu quyền, `404`, `409` trùng, `422` validation).
- **Auth & RBAC bắt buộc ở backend:** mỗi request kiểm (user có quyền X trên tài nguyên Y trong không gian Z?). Quyền gắn (vai trò × không gian × tài nguyên), không hardcode theo user.
- Mọi truy vấn lọc theo `space_id`.
- Ghi **audit log** cho hành động nhạy cảm (đổi quyền, xoá, mời thành viên) kèm `actor_id`.
- **Không log** mật khẩu/token.

## testing/tdd

- Viết test trước; mỗi endpoint test happy + **lỗi quyền (403)** + **thiếu token (401)** + biên.
- Test độc lập, dùng fixture chung (auth helper trong conftest).

## naming

- `snake_case` hàm/biến/file; `PascalCase` class/schema/model; bảng số nhiều.

## coding-style

- Type hint + docstring tiếng Việt; **hàm thuần** cho security utils (hash/token); YAGNI.

## database/migrations

- Không revision mới (bảng đã có). Verify `alembic revision --autogenerate` ⇒ no changes (model↔migration khớp).
