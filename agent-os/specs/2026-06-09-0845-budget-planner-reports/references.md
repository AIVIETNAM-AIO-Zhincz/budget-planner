# References for Reports nâng cao

## Backend (tái dùng/mô phỏng)

- `conquer/budget-planner/backend/app/api/transactions.py` — lọc theo space + date range (mẫu where date>=/<); `Transaction(amount,type,category_name,date)`.
- `app/services/budget.py` / `wallet.py` — mẫu truy vấn `func.coalesce(func.sum(...))`, group_by.
- `app/rbac` — `get_current_space_id` (viewer+). `tests/conftest.py` — fixture.

## Frontend (tái dùng/mô phỏng)

- `src/pages/Dashboard.jsx` / `Reports.jsx` — mẫu StatCard + ECharts.
- `src/utils/charts.js` — `pieOption`/`lineOption`/`expenseByCategory`/`flowByDate` (map summary sang).
- `src/components/StatCard.jsx`, `src/utils/format.js` (`formatAmount`,`categoryColor`).
- `src/api/client.js` — `BASE_URL`, `getAccessToken`, `getSpaceId`, `ApiError` (cho exportCsv raw fetch).
- MUI x-date-pickers DatePicker (đã dùng).
