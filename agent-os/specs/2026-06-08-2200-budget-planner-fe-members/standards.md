# Standards for FE Members

---

## naming

- React (JS): component & file `PascalCase.jsx`; biến/hàm `camelCase`.
- Giữ field API `snake_case`: `user_id`, `space_id`.

## api/fastapi (áp dụng phía FE)

- Map HTTP code lỗi: `403` (thiếu quyền/đổi-xoá owner), `404` (email chưa có tài khoản / không thấy), `409` (đã là thành viên), `422`.
- Body khớp schema: `role` ∈ `owner|admin|member|viewer`.
- **RBAC ẩn nút chỉ là trải nghiệm** — backend mới là nơi chặn thật (đừng tin client).

## coding-style

- Helper thuần (nhãn vai trò, kiểm quyền); component nhỏ tái dùng.
- YAGNI — không thêm dependency.
