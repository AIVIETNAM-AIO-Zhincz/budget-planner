# Standards for Reports nâng cao

---

## api/fastapi

- Mọi truy vấn lọc theo `space_id`; query param `from`/`to`.
- Đọc/xuất báo cáo = viewer+ (RBAC). HTTP code chuẩn (401/422).
- CSV: `Content-Disposition: attachment`, UTF-8 (BOM cho Excel).

## testing/tdd

- Viết test trước: summary (total/by_category/by_day), lọc khoảng thời gian, CSV (200 + text/csv + có dòng), 401 thiếu token.
- Test độc lập, fixture `owner`/`register`.

## naming / coding-style

- Field `snake_case`. Truy vấn tổng hợp gọn (func.sum/group_by). YAGNI.

## database/migrations

- Không revision mới (không đổi model). Verify autogenerate no-op.
