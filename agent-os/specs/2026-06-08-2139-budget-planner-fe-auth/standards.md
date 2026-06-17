# Standards for FE Login/Auth

---

## naming

- React (JS): component & file `PascalCase.jsx`; biến/hàm `camelCase`.
- **Giữ field API `snake_case`** khi đọc/gửi: `access_token`, `refresh_token`, `token_type`, `space_id`.

## api/fastapi (áp dụng phía FE)

- Map HTTP code lỗi sang thông báo: `401` (sai đăng nhập / hết hạn), `409` (email trùng), `422` (validation).
- **Login** gửi `application/x-www-form-urlencoded` (`username`,`password`) — OAuth2PasswordRequestForm; KHÔNG dùng JSON.
- Mọi request dữ liệu gắn `Authorization: Bearer <access>` + `X-Space-Id: <spaceId>`.
- Không log token/mật khẩu.

## coding-style

- Helper thuần cho localStorage (get/set/clear token & space).
- AuthContext gọn; YAGNI — không thêm dependency (dùng React Context + `fetch`).
