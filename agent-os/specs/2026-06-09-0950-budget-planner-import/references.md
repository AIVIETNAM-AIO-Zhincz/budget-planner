# References for Import CSV

## Backend (tái dùng/mô phỏng)

- `conquer/budget-planner/backend/app/api/transactions.py` — `create_transaction` (set `space_id/user_id` từ membership), `require_min_role("member")`, `suggest_category`, `_get_owned`.
- `app/api/reports.py` — `export.csv` (cột `date,type,category_name,note,amount`) để khớp định dạng nhập.
- `app/schemas/transaction.py` — nơi thêm `ImportResult`/`ImportRowError`/`ImportPreviewRow`.
- `tests/conftest.py` — fixture `owner`/`make_member`.

## Frontend (tái dùng/mô phỏng)

- `src/api/reports.js` — `exportCsv` (raw `fetch` kèm auth header) → mẫu cho `importTransactions` (multipart `FormData`).
- `src/api/client.js` — `BASE_URL`/`getAccessToken`/`getSpaceId`/`ApiError`.
- `src/components/BrandDialog.jsx` — khung dialog cho `ImportDialog`.
- `src/pages/Transactions.jsx` — header có nút "Thêm giao dịch" (RBAC) → thêm nút "Import CSV".
