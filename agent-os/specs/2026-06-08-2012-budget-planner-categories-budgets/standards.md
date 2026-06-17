# Standards for Categories + Budgets

---

## api/fastapi

- Router theo tài nguyên (`/categories`, `/budgets`); dùng **Pydantic** cho request/response schema.
- Mọi endpoint trả về schema rõ ràng; lỗi trả mã HTTP đúng (`400/401/403/404/422`).
- **Validation ở schema** (Pydantic), không validate thủ công rải rác.
- **Auth & RBAC bắt buộc ở backend** (slice sau); hiện space qua header `X-Space-Id`.
- Mọi truy vấn lọc theo **`space_id`** (cô lập dữ liệu).
- Ghi **audit log** cho hành động nhạy cảm (xoá) — áp dụng: DELETE category/budget ghi AuditLog.

## testing/tdd

- **Viết test trước**, implement sau.
- Test trong `tests/`, tên `test_*.py`, chạy bằng `pytest`.
- Mỗi hàm public ≥ 1 test cho case thường + case biên.
- Test độc lập; dùng fixture chung (`_fresh_db`, `client` đã có trong conftest).
- API: test happy path lẫn lỗi (404 không thấy, 422 validation, cô lập space).

## naming

- `snake_case` — hàm/biến/module/file.
- `PascalCase` — class/Pydantic/SQLAlchemy model.
- Bảng số nhiều (`categories`, `budgets`), khoá ngoại `{entity}_id`.

## database/migrations

- Schema quản lý bằng Alembic; **không** đổi tay.
- Mỗi đổi schema = 1 revision. Ở spec này **không cần** revision mới (model/bảng đã có).
- Verify model↔migration khớp: `alembic revision --autogenerate` ⇒ "no changes detected".

## coding-style

- PEP8, ruff/black, line ≤ 100.
- **Type hint** + **docstring tiếng Việt** cho hàm public.
- Hàm thuần cho helper (service budget). YAGNI.
