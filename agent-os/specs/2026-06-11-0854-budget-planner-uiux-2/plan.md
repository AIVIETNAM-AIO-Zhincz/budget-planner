# Budget Planner — UI/UX batch 2

## Context

Tiếp nối góp ý UI/UX (batch 1 đã xong ở PR #23). Batch 2 xử lý 4 mục đã chốt: **phân trang giao
dịch**, **% thay đổi so kỳ trước ở Báo cáo**, **validation inline cho form dialog**, **chuẩn hoá màu
badge danh mục**. Mục tiêu: dùng tốt khi dữ liệu nhiều + phản hồi rõ ràng hơn, **không phá 33 vitest
/ 141 pytest**.

**Quyết định đã chốt:** cả 4 mục, 1 PR. Nhánh `feature/budget-planner-uiux-2` từ `develop`.
Thiết kế **không phá hợp đồng**: `/transactions` vẫn trả MẢNG (thêm `limit/offset` opt-in) + endpoint
mới `/transactions/stats` → Dashboard (cần tất cả giao dịch cho chart) + test cũ không đổi.

## Sự thật đã khảo sát

- **BE `transactions.py`** `GET /transactions` trả `list[TransactionRead]`, filter `type/category/month/q`, order date desc; **chưa có limit/offset/stats**. Test `test_transactions.py` (dòng 40,107,117,125,133) assert **list** → giữ mảng để không vỡ.
- **FE Dashboard** dùng `listTransactions()` (KHÔNG filter) cho chart → cần TẤT CẢ → giữ mảng mặc định (không limit).
- **FE Transactions.jsx**: `items` (mảng), `summary=summarize(items)` (PR #23, tính trên trang), bảng `TableContainer/Table` (dòng 283+), **chưa có TablePagination**; `setItems(Array.isArray(data)?data:[])`.
- **BE `reports.py`** `GET /reports/summary?from&to` → `{total_income,total_expense,balance,by_category,by_day}`. FE `getSummary({from,to})`. Reports state `from=startOf("month")`, `to=now` (dayjs); 3 StatCard Tổng thu/chi/Số dư.
- **Validation dialog**: chuẩn tốt = `touched + error + helperText` (TransactionFormDialog/Contribute/Transfer). **Thiếu inline**: `WalletFormDialog` (name rỗng chỉ chặn submit), `InviteMemberDialog` (email chỉ HTML5).
- **`categoryColor`**: palette 8 màu + hash đơn giản → dễ trùng khi >8 danh mục. Test `format.test.js` chỉ đòi **deterministic + hex hợp lệ** (đổi thuật toán OK miễn giữ 2 tính chất).
- `StatCard` đã có `note` prop (text nhỏ) → chỗ gắn delta %.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-11-0854-budget-planner-uiux-2/`.

## Task 2 — BE: phân trang + stats (TDD)

- `transactions.py`: tách helper `_apply_filters(stmt, ...)` (DRY) dùng chung. `GET /transactions` thêm `limit:int|None` + `offset:int=0` (Query); nếu `limit` có → `.limit().offset()`; **không có limit → trả tất cả** (giữ hành vi cũ). Vẫn trả **mảng**.
- Endpoint mới `GET /transactions/stats` (cùng filter) → `{total:int, income:float, expense:float}` (count + sum theo type) — KHÔNG phân trang.
- **Test** `test_transactions.py`: thêm case limit/offset (số lượng + offset đúng) + stats (total/income/expense khớp filter). Test cũ giữ nguyên (không truyền limit → vẫn list).

## Task 3 — FE: phân trang giao dịch

- `api/transactions.js`: `listTransactions(filters)` thêm `limit/offset`; thêm `transactionStats(filters)` (gọi `/transactions/stats`).
- `Transactions.jsx`: state `page`/`rowsPerPage` (mặc định 20, options [10,20,50]); gọi `listTransactions({...filters, limit, offset})` + `transactionStats(filters)`; **MUI `TablePagination`** dưới bảng (count = stats.total). Thanh tổng (PR #23) chuyển dùng `stats.income/expense/balance` (đúng trên TOÀN bộ filter, không chỉ trang). Đổi filter → reset `page=0`. Bỏ `summarize(items)` nếu không còn dùng.

## Task 4 — FE: % so kỳ trước (Báo cáo)

- `Reports.jsx`: tính **kỳ trước** cùng độ dài (`len=to-from`; prev=[from-len-1d … from-1d]) bằng dayjs; gọi `getSummary` cho kỳ hiện tại + kỳ trước (song song). Tính delta % cho `total_income/total_expense/balance`.
- `StatCard`: thêm prop optional `delta` (số %, + tăng/− giảm) → render badge nhỏ ↑/↓ màu success/error (giữ `note`/`value`/`count` cũ). Reports truyền `delta` cho 3 thẻ. i18n `reports.vsPrev`.

## Task 5 — FE: validation inline

- Chuẩn hoá pattern `touched + error + helperText` cho field bắt buộc còn thiếu:
  - `WalletFormDialog`: `name` (error khi touched && rỗng) → `wallets.form.nameRequired`.
  - `InviteMemberDialog`: `email` (touched && !regex email) → `members.invite.emailInvalid`.
  - Rà nhanh `CategoryFormDialog`/`GoalFormDialog`/`BudgetFormDialog`: nếu có field name/required thiếu inline → thêm tương tự.
- i18n vi/en cho message mới.

## Task 6 — FE: chuẩn hoá màu badge danh mục

- `utils/format.js`: viết lại `categoryColor(name)` theo **golden-angle hue** (`hue=(hash*137.508)%360`) → `hslToHex(hue, S, L)` (S/L cố định hợp cả light/dark) ⇒ mỗi tên một màu phân biệt, vẫn **deterministic + trả hex**. Giữ `CATEGORY_COLORS` nếu cần fallback.
- `format.test.js`: giữ test cũ (deterministic + hex) + thêm assert vài tên khác nhau → màu khác nhau.

## Task 7 — Verify + giao nộp

- `pytest` (141 + mới) xanh; `ruff` sạch; `alembic` no-op (không đổi schema). `npm test` (33 + badge) + `npm run build` xanh.
- **Live** (BE :8000 + FE :5173 đang chạy): Giao dịch có phân trang + tổng đúng toàn bộ filter; Báo cáo hiện %↑↓ so kỳ trước; submit form trống thấy lỗi inline; badge danh mục đa dạng màu.
- Commit/push/PR vào `develop`; CI 5 check.

---

## Cấu trúc file

```
backend/app/api/transactions.py            (sửa — _apply_filters + limit/offset + /stats)
backend/tests/test_transactions.py         (sửa — test limit/offset/stats)
frontend/src/api/transactions.js           (sửa — limit/offset + transactionStats)
frontend/src/pages/Transactions.jsx        (sửa — TablePagination + stats)
frontend/src/pages/Reports.jsx             (sửa — getSummary kỳ trước + delta)
frontend/src/components/StatCard.jsx        (sửa — prop delta)
frontend/src/components/{WalletFormDialog,InviteMemberDialog}.jsx  (sửa — inline error)
frontend/src/utils/format.js (+ .test.js)  (sửa — categoryColor golden-angle + test)
frontend/src/i18n/locales/{vi,en}.json     (sửa — reports.vsPrev, *Required/emailInvalid)
```
Tái dùng: `_apply_filters` (DRY BE), `getSummary`, `formatCompactVnd`, pattern `touched+helperText`, dayjs. Backend đổi tối thiểu (không migration).

## Standards áp dụng

- **api/error-handling + naming** — endpoint stats nhất quán; filter DRY; không đổi schema/migration.
- **frontend/forms-ui** — TablePagination MUI; validation inline; màu badge phân biệt; i18n đầy đủ.
- **testing (TDD)** — viết test BE trước (limit/offset/stats); giữ 33 vitest + 141 pytest xanh; thêm test badge.

## Verification (lệnh)

```bash
# BE
cd conquer/budget-planner/backend && .venv/bin/python -m pytest -q && .venv/bin/ruff check .
# FE
cd ../frontend && npm test && npm run build
# live: :5173 — phân trang + tổng filter · %↑↓ Báo cáo · lỗi inline · badge đa màu
```
Kịch bản: bảng giao dịch phân trang (tổng đúng toàn filter) · Báo cáo %↑↓ so kỳ trước · form trống báo lỗi inline · badge danh mục nhiều màu phân biệt. Test BE+FE + build xanh.
