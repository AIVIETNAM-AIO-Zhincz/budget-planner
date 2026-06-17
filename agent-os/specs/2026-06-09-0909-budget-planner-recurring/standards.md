# Standards for Recurring Transactions

---

## api/fastapi

- RBAC: đọc ví/rule = viewer+; CRUD + `/recurring/run` = member+ (`require_min_role`).
- Lọc mọi truy vấn theo `space_id`; HTTP code chuẩn (403/404/422); audit `recurring.deleted`.

## testing/tdd

- Viết test trước: `advance` (daily/weekly/monthly + clamp tháng), `run_due` (catch-up, advance next_run, cập nhật số dư, end_date tắt rule), CRUD + RBAC.
- Deterministic: truyền `today` vào hàm thuần.

## database/migrations

- **Một revision mới** qua `alembic revision --autogenerate` (từ `Base.metadata`), **review** file trước khi chạy.
- Sau migration: `alembic upgrade head` OK; `--autogenerate` lại ⇒ "no changes" (model↔migration khớp).
- Không sửa migration đã commit; không sửa schema tay.

## naming / coding-style

- Field `snake_case`; service `advance`/`run_due` là hàm thuần (nhận `today`). YAGNI (không scheduler nền).
