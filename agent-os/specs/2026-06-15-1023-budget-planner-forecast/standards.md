# Standards for Dự báo chi tiêu tháng sau

Các chuẩn áp dụng (trích nguyên văn từ `agent-os/standards/`).

---

## testing/tdd

- **Viết test trước**, implement sau (Test-Driven Development).
- Test trong `tests/` hoặc cùng cấp, đặt tên `test_*.py`, chạy bằng **`pytest`**.
- Mỗi hàm public có ≥ 1 test cho **case thường** + **case biên**.
- Test phải độc lập, không phụ thuộc thứ tự chạy; dùng fixture cho setup chung.
- Với API: test cả **happy path** lẫn **lỗi quyền** (vd Viewer không được sửa → 403).
- Với AI: test có **fallback** khi model không chắc; không assert cứng output sinh ngẫu nhiên.

> Áp dụng: `test_forecast.py` viết trước `forecast.py`; thường (3 tháng → TB) + biên (rỗng → None,
> 1–2 tháng, giá trị bằng nhau → mad=0). Endpoint `/reports/forecast` test happy + 401. Chatbot rule + mock.

---

## root/coding-style

- Tuân thủ **PEP 8**; thụt lề 4 dấu cách; dòng ≤ ~100 ký tự.
- Format bằng **`black`**, lint bằng **`ruff`**. *(Repo dùng `ruff format`; CI chạy `ruff format --check`.)*
- **Type hint** cho tham số & giá trị trả về của hàm public.
- **Docstring tiếng Việt** ngắn gọn cho mỗi hàm/class.
- Ưu tiên **hàm thuần (pure function)**, dễ test; tránh side-effect ẩn.
- Không thêm dependency mới khi chưa cần (YAGNI).

> Áp dụng: `forecast_series` thuần (chỉ nhận list số); không thêm thư viện ML (dùng trung bình trượt +
> MAD bằng Python thuần). Top-N danh mục cố định (không cấu hình).

---

## root/naming

- `snake_case` cho hàm/biến, `PascalCase` cho class, `UPPER_SNAKE` cho hằng số.

> Áp dụng: `forecast_series`/`recent_monthly_expense` (snake_case); `ReportForecast`/`CategoryForecast`
> (PascalCase schema).

---

## api/fastapi

- Router theo tài nguyên; dùng **Pydantic** cho request/response schema.
- Mọi endpoint trả về schema rõ ràng; lỗi trả mã HTTP đúng (`400/401/403/404/422`).
- **Validation ở schema** (Pydantic), không validate thủ công rải rác.
- **Auth & RBAC bắt buộc ở backend**; mỗi truy vấn lọc theo **`space_id`**.

> Áp dụng: `GET /reports/forecast` read-only, schema `ReportForecast`, lọc `space_id` (qua
> `get_current_space_id`). Read-only → không audit.

---

## (Không áp) database/migrations

Slice không đổi schema — dự báo tính trên dữ liệu giao dịch có sẵn, **không** model/migration.
