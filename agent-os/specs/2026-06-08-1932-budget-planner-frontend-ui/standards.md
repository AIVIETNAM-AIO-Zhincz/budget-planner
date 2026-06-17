# Standards for Budget Planner — Frontend UI Shell

Các standard sau áp dụng cho phần việc này (trích từ `agent-os/standards/`).

---

## naming

- `snake_case` — hàm, biến, module, file Python.
- `PascalCase` — class, Pydantic model, SQLAlchemy model.
- `UPPER_SNAKE` — hằng số.
- Tên rõ nghĩa, không viết tắt mơ hồ; tên hàm là động từ, tên biến là danh từ.
- Bảng database & cột: `snake_case`, số nhiều cho bảng, khoá ngoại `{entity}_id`.

**Áp dụng cho FE (JS):** component & file component dùng `PascalCase.jsx` (quy ước React); biến/hàm JS dùng `camelCase`. **Giữ nguyên field API dạng `snake_case`** (`category_name`, `wallet_id`, `space_id`) khi gọi/đọc — không đổi tên để khớp backend Pydantic.

---

## api/fastapi

- Router theo tài nguyên (`/transactions`, `/budgets`, `/spaces`); dùng **Pydantic** cho request/response schema.
- Mọi endpoint trả về schema rõ ràng; lỗi trả mã HTTP đúng (`400/401/403/404/422`).
- **Validation ở schema** (Pydantic), không validate thủ công rải rác.
- **Auth & RBAC bắt buộc ở backend:** mỗi request kiểm tra (user có quyền X trên tài nguyên Y trong không gian Z?) — không tin client.
- Quyền gắn với (vai trò × không gian × tài nguyên), không hardcode theo user.
- Mọi truy vấn lọc theo **`space_id`** (cô lập dữ liệu giữa các không gian).
- Ghi **audit log** cho hành động nhạy cảm.

**Áp dụng cho FE:** client gắn header `X-Space-Id` mọi request; map HTTP code lỗi sang thông báo người dùng (422 → lỗi nhập liệu, 4xx khác → thông báo tương ứng); body request khớp đúng `TransactionCreate` (`amount`, `type`, `note`, `category_name`, `date`, `wallet_id`). UI ẩn/disable nút theo vai trò chỉ là UX — backend mới là nơi chặn thật.

---

## coding-style

- Format `black` / lint `ruff` (Python).
- **Type hint** & **docstring tiếng Việt** cho hàm public.
- Ưu tiên **hàm thuần (pure function)**, tránh side-effect ẩn.
- Không thêm dependency mới khi chưa cần (**YAGNI**).

**Áp dụng cho FE:** giữ helper (format tiền, gom dữ liệu chart) là hàm thuần dễ test; chỉ thêm dep thực dùng (giữ `fetch`, không thêm axios).
