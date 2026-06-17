# Dashboard nâng cao — Shaping Notes

## Scope

Mở rộng trang chủ: thêm 4 widget (tổng quan ngân sách tháng này, số dư các ví, giao dịch gần đây, định kỳ sắp đến hạn) bên cạnh thẻ tổng + pie + line hiện có. Thuần frontend, tái dùng API.

## Decisions

- 4 widget: Tổng quan ngân sách · Số dư ví · Giao dịch gần đây · Định kỳ sắp đến hạn (≤ 7 ngày).
- Giữ thẻ tổng + pie + line. Không đổi backend (endpoint đã đủ field).
- Nạp thêm `listWallets`, `listBudgets`, `listRecurring`, `listCategories` (resolve tên danh mục cho budget). Lỗi từng phần không chặn trang.

## Context

- **Visuals:** None (theo style hiện có của app).
- **References:** `pages/Dashboard.jsx` (cấu trúc hiện tại), `pages/Budgets.jsx` (catNames map id→name), `pages/Wallets.jsx`/`Recurring.jsx` (chip/format), `StatCard`, `utils/charts.js`, `utils/format.js`.
- **Product alignment:** Roadmap — dashboard tổng quan tài chính.

## Standards Applied

- **frontend/forms-ui** — MUI theme/sx; skeleton/empty mỗi widget; i18n; responsive Grid.
- **naming/coding-style** — helper render gọn; PascalCase; YAGNI (không thêm dep).
- **api** — chỉ đọc, tái dùng endpoint; không backend/migration/test backend.
