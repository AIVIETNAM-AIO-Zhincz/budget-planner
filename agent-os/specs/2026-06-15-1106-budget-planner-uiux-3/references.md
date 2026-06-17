# References for UI/UX batch 3

## Polish/bug
- `layout/AppLayout.jsx` (page-transition GSAP) · `theme/index.js` (MuiOutlinedInput override).
- `components/StatCard.jsx` + `pages/Dashboard.jsx` (KPI height + widget Định kỳ).
- `components/MonthlyPlanCard.jsx` (input số) · `pages/Goals.jsx` (chip quỹ) · `layout/TopBar.jsx` (titleKeyFromPath).
- `services/goal.py assess_goal` (months_needed) + `tests/test_goals.py`.

## Empty state
- `components/ComingSoon.jsx` (pattern icon+heading) → `components/EmptyState.jsx`. Áp: Transactions/Recurring/Wallets/Categories/Goals/Budgets.

## Dữ liệu/widget
- `api/categories.py` + `schemas/category.py` (CategoryRead +tx_count/tx_total) + aggregate Transaction.
- `pages/Recurring.jsx` (tổng/tháng) · `pages/Annual.jsx` (bảng 12 tháng) · `pages/Categories.jsx` (count/tổng).
- i18n `i18n/locales/{vi,en}.json`.
