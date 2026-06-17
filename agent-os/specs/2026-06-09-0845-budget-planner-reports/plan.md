# Budget Planner — Reports nâng cao + xuất CSV

## Context

Trang Reports hiện chỉ vẽ pie (theo danh mục) + line (theo ngày) từ **toàn bộ** giao dịch (tính client-side). Spec này nâng cấp: thêm **endpoint tổng hợp backend** (`/reports/summary` theo khoảng thời gian) + **xuất CSV** (`/reports/export.csv`), và FE: **lọc from/to**, **thẻ tổng thu/chi/số dư**, **top danh mục chi**, pie + line theo khoảng. Full-stack.

**Quyết định đã chốt:**
- **Tổng hợp ở backend** (`GET /reports/summary?from=&to=`).
- **Xuất CSV ở backend** (`GET /reports/export.csv` — file download).
- Reports nâng cao: lọc khoảng thời gian · thẻ tổng (thu/chi/số dư) · top danh mục chi · pie + line theo ngày.
- RBAC: đọc/ xuất = viewer+. Không cần migration. TDD backend. Nhánh `feature/budget-planner-reports` từ `develop`.

## Hợp đồng hiện có

- `app/api/transactions.py` — lọc theo space + (type/category/month/q). `Transaction(amount,type,category_name,date)`.
- `app/services/budget.py` `_period_range`; `app/rbac.get_current_space_id`.
- FE: `pages/Reports.jsx` (pie+line từ listTransactions), `utils/charts.js` (`pieOption`/`lineOption`/`expenseByCategory`/`flowByDate`), `components/StatCard.jsx`, `utils/format.js` (`formatAmount`,`categoryColor`), `api/client.js` (`BASE_URL`,`getAccessToken`,`getSpaceId`,`ApiError`).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-0845-budget-planner-reports/`.

## Task 2 — Backend Reports: summary + CSV (TDD)

- `app/schemas/report.py`: `CategoryAmount(name, amount)`, `DayFlow(date, income, expense)`, `ReportSummary(total_income, total_expense, balance, by_category: list[CategoryAmount], by_day: list[DayFlow])`.
- `app/services/report.py` (hàm thuần truy vấn): `build_summary(db, space_id, start, end) -> dict` — lọc `Transaction` theo space + `date` trong `[start, end]` (nếu có); tính total_income/expense (sum theo type); `by_category` = group expense theo `category_name` (sum, desc); `by_day` = group theo `date` (income/expense). `transactions_for_export(db, space_id, start, end) -> list[Transaction]`.
- `app/api/reports.py`:
  - `GET /reports/summary` (viewer+) — query `from`,`to` (YYYY-MM-DD, optional) → `ReportSummary`.
  - `GET /reports/export.csv` (viewer+) — `from`,`to` → `Response(media_type="text/csv", headers Content-Disposition attachment)`; cột: `date,type,category_name,note,amount` (UTF-8 BOM cho Excel).
  - Wire `main.py`.
- `tests/test_reports.py`: tạo giao dịch nhiều danh mục/ngày → summary đúng total/by_category/by_day; lọc from/to thu hẹp; CSV trả 200 + `text/csv` + chứa dòng; viewer+ OK; thiếu token 401.

## Task 3 — FE api/reports

- `src/api/reports.js`: `getSummary({from,to})` (apiFetch), `exportCsv({from,to})` — raw `fetch` kèm `Authorization`+`X-Space-Id` (từ client helper) → `blob` → tải file `transactions.csv` (Blob URL); lỗi → `ApiError`.

## Task 4 — FE Trang Reports nâng cao

`src/pages/Reports.jsx` (viết lại):
- **Thanh lọc**: 2 `DatePicker` from/to (mặc định đầu tháng → hôm nay) + nút **Xuất CSV**.
- **Thẻ tổng**: `StatCard` Tổng thu / Tổng chi / Số dư (từ summary).
- **Top danh mục chi**: ECharts bar ngang (by_category) hoặc danh sách + thanh.
- **Pie** (by_category) + **Line** (by_day) — dựng option từ summary (map sang `pieOption`/`lineOption` hiện có hoặc inline).
- loading skeleton, empty state, `Alert` lỗi. Refetch khi đổi from/to.

## Task 5 — i18n

`vi.json`/`en.json`: `reports.*` (from, to, exportCsv, totalIncome, totalExpense, balance, topCategories, byCategory, overTime, empty, loadError, exported). Mọi chữ `t()`.

## Task 6 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh; `alembic` autogenerate no-op.
- FE: `npm run build` xanh.
- Live (restart backend + dev): vào Reports → chọn khoảng → thẻ tổng + top danh mục + pie/line cập nhật; bấm Xuất CSV → tải file đúng dữ liệu khoảng đã chọn.

---

## Cấu trúc file

```
backend/app/schemas/report.py · services/report.py · api/reports.py  (mới)
backend/app/main.py                         (sửa — include reports)
backend/tests/test_reports.py               (mới)
frontend/src/api/reports.js                 (mới)
frontend/src/pages/Reports.jsx              (viết lại)
frontend/src/i18n/locales/vi.json · en.json (sửa)
```
Tái dùng: `Transaction` model, `get_current_space_id`, `StatCard`, ECharts + `pieOption`/`lineOption`, `formatAmount`/`categoryColor`, `api/client` helpers.

## Standards áp dụng

- **api/fastapi** — lọc `space_id`; query param; HTTP code chuẩn; đọc/xuất = viewer+ (RBAC).
- **testing/tdd** — test trước summary/CSV; happy + khoảng thời gian + cô lập/401.
- **naming/coding-style** — field `snake_case`; truy vấn gọn; YAGNI. **database/migrations** — không revision mới.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live: restart uvicorn :8000 ; dev :5173
```
Kịch bản: chọn khoảng → báo cáo cập nhật · xuất CSV tải đúng dữ liệu.
