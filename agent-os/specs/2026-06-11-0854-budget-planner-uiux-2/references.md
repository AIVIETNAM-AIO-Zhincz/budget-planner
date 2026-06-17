# References for UI/UX batch 2

## Phân trang
- `backend/app/api/transactions.py` — `list_transactions` (filter type/category/month/q) → tách `_apply_filters` + thêm `limit/offset` + `/transactions/stats`.
- `backend/tests/test_transactions.py` — giữ assert list (no limit); thêm test limit/offset/stats.
- `frontend/src/api/transactions.js` — `listTransactions`; thêm `transactionStats`.
- `frontend/src/pages/Transactions.jsx` — bảng + thanh tổng (PR #23) → TablePagination + stats.
- `frontend/src/pages/Dashboard.jsx` — `listTransactions()` (no limit) cho chart, giữ nguyên.

## % so kỳ trước
- `frontend/src/api/reports.js` `getSummary({from,to})`; `frontend/src/pages/Reports.jsx` (from/to dayjs, 3 StatCard); `components/StatCard.jsx` thêm `delta`.

## Validation
- Pattern chuẩn: `TransactionFormDialog`/`ContributeDialog`/`TransferDialog` (`touched+error+helperText`). Sửa: `WalletFormDialog` (name), `InviteMemberDialog` (email).

## Màu badge
- `frontend/src/utils/format.js` `categoryColor`/`CATEGORY_COLORS` (+ `format.test.js`). Dùng tại CategoryChip, Dashboard recent, charts, Reports.
