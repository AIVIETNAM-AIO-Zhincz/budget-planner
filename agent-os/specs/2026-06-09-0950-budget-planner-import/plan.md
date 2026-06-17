# Budget Planner — Import CSV giao dịch

## Context

Reports đã **xuất CSV** (`date,type,category_name,note,amount`). Spec này thêm chiều ngược lại: **nhập CSV** để tạo giao dịch hàng loạt — upload → **preview (dry-run)** danh sách hợp lệ + dòng lỗi → user xác nhận → tạo. Khép vòng export↔import. Full-stack, không model/migration mới.

**Quyết định đã chốt:**
- Luồng **preview rồi xác nhận** (dry-run trả hợp lệ + lỗi, không lưu; bấm Import mới tạo).
- **Không gắn ví** (khớp đúng cột file export → không động số dư ví).
- **Bỏ qua dòng lỗi**, vẫn nhập phần hợp lệ; liệt kê lỗi theo dòng.
- RBAC: import = member+. Danh mục trống → `suggest_category(note)`. Nhánh `feature/budget-planner-import` từ `develop`. TDD.

## Hợp đồng hiện có

- `app/api/transactions.py` — `create_transaction` (set `space_id/user_id` từ `membership`), `require_min_role("member")`, `suggest_category`. `Transaction(amount,type,category_name,note,date,wallet_id=None)`.
- `app/api/reports.py` — `export.csv` cột `date,type,category_name,note,amount` (chuẩn để khớp).
- `python-multipart>=0.0.9` đã có → dùng `UploadFile`.
- FE: `pages/Transactions.jsx` (nút "Thêm giao dịch" ở header, RBAC), `components/BrandDialog.jsx`, `api/client.js` (`BASE_URL`/`getAccessToken`/`getSpaceId`/`ApiError` — mẫu `reports.exportCsv` raw fetch), `api/reports.js` (mẫu multipart/blob).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-0950-budget-planner-import/`.

## Task 2 — Backend: endpoint import (TDD)

- `app/schemas/transaction.py` (bổ sung): `ImportRowError(line:int, message:str)`, `ImportPreviewRow(date,type,category_name,note,amount)`, `ImportResult(dry_run:bool, valid_count:int, error_count:int, created:int, errors:list[ImportRowError], preview:list[ImportPreviewRow])`.
- `app/api/transactions.py` — `POST /transactions/import` (member+), `UploadFile` + query `dry_run: bool=False`:
  - Đọc `file.file.read().decode("utf-8-sig")` (bỏ BOM) → `csv.DictReader`.
  - Mỗi dòng (line bắt đầu 2): validate `date` (`date.fromisoformat`), `type` ∈ income/expense, `amount` float > 0; `category_name` trống → `suggest_category(note)`. Lỗi → `errors[{line,message}]` (thông điệp tiếng Việt theo trường), **không** chặn dòng khác.
  - `dry_run=True`: không lưu, trả `valid_count/error_count/errors/preview(≤20)`.
  - `dry_run=False`: tạo `Transaction` (no wallet) cho dòng hợp lệ, commit, `created=len(valid)`.
  - Đặt route `/import` trước route `"/{transaction_id}"` để tránh nuốt path.
- `tests/test_import.py`: dry-run đếm đúng + không lưu; commit tạo dòng hợp lệ + bỏ dòng lỗi; danh mục trống → gợi ý; BOM ok; viewer 403.

## Task 3 — FE api + ImportDialog + nút

- `src/api/transactions.js` (bổ sung): `importTransactions(file, dryRun)` — raw `fetch` multipart (`FormData`, **không** set Content-Type) kèm `Authorization`+`X-Space-Id`; trả JSON; lỗi → `ApiError`.
- `src/components/ImportDialog.jsx` (BrandDialog): input chọn file `.csv` → tự gọi dry-run → hiện tóm tắt (hợp lệ N / lỗi M) + bảng preview vài dòng + danh sách lỗi (dòng + lý do) → nút **Import** gọi commit → `onDone(created)`; trạng thái loading; gợi ý tải mẫu (mô tả cột).
- `src/pages/Transactions.jsx`: nút **"Import CSV"** (member+) cạnh "Thêm giao dịch" → mở `ImportDialog`; `onDone` → toast "đã nhập N" + refetch.

## Task 4 — i18n

`vi.json`/`en.json`: `transactions.import.*` (button, title, chooseFile, columnsHint, validCount, errorCount, previewTitle, errorsTitle, doImport, imported, parseError, empty). `t()`.

## Task 5 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh; `alembic` autogenerate **no-op** (không đổi model).
- FE: `npm run build` xanh.
- Live (backend đã chạy + dev): xuất CSV từ Reports → sửa thêm dòng → Import: preview hiện hợp lệ + lỗi → Import → giao dịch xuất hiện ở danh sách. Round-trip export→import khớp.

---

## Cấu trúc file

```
backend/app/schemas/transaction.py          (sửa — ImportResult/Row/Error)
backend/app/api/transactions.py             (sửa — POST /transactions/import)
backend/tests/test_import.py                (mới)
frontend/src/api/transactions.js            (sửa — importTransactions)
frontend/src/components/ImportDialog.jsx     (mới)
frontend/src/pages/Transactions.jsx         (sửa — nút Import CSV)
frontend/src/i18n/locales/vi.json · en.json (sửa)
```
Tái dùng: `suggest_category`, `require_min_role`, `Transaction`, `BrandDialog`, `api/client` helpers (mẫu `reports.exportCsv`).

## Standards áp dụng

- **api/fastapi** — `UploadFile`; member+; lọc space_id; trả lỗi theo dòng (không 500 vì dữ liệu xấu).
- **testing/tdd** — test trước parse/dry-run/commit/lỗi/RBAC; deterministic.
- **database/migrations** — không model mới ⇒ không revision (verify no-op).
- **naming/coding-style** — field `snake_case`; parser tách hàm rõ; YAGNI (không thêm dep — multipart đã có).

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live: backend :8000 + dev :5173 — Reports xuất CSV → Import lại
```
Kịch bản: import preview (hợp lệ + lỗi) → xác nhận → giao dịch vào danh sách; round-trip export→import.
