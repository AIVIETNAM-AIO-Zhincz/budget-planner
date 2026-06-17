# References for Bộ test Frontend (Vitest)

## Frontend (đối tượng test)

- `src/utils/format.js` — `formatAmount`, `categoryColor`, `budgetTone`.
- `src/utils/charts.js` — `summarize`, `expenseByCategory`, `flowByDate`.
- `src/api/client.js` — `apiFetch` (gắn header, 204→null, ApiError, refresh-401 retry), `ApiError`, `setTokens`/`setSpace`/`clearAuth`/`setUnauthorizedHandler`.
- `src/components/StatCard.jsx` — props `{label,value,icon,accent}` (không dùng i18n).

## Cấu hình

- `vite.config.js` — thêm khối `test` (jsdom, setupFiles). `package.json` — devDeps + scripts.
- `.github/workflows/budget-planner.yml` — mẫu job `backend-test` để thêm `frontend-test`.
