# References for Dashboard nâng cao

## Frontend (tái dùng/mô phỏng)

- `src/pages/Dashboard.jsx` — cấu trúc hiện tại (thẻ tổng + pie/line, `ChartCard` helper) → mở rộng.
- `src/pages/Budgets.jsx` — map `category_id → name` (fetch `listCategories`), `LinearProgress`/`percent`, `spentOf`/`remaining`.
- `src/pages/Wallets.jsx` — chip loại ví + số dư mono + dòng tổng.
- `src/pages/Recurring.jsx` — `fmtDate`, chip trạng thái, format số tiền ±.
- `src/components/StatCard.jsx` — props `{label,value,icon,accent}`.
- `src/utils/charts.js` (`summarize`/`expenseByCategory`/`flowByDate`/`pieOption`/`lineOption`), `src/utils/motion.js` (`echartsAnimationDefaults`), `src/utils/format.js` (`formatAmount`/`categoryColor`).
- `src/api/{transactions,wallets,budgets,recurring,categories}.js` — `listX` (đều dùng `apiFetch`).
- `react-router-dom` `Link` (nút "Xem tất cả").
