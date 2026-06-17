# Budget Planner — Goals widget trên Dashboard

## Context

Dashboard đã có 4 thẻ tổng + pie/line + 4 widget (ngân sách, ví, giao dịch gần đây, định kỳ sắp tới). Mục tiêu tiết kiệm (Goals, PR #16) chưa hiện ở trang chủ. Spec này thêm **widget "Mục tiêu tiết kiệm"** vào Dashboard: liệt kê mục tiêu kèm thanh tiến độ, link sang trang Mục tiêu. **Thuần FE**, không backend (API `GET /goals` đã trả `saved_amount`/`target_amount`/`percent`/`wallet_name`).

**Quyết định đã chốt:**
- Thêm 1 widget Goals (full-width) vào Dashboard; tái dùng `SectionCard` + `LinearProgress` + i18n `goals.*` sẵn có.
- Không backend/migration/test backend. Nhánh `feature/budget-planner-dashboard-goals` từ `develop`.

## Hợp đồng hiện có

- `src/pages/Dashboard.jsx` — nạp song song `Promise.allSettled([listTransactions, listWallets, listBudgets, listRecurring, listCategories])` (destructure `[tx, wl, bg, rc, ct]`); helper `SectionCard({title, action, children})`; widget ngân sách dùng `LinearProgress` + `percent`.
- `src/api/goals.js` — `listGoals()` → `[{id,name,target_amount,saved_amount,percent,wallet_name,deadline}]`.
- i18n có sẵn: `goals.savedOf` (`{{saved}}/{{target}}`), `goals.completed`, `dashboard.viewAll`. `utils/format.formatAmount`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-1300-budget-planner-dashboard-goals/`.

## Task 2 — Dashboard: thêm widget Goals + i18n

- `src/pages/Dashboard.jsx`:
  - Import `listGoals`; thêm vào `Promise.allSettled` (thành `[tx, wl, bg, rc, ct, gl]`); `setGoals` từ `gl.value` (skeleton/empty riêng, lỗi không chặn).
  - Thêm `SectionCard` **"Mục tiêu tiết kiệm"** (`Grid item xs=12`) với `action` = nút "Xem tất cả" → `/goals`: liệt kê tối đa ~5 mục tiêu, mỗi dòng: tên · `LinearProgress`(min(percent,100), màu success nếu ≥100) · `goals.savedOf {saved,target}` + `Math.round(percent)%` · badge `goals.completed` nếu ≥100. Rỗng → `dashboard.noGoals`; loading → skeleton.
- `src/i18n/locales/{vi,en}.json` (`dashboard.*` bổ sung): `goals` (tiêu đề "Mục tiêu tiết kiệm"/"Saving goals"), `noGoals` ("Chưa có mục tiêu nào."/"No goals yet.").

## Task 3 — Verify

- FE: `npm run build` xanh; JSON i18n hợp lệ; lint không lỗi import.
- Live (dev :5173 + backend :8000 đang chạy): tạo nhanh 1 ví + 1 goal (qua trang Mục tiêu hoặc API), mở **Dashboard** → widget Goals hiện mục tiêu + thanh tiến độ; góp tiền → tiến độ cập nhật khi reload.

---

## Cấu trúc file

```
frontend/src/pages/Dashboard.jsx            (sửa — nạp listGoals + widget Goals)
frontend/src/i18n/locales/vi.json · en.json (sửa — dashboard.goals/noGoals)
```
Tái dùng: `SectionCard` (nội bộ Dashboard), `LinearProgress`, `formatAmount`, `goals.savedOf`/`goals.completed`/`dashboard.viewAll`, `react-router Link`.

## Standards áp dụng

- **frontend/forms-ui** — MUI sx; skeleton/empty cho widget; i18n đầy đủ; responsive Grid.
- **naming/coding-style** — tái dùng helper sẵn có; không thêm dependency (YAGNI).
- **api** — chỉ đọc `/goals`; không backend ⇒ không migration/test backend.

## Verification (lệnh)

```bash
cd conquer/budget-planner/frontend && npm run build
# live: dev :5173 — Dashboard hiển thị widget Mục tiêu tiết kiệm
```
Kịch bản: mở Dashboard → thấy widget Goals (tiến độ); rỗng → thông báo "chưa có mục tiêu".
