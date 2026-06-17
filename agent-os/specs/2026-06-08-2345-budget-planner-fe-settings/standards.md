# Standards for FE Settings

---

## api/fastapi

- RBAC server-side: `PATCH /spaces/{id}` cần admin+ (header X-Space-Id); change-password = chính chủ (`get_current_user`).
- HTTP code đúng: 400 (sai mật khẩu hiện tại), 403 (thiếu quyền), 404, 422 (validation).
- **Không log** mật khẩu/token.

## testing/tdd

- Viết test trước cho change-password (đúng/sai/biên), profile, space patch (owner/member/cross-space).
- Test độc lập, dùng fixture `owner`/`make_member`/`register`.

## naming / coding-style

- Field API `snake_case` (`current_password`, `new_password`). Helper thuần; YAGNI.

## database/migrations

- Không revision mới (không đổi model). Verify autogenerate no-op.
