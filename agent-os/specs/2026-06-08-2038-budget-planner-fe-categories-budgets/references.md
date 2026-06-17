# References for FE wiring Categories + Budgets

## Pattern FE để mô phỏng (PR #1 — đã merge)

### Trang Transactions (template chính)

- **Location:** `conquer/budget-planner/frontend/src/pages/Transactions.jsx`
- **Relevance:** Khuôn cho trang có API: fetch + loading skeleton + empty + `Alert` lỗi (map `ApiError`) + `Snackbar` thành công + nút mở dialog + refetch sau mutation.

### Form dialog

- **Location:** `src/components/TransactionFormDialog.jsx`, `src/components/BrandDialog.jsx`
- **Relevance:** Mẫu form trong `BrandDialog` (header/body/footer, `PaperProps={{component:"form", onSubmit}}`), `ToggleButtonGroup` cho type, `DatePicker` + dayjs, validate + helperText.

### API client + module

- **Location:** `src/api/client.js` (`apiFetch`, `ApiError`, header `X-Space-Id`), `src/api/transactions.js`
- **Relevance:** Mẫu module API (list/create...). PATCH dùng `method:"PATCH"`; DELETE 204 → `apiFetch` trả null.

### Khác

- `src/components/PageHeader.jsx` — tiêu đề + actions.
- `src/components/CategoryChip.jsx` — chip danh mục (màu theo tên, dark-mode aware).
- `src/utils/format.js` — `formatAmount`, `categoryColor` (sẽ thêm `budgetTone`).
- `src/i18n/locales/vi.json` · `en.json` — đã có `pages.categories*`, `pages.budgets*`, `common.*`; mở rộng thêm.

## Hợp đồng API (PR #2 — đã merge)

- **Location:** `conquer/budget-planner/backend/app/api/categories.py`, `budgets.py`, `app/schemas/category.py`, `budget.py`.
- **Categories:** `{id, space_id, name, type, parent_id|null}`.
- **Budgets:** `{id, space_id, period, limit_amount, category_id|null, spent_amount, remaining, percent}`.
- Router đã wire trong `app/main.py`; CORS cho `:5173`.
