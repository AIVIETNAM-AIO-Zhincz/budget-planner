# Standards for Hoàn thiện Transactions

---

## api/fastapi

- Query param lọc (`type`,`category`,`month`,`q`); mọi truy vấn vẫn lọc `space_id`.
- PATCH/DELETE cần vai trò **member+** (RBAC `require_min_role`); HTTP code đúng (403/404/422).
- Ghi **audit log** `transaction.deleted` kèm `actor_id` (hành động nhạy cảm).
- Validation ở schema (`amount>0`, `type` pattern).

## testing/tdd

- Viết test trước cho PATCH/DELETE/filters; happy path + **403** (viewer) + **cô lập space (404)**.
- Test độc lập, dùng fixture auth (`owner`, `make_member`, `register`).

## naming / coding-style

- Giữ field API `snake_case`; helper thuần; YAGNI (không thêm dep, không đổi model).

## database/migrations

- Không cần revision mới (không đổi schema). Verify autogenerate no-op.
