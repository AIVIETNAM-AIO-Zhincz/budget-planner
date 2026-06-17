# Standards for Đánh giá khả thi mục tiêu

Các chuẩn áp dụng (trích nguyên văn từ `agent-os/standards/`).

---

## testing/tdd

- **Viết test trước**, implement sau (Test-Driven Development).
- Test trong `tests/` hoặc cùng cấp, đặt tên `test_*.py`, chạy bằng **`pytest`**.
- Mỗi hàm public có ≥ 1 test cho **case thường** + **case biên**.
- Test phải độc lập, không phụ thuộc thứ tự chạy; dùng fixture cho setup chung.
- Với API: test cả **happy path** lẫn **lỗi quyền** (vd Viewer không được sửa → 403).
- Với AI: test có **fallback** khi model không chắc; không assert cứng output sinh ngẫu nhiên.

> Áp dụng: `test_goal.py` viết trước `goal.py`; case thường (đạt) + biên (done, no_surplus, hạn đã qua,
> ceil). GoalRead.feasibility test qua API. Chatbot test rule + LLM mock.

---

## root/coding-style

- Tuân thủ **PEP 8**; thụt lề 4 dấu cách; dòng ≤ ~100 ký tự.
- Format bằng **`black`**, lint bằng **`ruff`** (chạy trước khi commit). *(Repo dùng `ruff format`; CI
  chạy `ruff format --check`.)*
- **Type hint** cho tham số & giá trị trả về của hàm public.
- **Docstring tiếng Việt** ngắn gọn cho mỗi hàm/class.
- Ưu tiên **hàm thuần (pure function)**, dễ test; tránh side-effect ẩn.
- Không thêm dependency mới khi chưa cần (YAGNI).

> Áp dụng: `parse_timeframe_months`/`assess_goal` thuần (không DB); type hint + docstring tiếng Việt;
> không thêm dependency.

---

## root/naming

- `snake_case` cho hàm/biến, `PascalCase` cho class, `UPPER_SNAKE` cho hằng số.

> Áp dụng: `assess_goal`/`parse_timeframe_months`/`current_month_net` (snake_case); `GoalFeasibility`
> (PascalCase schema).

---

## api/fastapi

- Router theo tài nguyên; dùng **Pydantic** cho request/response schema.
- Mọi endpoint trả về schema rõ ràng; lỗi trả mã HTTP đúng (`400/401/403/404/422`).
- **Validation ở schema** (Pydantic), không validate thủ công rải rác.
- **Auth & RBAC bắt buộc ở backend**; mỗi truy vấn lọc theo **`space_id`**.
- Ghi **audit log** cho hành động nhạy cảm; không log dữ liệu nhạy cảm.

> Áp dụng: `GoalRead.feasibility` nhúng vào endpoint Goals sẵn có (lọc `space_id`, không thêm route).
> Chatbot dùng `/assistant/message` read-only.

---

## (Không áp) database/migrations

Slice không đổi schema — engine tính trên dữ liệu Goals + giao dịch có sẵn, **không** model/migration.
