# API Conventions (FastAPI)

- Router theo tài nguyên (`/transactions`, `/budgets`, `/spaces`); dùng **Pydantic** cho request/response schema.
- Mọi endpoint trả về schema rõ ràng; lỗi trả mã HTTP đúng (`400/401/403/404/422`).
- **Validation ở schema** (Pydantic), không validate thủ công rải rác.
- **Auth & RBAC bắt buộc ở backend:** mỗi request kiểm tra *(user có quyền X trên tài nguyên Y trong không gian Z?)* — không tin client.
- Quyền gắn với **(vai trò × không gian × tài nguyên)**, không hardcode theo user.
- Mọi truy vấn lọc theo **`space_id`** (cô lập dữ liệu giữa các không gian).
- Ghi **audit log** cho hành động nhạy cảm (đổi quyền, xoá, billing).
- Không log dữ liệu nhạy cảm (mật khẩu, token, số tiền chi tiết).
