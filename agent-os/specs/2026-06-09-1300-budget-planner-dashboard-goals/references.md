# References for Goals widget Dashboard

## Frontend (tái dùng/mô phỏng)

- `src/pages/Dashboard.jsx` — `Promise.allSettled([...])`, helper `SectionCard`, widget ngân sách (mẫu `LinearProgress` + `percent` + `goals.savedOf` tương tự `budgets.spentOf`).
- `src/api/goals.js` — `listGoals()` → `[{id,name,target_amount,saved_amount,percent,wallet_name,deadline}]`.
- `src/utils/format.js` — `formatAmount`.
- i18n: `goals.savedOf`, `goals.completed`, `dashboard.viewAll`; thêm `dashboard.goals`/`dashboard.noGoals`.
- `react-router-dom` `Link` (nút "Xem tất cả" → /goals).
