# Standards for FAQ tri thức tài chính

Các chuẩn áp dụng cho slice này (trích nguyên văn từ `agent-os/standards/`).

---

## testing/tdd

- **Viết test trước**, implement sau (Test-Driven Development).
- Test trong `tests/` hoặc cùng cấp, đặt tên `test_*.py`, chạy bằng **`pytest`**.
- Mỗi hàm public có ≥ 1 test cho **case thường** + **case biên**.
- Test phải độc lập, không phụ thuộc thứ tự chạy; dùng fixture cho setup chung.
- Với API: test cả **happy path** lẫn **lỗi quyền** (vd Viewer không được sửa → 403).
- Với AI: test có **fallback** khi model không chắc; không assert cứng output sinh ngẫu nhiên.

> Áp dụng: `test_faq.py` viết trước `faq.py`; test `match_faq`/`answer_faq` (thường + biên: id lạ,
> không khớp); test FAQ qua đường LLM (mock `classify_message`) **và** fallback keyword khi LLM tắt.

---

## root/coding-style

- Tuân thủ **PEP 8**; thụt lề 4 dấu cách; dòng ≤ ~100 ký tự.
- Format bằng **`black`**, lint bằng **`ruff`** (chạy trước khi commit). *(Repo dùng `ruff format`; CI
  chạy `ruff format --check`.)*
- **Type hint** cho tham số & giá trị trả về của hàm public.
- **Docstring tiếng Việt** ngắn gọn cho mỗi hàm/class (mục đích, input/output).
- Ưu tiên **hàm thuần (pure function)**, dễ test; tránh side-effect ẩn.
- Dùng `if __name__ == "__main__":` cho demo; không để code chạy ở cấp module.
- Không thêm dependency mới khi chưa cần (YAGNI).

> Áp dụng: `faq.py` toàn hàm thuần (KB tĩnh + match + answer), type hint + docstring tiếng Việt;
> không thêm dependency.

---

## root/naming

- `snake_case` cho hàm/biến, `PascalCase` cho class, `UPPER_SNAKE` cho hằng số.

> Áp dụng: `FAQ_INTENTS` (UPPER_SNAKE), `match_faq`/`answer_faq` (snake_case).

---

## api/fastapi

- Router theo tài nguyên; dùng **Pydantic** cho request/response schema.
- Mọi endpoint trả về schema rõ ràng; lỗi trả mã HTTP đúng (`400/401/403/404/422`).
- **Validation ở schema** (Pydantic), không validate thủ công rải rác.
- **Auth & RBAC bắt buộc ở backend**; mỗi truy vấn lọc theo **`space_id`**.
- Ghi **audit log** cho hành động nhạy cảm; không log dữ liệu nhạy cảm.

> Áp dụng: tái dùng endpoint `POST /assistant/message` (read-only, đã có auth + `space_id`);
> giữ envelope `AssistantReply` (thêm giá trị `kind="faq"`, `draft=None`). Không thêm route, không
> đổi schema struct.

---

## (Không áp) database/migrations

Slice không đổi schema — KB là dữ liệu tĩnh trong code, **không** tạo model/bảng/migration.
