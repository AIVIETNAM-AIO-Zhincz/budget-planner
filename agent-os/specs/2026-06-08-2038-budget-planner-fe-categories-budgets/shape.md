# FE wiring Categories + Budgets — Shaping Notes

## Scope

Nối 2 trang FE **Categories** và **Budgets** (đang là `ComingSoon` placeholder) vào API backend đã merge (PR #2). FE-only, tái dùng pattern trang Transactions (PR #1).

## Decisions

- **Categories:** hiển thị **cây cha–con** (gốc + con thụt vào); form chọn "danh mục cha".
- **Budgets:** **thẻ + progress bar** đổi màu theo % (success <80 / warning <100 / error ≥100); hiện đã chi / hạn mức / còn lại.
- **Form input:** dropdown đổ từ `GET /categories` (Budget chọn danh mục, Category chọn cha); **period** dùng month-picker (`DatePicker` views year+month) → `YYYY-MM`.
- Xoá có **ConfirmDialog**. Giữ field API dạng `snake_case`.
- Không thêm dependency mới (month-picker dùng `@mui/x-date-pickers` đã cài).

## Context

- **Visuals:** 2 ASCII mockup do người dùng chọn (xem `visuals/mockups.md`).
- **References:** trang/Component Transactions (PR #1): `pages/Transactions.jsx`, `components/TransactionFormDialog.jsx`, `BrandDialog.jsx`, `PageHeader.jsx`, `CategoryChip.jsx`, `api/client.js`, `api/transactions.js`, `utils/format.js`, `i18n/locales/*`. API backend (PR #2): `app/api/categories.py`, `app/api/budgets.py`, `app/schemas/*`.
- **Product alignment:** Roadmap Phase 0 — "Danh mục + ngân sách theo danh mục/tháng + theo dõi tiến độ". Mở khoá 2 trang placeholder.

## Standards Applied

- **naming** — component `PascalCase.jsx`, biến/hàm `camelCase`; giữ field API `snake_case`.
- **api/fastapi (phía FE)** — map HTTP code lỗi (422/404); body khớp schema (`period` `YYYY-MM`, `limit_amount>0`).
- **coding-style** — helper thuần (`buildTree`, `budgetTone`); YAGNI.
