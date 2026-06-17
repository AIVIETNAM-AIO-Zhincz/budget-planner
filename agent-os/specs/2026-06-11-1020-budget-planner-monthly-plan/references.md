# References for Dự kiến vs Thực tế (Kế hoạch tháng)

## Backend
- `app/models/__init__.py` Budget (mẫu period/limit) → +MonthlyPlan.
- `app/services/budget.py` `_period_range(period)` (tái dùng) · `app/services/report.py build_summary` (actual income/expense).
- `app/api/budgets.py` (pattern router + require_min_role + write_audit) · `app/api/_common.py`.
- `alembic/versions/` head `2e8056959549`; mẫu create_table `0adbc61de675_add_notifications.py`.
- `app/main.py` (include_router) · `tests/test_budgets.py` (pattern owner/period/assert).

## Frontend
- `pages/Budgets.jsx` (grid thẻ) + `api/budgets.js` → thêm card Kế hoạch tháng + `api/plans.js`.
- MUI DatePicker (dùng ở `Transactions.jsx`), LinearProgress (Budgets/Dashboard), `utils/format.js formatAmount`.
- `i18n/locales/{vi,en}.json`.
