# Standards for Import CSV

---

## api/fastapi

- `POST /transactions/import` dùng `UploadFile`; RBAC member+; lọc `space_id` từ membership.
- Dữ liệu xấu → trả lỗi theo dòng trong body (không raise 500). `dry_run` không lưu.
- Đặt route `/import` trước `/{transaction_id}` (tránh nuốt path).

## testing/tdd

- Test trước: dry-run đếm hợp lệ/lỗi + không lưu; commit tạo hợp lệ + bỏ dòng lỗi; danh mục trống → gợi ý; BOM (utf-8-sig); viewer 403.

## database/migrations

- Không model mới ⇒ không revision; verify autogenerate no-op.

## naming / coding-style

- Field `snake_case`; tách hàm parse rõ; thông điệp lỗi tiếng Việt theo trường. YAGNI (multipart đã có, không thêm dep).
