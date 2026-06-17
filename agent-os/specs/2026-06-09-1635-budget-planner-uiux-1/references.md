# References for Cải thiện UI/UX (batch 1)

## Charts
- `src/utils/charts.js` — `pieOption`/`lineOption`/`barOption`, `summarize`/`expenseByCategory`/`flowByDate`.
- `src/pages/Dashboard.jsx` (`ChartCard`, ReactECharts pie/line), `src/pages/Reports.jsx` (bar/pie/line).
- `echarts@5.5` + `echarts-for-react@3.0.2` (`opts={{renderer:"svg"}}` để khắc phục blank).

## Số tiền + cards
- `src/components/StatCard.jsx` (value Typography — thêm nowrap), `src/utils/format.js` (`formatAmount`; thêm `formatCompactVnd`).

## Giao dịch
- `src/pages/Transactions.jsx` (filter month=null→tháng này; chèn summary bar dùng `summarize(items)`), `src/api/transactions.js` (`listTransactions`).

## Trợ lý + Header
- `src/pages/Assistant.jsx` (greeting + input + handleSend; thêm quick-prompt chips), `src/layout/TopBar.jsx` (badge ngôn ngữ), `src/layout/Sidebar.jsx` (active/tooltip — verify).
- i18n `src/i18n/locales/{vi,en}.json` (`assistant.*`, `transactions.*`).
