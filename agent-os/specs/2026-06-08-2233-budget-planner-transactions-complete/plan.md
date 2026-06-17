# Budget Planner — Hoàn thiện Transactions (sửa/xoá/lọc/tìm + dropdown danh mục)

## Context

Slice Transactions hiện chỉ có **POST** (tạo) + **GET** (list toàn bộ). Thiếu sửa/xoá giao dịch và lọc/tìm kiếm — chưa đủ dùng thực tế. Spec này bổ sung **PATCH/DELETE + lọc query-param** ở backend và **sửa/xoá + thanh lọc + Autocomplete danh mục** ở FE. Full-stack.

**Quyết định đã chốt:**
- **Lọc ở backend**: `GET /transactions?type=&category=&month=&q=`.
- **Autocomplete danh mục** trong form (chọn từ `/categories` hoặc gõ mới; trống → AI gợi ý).
- TDD cho backend. Nhánh `feature/budget-planner-transactions-complete` từ `develop`.
- ⚠️ **Merge PR #6 (Members) trước** rồi nhánh từ `develop` — spec này cũng sửa `vi.json`/`en.json`, tránh xung đột i18n.

## Hợp đồng hiện có

- `app/api/transactions.py`: `POST` (member+, `_check_budget_overflow` inline), `GET` (list theo space). `_check_budget_overflow(db, tx)` tái dùng được.
- `app/schemas/transaction.py`: `TransactionBase/Create/Read` (`amount>0`, `type`, `note`, `category_name`, `date`, `wallet_id`).
- `app/services/budget.py`: `_period_range(period)` → (đầu tháng, đầu tháng sau).
- FE: `pages/Transactions.jsx` (list + thêm), `components/TransactionFormDialog.jsx` (chỉ thêm, category là TextField), `api/transactions.js` (list/create), `components/ConfirmDialog.jsx`, `CategoryChip.jsx`, `api/categories.js` (`listCategories`).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-08-2233-budget-planner-transactions-complete/`.

## Task 2 — Backend: filters + GET/{id} + PATCH + DELETE (TDD)

- `app/schemas/transaction.py`: thêm `TransactionUpdate` (mọi field Optional, partial; `amount: float|None Field(gt=0)`, `type` pattern, ...).
- `app/api/transactions.py`:
  - **`GET ""`** thêm query optional: `type`, `category` (khớp `category_name`), `month` (YYYY-MM → lọc `date` trong khoảng), `q` (tìm trong `note`, `Transaction.note.ilike("%q%")`). Lọc cộng dồn, vẫn lọc `space_id`.
  - **`GET "/{id}"`** → `TransactionRead`; 404 nếu khác space (helper `_get_owned`).
  - **`PATCH "/{id}"`** (`dependencies=[require_min_role("member")]`) → áp `model_dump(exclude_unset=True)`; commit/refresh; nếu `type=="expense"` → gọi lại `_check_budget_overflow`. 404 cô lập.
  - **`DELETE "/{id}"`** (member+) → 204 + `AuditLog(actor_id, action="transaction.deleted")`.
- `tests/test_transactions.py` (thêm): PATCH sửa field (200) + viewer 403 + cross-space 404; DELETE 204 + audit + viewer 403; GET lọc theo `type`/`category`/`month`/`q` (mỗi cái 1 test).

## Task 3 — FE api/transactions.js

- `listTransactions(filters)` — build query string từ `{type, category, month, q}` (bỏ field rỗng).
- `updateTransaction(id, patch)` (PATCH), `deleteTransaction(id)` (DELETE 204→null).

## Task 4 — FE TransactionFormDialog (sửa + Autocomplete)

- Thêm chế độ **sửa** (`initial` prop) — prefill amount/type/note/category_name/date; tiêu đề add/edit; parent quyết POST hay PATCH.
- Thay TextField danh mục bằng **`Autocomplete` freeSolo**: options = tên danh mục từ `listCategories()` (lọc theo `type` đang chọn: expense↔expense, income↔income); cho gõ tự do; trống → AI. Trả về chuỗi `category_name`.

## Task 5 — FE Trang Transactions (lọc + sửa/xoá)

- **Thanh lọc** trên bảng: `type` (Tất cả/Thu/Chi), `category` (Select tên danh mục + "Tất cả"), `month` (month-picker → YYYY-MM, có nút xoá), `q` (ô tìm theo ghi chú, debounce ~300ms). Đổi filter → `listTransactions(filters)` refetch.
- **Hàng**: thêm cột thao tác — sửa (mở dialog prefilled → `updateTransaction`), xoá (`ConfirmDialog` → `deleteTransaction`). Toast + refetch.
- Giữ skeleton/empty/error/snackbar.

## Task 6 — i18n

`vi.json`/`en.json`: mở rộng `transactions.*` — `edit`, `delete`, `deleteTitle`, `deleteConfirm`, `updated`, `deleted`, `filter` {all, type, category, month, search, clear}, `colActions`. Mọi chữ dùng `t()`.

## Task 7 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh; `alembic` autogenerate no-op.
- FE: `npm run build` xanh.
- Live (uvicorn + dev): đăng nhập → tạo vài giao dịch (danh mục khác nhau, tháng khác) → lọc theo loại/danh mục/tháng/tìm ghi chú → sửa 1 giao dịch (đổi số tiền/danh mục) → xoá 1 giao dịch (confirm) → vượt ngân sách khi sửa vẫn cảnh báo. Autocomplete gợi ý danh mục đã tạo.

---

## Cấu trúc file

```
backend/app/schemas/transaction.py     (sửa — TransactionUpdate)
backend/app/api/transactions.py        (sửa — filters, GET/{id}, PATCH, DELETE)
backend/tests/test_transactions.py     (sửa — thêm test PATCH/DELETE/filters)
frontend/src/api/transactions.js       (sửa — filters + update + delete)
frontend/src/components/TransactionFormDialog.jsx  (sửa — edit mode + Autocomplete)
frontend/src/pages/Transactions.jsx    (sửa — filter bar + edit/delete)
frontend/src/i18n/locales/vi.json · en.json  (sửa — transactions.*)
```
Tái dùng (không sửa): `_check_budget_overflow`, `ConfirmDialog`, `CategoryChip`, `api/categories.js`, `require_min_role`.

## Standards áp dụng

- **api/fastapi** — query param lọc + `space_id`; PATCH/DELETE cần member+ (RBAC); HTTP code (403/404/422); audit `transaction.deleted` kèm `actor_id`.
- **testing/tdd** — viết test trước cho PATCH/DELETE/filters; happy + 403 + cô lập.
- **naming/coding-style** — giữ field `snake_case`; helper thuần; YAGNI.
- **database/migrations** — không cần migration (không đổi model).

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live: uvicorn app.main:app --port 8000 ; npm run dev
```
Kịch bản: lọc/tìm · sửa · xoá · cảnh báo vượt khi sửa · Autocomplete danh mục.
