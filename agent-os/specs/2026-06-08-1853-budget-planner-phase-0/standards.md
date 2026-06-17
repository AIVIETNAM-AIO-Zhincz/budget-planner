# Standards for Budget Planner Phase 0

Các standard áp dụng (nội dung đầy đủ ở `agent-os/standards/`):

- **root/coding-style** — PEP8, black/ruff, type hint, docstring tiếng Việt, pure function, YAGNI.
- **root/naming** — `snake_case`/`PascalCase`/`UPPER_SNAKE`; bảng số nhiều, khoá ngoại `{entity}_id`.
- **api/fastapi** — router theo tài nguyên, Pydantic schema, **RBAC kiểm tra server-side**, lọc theo `space_id`, audit log, không log dữ liệu nhạy cảm.
- **testing/tdd** — pytest, viết test trước, case thường + biên, test **lỗi quyền (403)** và **fallback AI**.
- **database/migrations** — Alembic: mỗi đổi schema = 1 revision; autogenerate rồi review; không sửa migration đã chạy.
