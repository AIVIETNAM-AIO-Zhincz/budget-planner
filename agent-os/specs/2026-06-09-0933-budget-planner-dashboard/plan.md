# Budget Planner — Dashboard nâng cao

## Context

Trang chủ hiện chỉ có 4 thẻ tổng + pie (theo danh mục) + line (theo ngày), tính client-side từ `listTransactions`. Spec này làm Dashboard giàu thông tin hơn bằng **4 widget tái dùng API có sẵn**: tổng quan ngân sách (tháng này), số dư các ví, giao dịch gần đây, định kỳ sắp đến hạn. **Thuần frontend** — không thêm backend/model/migration/test (các endpoint đã trả đủ field).

**Quyết định đã chốt:**
- Thêm 4 widget: **Tổng quan ngân sách · Số dư các ví · Giao dịch gần đây · Định kỳ sắp đến hạn**.
- Giữ nguyên thẻ tổng + pie + line hiện có (tính từ transactions). Không đổi backend.
- Nhánh `feature/budget-planner-dashboard` từ `develop`.

## Hợp đồng hiện có (đều đã đủ field — KHÔNG sửa backend)

- `GET /budgets` → `BudgetRead` kèm `spent_amount`, `remaining`, `percent`, `period` (YYYY-MM). FE lọc `period === tháng hiện tại`.
- `GET /wallets` → `{id,name,type,balance}`.
- `GET /transactions` → đã sort `date desc` → lấy 5 đầu.
- `GET /recurring` → `{name,amount,type,frequency,next_run,active}` → lọc `active && next_run <= today+7`.
- FE: `pages/Dashboard.jsx` (thẻ tổng + pie/line), `components/StatCard.jsx`, `utils/charts.js` (`pieOption`/`lineOption`/`summarize`/`expenseByCategory`/`flowByDate`), `utils/motion.js` (`echartsAnimationDefaults`), `utils/format.js` (`formatAmount`/`categoryColor`), `api/{transactions,wallets,budgets,recurring}.js`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-0933-budget-planner-dashboard/`.

## Task 2 — Dashboard: nạp dữ liệu + 4 widget

`src/pages/Dashboard.jsx` (mở rộng):
- Nạp song song: `listTransactions` (đã có — thẻ tổng/charts/recent), `listWallets`, `listBudgets`, `listRecurring` (Promise.all, lỗi từng phần không chặn cả trang — mỗi widget tự skeleton/empty).
- Giữ: 4 thẻ tổng + pie + line.
- **Widget Tổng quan ngân sách**: lọc budgets `period === dayjs().format("YYYY-MM")`; mỗi budget: tên danh mục + thanh `LinearProgress` (`percent`, đỏ nếu `remaining<0`) + `spentOf`/`remaining`. Rỗng → empty.
- **Widget Số dư các ví**: danh sách ví (tên + loại chip + `balance` mono) + dòng tổng. Rỗng → empty.
- **Widget Giao dịch gần đây**: 5 giao dịch đầu (ngày · ghi chú · danh mục chip · số tiền ±màu). Link "Xem tất cả" → `/transactions`.
- **Widget Định kỳ sắp đến hạn**: rule `active && next_run <= today+7`, sort `next_run`; hiện tên · tần suất · ngày kế · số tiền. Rỗng → "không có khoản nào sắp tới". Link → `/recurring`.
- Bố cục `Grid`: thẻ tổng (4 cột) → pie+line → (ngân sách | ví) → (giao dịch gần đây | định kỳ). Tái dùng `formatAmount`/`categoryColor`/`StatCard`; widget bọc trong card `Paper` (helper `SectionCard` nội bộ).

## Task 3 — i18n

`vi.json`/`en.json` bổ sung `dashboard.*`: `budgetOverview`, `walletBalances`, `recentTransactions`, `upcomingRecurring`, `viewAll`, `noBudgetsThisMonth`, `noWallets`, `noRecentTx`, `noUpcoming`, `walletTotal`. Tái dùng `transactions.income/expense`, `budgets.spentOf/remaining`, `recurring.frequencies.*`, `wallets.types.*`. Mọi chữ `t()`.

## Task 4 — Verify

- FE: `npm run build` xanh; lint không lỗi import.
- Live (dev :5173, backend đã chạy): Dashboard hiển thị 4 widget với dữ liệu demo (ngân sách Giải trí vượt → thanh đỏ; ví Tiền mặt/Vietcombank + tổng; 5 GD gần đây; định kỳ nếu có). Tạo 1 rule `next_run` trong 3 ngày → hiện ở widget định kỳ.

---

## Cấu trúc file

```
frontend/src/pages/Dashboard.jsx            (mở rộng — 4 widget + nạp wallets/budgets/recurring)
frontend/src/i18n/locales/vi.json · en.json (sửa — dashboard.*)
```
(Tuỳ chọn tách `components/dashboard/*` nếu Dashboard quá dài — mặc định giữ helper nội bộ trong page.)
Tái dùng: `StatCard`, `pieOption`/`lineOption`, `echartsAnimationDefaults`, `formatAmount`/`categoryColor`, `api/{transactions,wallets,budgets,recurring}`, MUI `LinearProgress`/`Grid`/`Chip`, `react-router Link`.

## Standards áp dụng

- **frontend/forms-ui** — MUI theme/sx (không Tailwind); skeleton/empty/error mỗi widget; i18n đầy đủ; responsive Grid.
- **naming/coding-style** — component PascalCase; tách helper render gọn; không thêm dependency (YAGNI).
- **api** — chỉ đọc, tái dùng endpoint hiện có; không đổi backend ⇒ không migration/test backend.

## Verification (lệnh)

```bash
cd conquer/budget-planner/frontend && npm run build
# live: dev :5173 + backend :8000 đang chạy — xem Dashboard 4 widget
```
Kịch bản: mở Dashboard → thẻ tổng + charts + ngân sách (thanh tiến độ) + ví (tổng) + 5 GD gần đây + định kỳ sắp tới.
