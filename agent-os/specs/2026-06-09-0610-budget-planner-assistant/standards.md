# Standards for Trợ lý AI

---

## api/fastapi

- Endpoint lọc theo `space_id`; HTTP code chuẩn (401/403/422).
- Parse/Q&A **không tạo dữ liệu** (chỉ đọc) → viewer+; tạo giao dịch qua form xác nhận (member+).
- Không log nội dung nhạy cảm.

## testing/tdd

- Viết test trước cho parser: số tiền (k/tr/nghìn/dấu chấm), ngày (hôm qua/kia/X ngày trước), loại (thu/chi), draft + danh mục.
- Q&A: chi/thu tháng, số dư ví; unknown. **Truyền `today`** để test xác định.

## naming / coding-style

- Parser là **hàm thuần** dễ test (nhận `text`, `today`). Field `snake_case`. YAGNI (rule-based, không thêm dep).

## database/migrations

- Không revision mới (không đổi model). Verify autogenerate no-op.
