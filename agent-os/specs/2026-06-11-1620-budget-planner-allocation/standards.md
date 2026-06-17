# Standards for Engine đề xuất & đánh giá phân bổ

Các chuẩn áp dụng (trích nguyên văn từ `agent-os/standards/`).

---

## testing/tdd

- **Viết test trước**, implement sau (Test-Driven Development).
- Test trong `tests/` hoặc cùng cấp, đặt tên `test_*.py`, chạy bằng **`pytest`**.
- Mỗi hàm public có ≥ 1 test cho **case thường** + **case biên**.
- Test phải độc lập, không phụ thuộc thứ tự chạy; dùng fixture cho setup chung.
- Với API: test cả **happy path** lẫn **lỗi quyền** (vd Viewer không được sửa → 403).
- Với AI: test có **fallback** khi model không chắc; không assert cứng output sinh ngẫu nhiên.

> Áp dụng: `test_allocation.py` viết trước `allocation.py`; case thường (đạt 50/30/20) + biên (income=0,
> vượt từng ngưỡng, wasteful>0). API `/reports/allocation` test happy + 401. Chatbot test rule + LLM mock.

---

## root/coding-style

- Tuân thủ **PEP 8**; thụt lề 4 dấu cách; dòng ≤ ~100 ký tự.
- Format bằng **`black`**, lint bằng **`ruff`** (chạy trước khi commit). *(Repo dùng `ruff format`; CI
  chạy `ruff format --check`.)*
- **Type hint** cho tham số & giá trị trả về của hàm public.
- **Docstring tiếng Việt** ngắn gọn cho mỗi hàm/class.
- Ưu tiên **hàm thuần (pure function)**, dễ test; tránh side-effect ẩn.
- Không thêm dependency mới khi chưa cần (YAGNI).

> Áp dụng: `assess_allocation` thuần (nhận số liệu, không DB); type hint + docstring tiếng Việt; không
> thêm dependency; không config rule (YAGNI).

---

## root/naming

- `snake_case` cho hàm/biến, `PascalCase` cho class, `UPPER_SNAKE` cho hằng số.

> Áp dụng: `TARGETS` (UPPER_SNAKE); `assess_allocation` (snake_case); `AllocationGroup`/
> `ReportAllocation` (PascalCase schema).

---

## api/fastapi

- Router theo tài nguyên; dùng **Pydantic** cho request/response schema.
- Mọi endpoint trả về schema rõ ràng; lỗi trả mã HTTP đúng (`400/401/403/404/422`).
- **Validation ở schema** (Pydantic), không validate thủ công rải rác.
- **Auth & RBAC bắt buộc ở backend**; mỗi truy vấn lọc theo **`space_id`**.
- Ghi **audit log** cho hành động nhạy cảm; không log dữ liệu nhạy cảm.

> Áp dụng: `GET /reports/allocation` read-only, schema `ReportAllocation`, lọc `space_id` (qua
> `get_current_space_id`), mẫu `_parse` khoảng ngày như các endpoint reports khác. Read-only → không audit.

---

## (Không áp) database/migrations

Slice không đổi schema — engine tính trên số liệu có sẵn, **không** model/bảng/migration.
