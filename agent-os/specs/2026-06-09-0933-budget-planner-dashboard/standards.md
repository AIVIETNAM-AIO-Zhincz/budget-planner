# Standards for Dashboard nâng cao

---

## frontend/forms-ui

- MUI theme/sx (không Tailwind). Mỗi widget có skeleton khi tải + empty khi rỗng.
- i18n đầy đủ (mọi chữ qua `t()`); responsive `Grid` (xs/md).
- Tái dùng `StatCard`, ECharts option (`pieOption`/`lineOption`), `formatAmount`/`categoryColor`.

## naming / coding-style

- Component/helper PascalCase; tách helper render gọn trong page. Không thêm dependency (YAGNI).
- Lỗi từng widget cô lập (Promise.allSettled hoặc catch riêng) — không chặn cả trang.

## api

- Chỉ đọc, tái dùng endpoint hiện có (`/transactions`,`/wallets`,`/budgets`,`/recurring`,`/categories`).
- Không đổi backend ⇒ không migration, không test backend. Verify bằng build + live.
