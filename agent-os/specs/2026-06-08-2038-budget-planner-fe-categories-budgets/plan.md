# Budget Planner — FE wiring Categories + Budgets

## Context

API backend cho Categories + Budgets (Full CRUD + `spent/remaining/percent`, cảnh báo vượt ngân sách) đã merge vào `develop` (PR #2). Hai trang FE tương ứng vẫn là `ComingSoon` placeholder. Spec này **nối 2 trang vào API thật**, tái dùng pattern đã có ở trang Transactions (PR #1): `BrandDialog`, `PageHeader`, `CategoryChip`, `api/client.js` (+`ApiError`), skeleton/empty/error/snackbar, theme MUI, i18n vi/en, `formatAmount`.

**Quyết định đã chốt:**
- **Categories:** hiển thị **cây cha–con** (danh mục gốc + con thụt vào); form chọn "danh mục cha".
- **Budgets:** **thẻ + progress bar** đổi màu theo % (xanh <80 / cam <100 / đỏ ≥100), hiện đã chi / hạn mức / còn lại.
- **Form input:** **dropdown đổ từ `GET /categories`** (Budget chọn danh mục, Category chọn cha); **period** dùng month-picker → `YYYY-MM`.
- Phạm vi **FE-only**; backend không đổi. Nhánh `feature/budget-planner-fe-categories-budgets` từ `develop`.

## Hợp đồng API (đã có ở backend)

- `GET/POST /categories`, `GET/PATCH/DELETE /categories/{id}` — `{id, space_id, name, type "income"|"expense", parent_id|null}`.
- `GET/POST /budgets`, `GET/PATCH/DELETE /budgets/{id}` — `{id, space_id, period "YYYY-MM", limit_amount, category_id|null, spent_amount, remaining, percent}`.
- Header `X-Space-Id: demo-space` (đã gắn sẵn trong `api/client.js`). Lỗi → `ApiError{status,message}` (422 validation, 404).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-08-2038-budget-planner-fe-categories-budgets/` gồm plan/shape/standards/references + visuals/ (kèm 2 ASCII mockup đã chọn).

## Task 2 — API modules

- `src/api/categories.js`: `listCategories()`, `createCategory({name,type,parent_id})`, `updateCategory(id, patch)`, `deleteCategory(id)` — dùng `apiFetch` (PATCH method, DELETE trả 204→null). Mirror `api/transactions.js`.
- `src/api/budgets.js`: `listBudgets()`, `createBudget({period,limit_amount,category_id})`, `updateBudget(id, patch)`, `deleteBudget(id)`.

## Task 3 — Component dùng chung

- `src/components/ConfirmDialog.jsx` — dialog xác nhận xoá (bọc `BrandDialog`): title, message, nút Huỷ/Xoá (màu error). Dùng cho cả 2 trang.
- `src/components/CategorySelect.jsx` — MUI `Select`/`TextField select` đổ từ `listCategories()` (props: `value`, `onChange`, `label`, `typeFilter?`, `excludeId?` để loại chính nó khi chọn cha, `allowNone`). Tự fetch + cache danh mục, có trạng thái loading.

## Task 4 — Categories (cây cha–con)

- `src/components/CategoryFormDialog.jsx` — form thêm/sửa: `name`, `type` (ToggleButtonGroup income/expense như TransactionFormDialog), `parent_id` (`CategorySelect`, allowNone, excludeId=đang sửa). `onSubmit(payload)` async.
- `src/pages/Categories.jsx` (thay `ComingSoon`):
  - fetch `listCategories`; gom cây bằng helper thuần `buildTree(cats)` (gốc = `parent_id` null/không khớp; con nhóm theo `parent_id`).
  - render danh sách: hàng gốc (tên + `CategoryChip` loại + nút sửa/xoá), con thụt lề dưới gốc (icon `└`). Dùng `Paper` + `List`.
  - `PageHeader` + nút "Thêm danh mục" → `CategoryFormDialog`; sửa mở dialog prefilled (PATCH); xoá → `ConfirmDialog` → `deleteCategory` → refetch.
  - skeleton (loading), empty state, `Alert` lỗi (map `ApiError`), `Snackbar` thành công.

## Task 5 — Budgets (thẻ + progress bar)

- `src/components/BudgetFormDialog.jsx` — form thêm/sửa: `category_id` (`CategorySelect`, typeFilter="expense"), `period` (`DatePicker` views=['year','month'], format 'MM/YYYY' → `value.format("YYYY-MM")`), `limit_amount`. Validate limit>0 (helperText).
- `src/pages/Budgets.jsx` (thay `ComingSoon`):
  - fetch song song `listBudgets()` + `listCategories()` (map `category_id → name` để hiển thị).
  - mỗi budget = `Paper` card: tiêu đề "{tên danh mục} · {period}", `LinearProgress` value=min(percent,100) màu theo `budgetTone(percent)` (success/warning/error), dòng "đã chi `formatAmount(spent)` / `formatAmount(limit)` ₫", "Còn lại: …" (đỏ nếu âm), nút sửa/xoá.
  - `PageHeader` + "Thêm ngân sách"; sửa (PATCH limit/period/category); xoá → `ConfirmDialog`.
  - skeleton/empty/error/snackbar như trên. Layout `Grid` responsive (xs=12, md=6).
- Helper `budgetTone(percent)` trong `src/utils/format.js`: `<80 → "success"`, `<100 → "warning"`, `>=100 → "error"`.

## Task 6 — i18n

Mở rộng `src/i18n/locales/vi.json` + `en.json` (giữ key `pages.categories*`/`budgets*` đã có): thêm nhóm `categories.*` (add, form: name/type/parent/parentNone, empty, deleteConfirm, created/updated/deleted) và `budgets.*` (add, form: category/period/limit, card: spent/limit/remaining, empty, deleteConfirm, …) + `common.delete`, `common.edit`, `common.confirm`. Mọi chữ trên UI dùng `t()`.

## Task 7 — Verify

- `npm run build` ✅ (không lỗi import/JSX).
- `npm run dev` + backend `:8000`: tạo danh mục "Ăn uống" → tạo con "Cà phê" → cây hiển thị thụt; tạo ngân sách (chọn "Ăn uống", 2026-06, 100k) → thẻ + progress; thêm vài giao dịch "Ăn uống" → progress đổi màu/đỏ khi vượt; sửa/xoá hoạt động; đổi dark mode + vi/en OK.
- Empty/error: tắt backend → trang hiện error state, không crash.

---

## Cấu trúc file (`src/`)

```
api/categories.js · api/budgets.js                         (mới)
components/ConfirmDialog.jsx · CategorySelect.jsx           (mới)
components/CategoryFormDialog.jsx · BudgetFormDialog.jsx    (mới)
pages/Categories.jsx · pages/Budgets.jsx                    (thay ComingSoon)
utils/format.js                                            (sửa — thêm budgetTone)
i18n/locales/vi.json · en.json                             (sửa — thêm keys)
```
Tái dùng (không sửa): `components/BrandDialog.jsx`, `PageHeader.jsx`, `CategoryChip.jsx`, `api/client.js`, `utils/format.js` (formatAmount/categoryColor), theme. Router đã có route `/categories`, `/budgets`.

## Standards áp dụng

- **naming** — component `PascalCase.jsx`, biến/hàm `camelCase`; **giữ field API `snake_case`** (`category_id`, `limit_amount`, `parent_id`, `spent_amount`).
- **api/fastapi (phía FE)** — map HTTP code lỗi (422/404) sang thông báo; body khớp schema (`period` đúng `YYYY-MM`, `limit_amount>0`).
- **coding-style** — helper thuần (`buildTree`, `budgetTone`); YAGNI (giữ `fetch`, không thêm dep mới — month-picker dùng `@mui/x-date-pickers` đã cài).

## Verification (tóm tắt lệnh)

```bash
cd conquer/budget-planner/frontend && npm run build      # phải xanh
npm run dev                                              # mở :5173 (hoặc 5174)
# backend: cd ../backend && uvicorn app.main:app --port 8000
```
Kịch bản thủ công: Categories (tạo gốc+con, sửa, xoá) · Budgets (tạo chọn danh mục+month, progress đổi màu khi vượt, sửa/xoá) · dark mode + đổi ngôn ngữ.
