# Standards for FE wiring Categories + Budgets

---

## naming

- `snake_case` — hàm/biến/file Python; **giữ field API `snake_case`** khi đọc/gửi (`category_id`, `limit_amount`, `parent_id`, `spent_amount`, `space_id`).
- React (JS): component & file component `PascalCase.jsx`; biến/hàm `camelCase`.

## api/fastapi (áp dụng phía FE)

- Mọi endpoint trả schema rõ ràng; lỗi HTTP đúng (`404` không thấy, `422` validation).
- FE map HTTP code lỗi sang thông báo người dùng; body request khớp schema:
  `period` đúng `^\d{4}-\d{2}$`, `limit_amount > 0`, `type ∈ {income,expense}`.
- Mọi request gắn header `X-Space-Id` (đã có trong `api/client.js`).

## coding-style

- Ưu tiên **hàm thuần** dễ test: `buildTree(categories)`, `budgetTone(percent)`.
- **YAGNI** — không thêm dependency mới; month-picker dùng `@mui/x-date-pickers` đã cài; giữ `fetch`.
- Component nhỏ, tái dùng (`ConfirmDialog`, `CategorySelect`).
