# Standards for ML phân loại giao dịch

Các chuẩn áp dụng (trích nguyên văn từ `agent-os/standards/`).

---

## testing/tdd

- **Viết test trước**, implement sau (Test-Driven Development).
- Test trong `tests/` hoặc cùng cấp, đặt tên `test_*.py`, chạy bằng **`pytest`**.
- Mỗi hàm public có ≥ 1 test cho **case thường** + **case biên**.
- Test phải độc lập, không phụ thuộc thứ tự chạy; dùng fixture cho setup chung.
- Với API: test cả **happy path** lẫn **lỗi quyền** (vd Viewer không được sửa → 403).
- Với AI: test có **fallback** khi model không chắc; không assert cứng output sinh ngẫu nhiên.

> Áp dụng: giữ `test_categorizer.py` (5 case keyword + fallback) xanh; thêm `test_categorizer_ml.py` —
> ML generalize ngoài keyword + độ tin thấp → "Khác" (fallback) + **eval accuracy ≥ 0.75** (split cố
> định random_state → không ngẫu nhiên).

---

## root/coding-style

- Tuân thủ **PEP 8**; thụt lề 4 dấu cách; dòng ≤ ~100 ký tự.
- Format bằng **`black`**, lint bằng **`ruff`**. *(Repo dùng `ruff format`; CI chạy `ruff format --check`.)*
- **Type hint** cho tham số & giá trị trả về của hàm public.
- **Docstring tiếng Việt** ngắn gọn cho mỗi hàm/class.
- Ưu tiên **hàm thuần (pure function)**, dễ test; tránh side-effect ẩn.
- Không thêm dependency mới khi chưa cần (YAGNI).

> Áp dụng: `scikit-learn` đã có trong requirements (không thêm mới); import sklearn **lazy** trong
> `_get_model` + bọc try/except → degrade về rule khi lỗi; data card docstring cho dataset.

---

## root/naming

- `snake_case` cho hàm/biến, `PascalCase` cho class, `UPPER_SNAKE` cho hằng số.

> Áp dụng: `CATEGORIES`/`TRAINING_DATA`/`CONFIDENCE_THRESHOLD` (UPPER_SNAKE);
> `suggest_category`/`_rule_match`/`_ml_suggest`/`_get_model` (snake_case).

---

## (Không áp) api/fastapi, database/migrations

Slice backend-only: không thêm endpoint/schema/migration; chỉ thay phần lõi `suggest_category` (giữ
nguyên chữ ký `note -> str`, không ảnh hưởng 4 nơi gọi).
