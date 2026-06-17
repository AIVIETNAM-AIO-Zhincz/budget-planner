# Budget Planner — UI/UX batch 3 (review toàn app)

## Context

Người dùng (Tech Leader) review 12 trang, đưa danh sách cải thiện. Batch 3 xử lý **cả 3 nhóm đã chốt**:
(1) polish + sửa lỗi nhỏ, (2) empty-state đẹp dùng chung, (3) thêm dữ liệu/widget. Mục tiêu: app đỡ
"trống/mờ", dễ đọc, nhiều thông tin hơn. Chủ yếu FE + vài fix BE nhỏ. **Màu danh mục (ưu tiên #3 của
review) đã đồng bộ sẵn** (`categoryColor` ở Transactions/Dashboard/Reports) → không sửa.

**Quyết định đã chốt:** base trên **develop** nhưng dùng **git worktree riêng** (không đụng nhánh
`feature/budget-planner-forecast` người dùng đang code dở). Worktree: `../aio2026-practice-uiux3`,
nhánh `feature/budget-planner-uiux-3` từ `develop`. PR vào `develop`.

## Sự thật đã khảo sát

- **"Loading mờ"** = hiệu ứng **page-transition GSAP** ở `layout/AppLayout.jsx` (`gsap.from(opacity:0,y:10)` mỗi lần đổi route) — KHÔNG phải thiếu skeleton (mọi trang đã có Skeleton, trừ Settings không cần).
- **Settings contrast**: TextField outlined; `theme/index.js` override `MuiOutlinedInput.notchedOutline` border nhạt (dark `rgba(255,255,255,0.15)`), placeholder mặc định mờ.
- **Dashboard**: `StatCard` `height:100%` → thẻ KPI cao thừa; widget "Định kỳ sắp đến hạn" (`md={5}`) khi rỗng vẫn chiếm chỗ.
- **MonthlyPlanCard**: input `type="number"` → không format (20000000). Goals: dải chip fund (Khẩn/Dài/Chung) hiện cả khi =0.
- **TopBar** `titleKeyFromPath` map THIẾU `/annual` → tiêu đề fallback app name.
- **Goals "-1 tháng"**: `services/goal.py assess_goal` trả `months_needed` (verdict on_track) có thể âm ở biên → clamp ≥0 / xử lý "đã đạt".
- **Empty state**: hầu hết là `<Paper dashed>`+text thuần; `ComingSoon` có pattern icon+heading đẹp → rút ra component `EmptyState` dùng chung.
- **Bundle 3 dữ liệu**: Categories cần count+tổng/danh mục (BE aggregation); Recurring tổng/tháng (FE); Annual bảng số liệu tháng (FE, data sẵn). *Mini-stats từng ví (nặng) → để follow-up.*

---

## Task 1 — Worktree + spec docs

- `git worktree add ../aio2026-practice-uiux3 -b feature/budget-planner-uiux-3 develop`. Mọi việc làm trong worktree.
- Spec `agent-os/specs/2026-06-15-1106-budget-planner-uiux-3/`.

## Task 2 — Bundle 1: Polish + sửa lỗi (FE + 1 BE)

- **Page-transition dịu lại** (`AppLayout.jsx`): bỏ phần `opacity:0` (giữ `y` nhỏ ~6px, duration ~0.25) → hết cảm giác "mờ" khi đổi trang. (Giữ `useStaggerIn`.)
- **Settings contrast** (`theme/index.js`): tăng border outlined (light: dùng tông đậm hơn divider; dark: `rgba(255,255,255,0.28)`), placeholder `opacity ~0.7`. Toàn cục → mọi form rõ hơn.
- **Dashboard StatCard** (`StatCard.jsx`/`Dashboard.jsx`): `minHeight` hợp lý + giảm khoảng trống (gap/py) cho thẻ KPI; **ẩn widget "Định kỳ"** khi `!loading && upcoming.length===0` (ẩn cả Grid item).
- **MonthlyPlanCard** input số: thay `type=number` bằng input text format nghìn (hiển thị `20.000.000`, lưu số). Helper format/parse.
- **Goals chip quỹ=0** (`Goals.jsx`): chỉ render chip khi `fundTotals[ft] > 0`.
- **TopBar** (`TopBar.jsx`): thêm `"/annual": "nav.annual"` vào `titleKeyFromPath`.
- **Goals months_needed** (`services/goal.py`): clamp `months_needed = max(0, …)`; nếu đã đạt → verdict `done`. **+test** `test_goals.py`.

## Task 3 — Bundle 2: Empty state dùng chung

- `components/EmptyState.jsx`: icon (heroicons) + tiêu đề + mô tả + (tuỳ chọn) nút hành động — port từ `ComingSoon`. i18n.
- Áp cho trang ít dữ liệu thay text thuần: `Transactions` (empty/noResult), `Recurring`, `Wallets`, `Categories`, `Goals`, `Budgets`. i18n `*.emptyTitle/emptyHint` (tái dùng key sẵn nếu hợp).

## Task 4 — Bundle 3: Thêm dữ liệu/widget

- **Categories**: BE — `GET /categories` (hoặc `/categories/stats`) trả thêm `tx_count` + `tx_total` mỗi danh mục (aggregate Transaction theo `category_name`+space). FE `Categories.jsx` hiện "N giao dịch · tổng X ₫" mỗi dòng. +test BE.
- **Recurring** (`Recurring.jsx`): dải tóm tắt "Tổng định kỳ/tháng" (quy đổi theo tần suất: daily×30, weekly×4.33, monthly×1; chỉ tính `active`) — FE.
- **Annual** (`Annual.jsx`): bảng 12 tháng (Tháng · Thu · Chi · Số dư luỹ kế) dưới chart — FE, data có sẵn.
- *(Defer: mini-stats lịch sử giao dịch từng ví — note để batch sau.)*

## Task 5 — Verify + giao nộp

- BE: `pytest` (155 + mới) + `ruff check` + `ruff format --check`. FE: `npm test` (34) + `npm run build`. JSON i18n hợp lệ.
- **Live (alt ports để không đụng app người dùng đang chạy :5173/:8000)**: worktree vite :5174 + worktree uvicorn :8001 (DB copy) → kiểm page-transition hết mờ, Settings rõ, KPI gọn, empty-state đẹp, Categories có count/tổng, Recurring tổng/tháng, Annual có bảng, Goals chip≠0 + ETA đúng.
- Commit/push `feature/budget-planner-uiux-3` → PR vào `develop`; CI 5 check. Gỡ worktree sau khi merge.

---

## Cấu trúc file (trong worktree)

```
frontend/src/layout/AppLayout.jsx          (page-transition dịu)
frontend/src/theme/index.js                (contrast input toàn cục)
frontend/src/components/StatCard.jsx · pages/Dashboard.jsx   (KPI height + ẩn widget rỗng)
frontend/src/components/MonthlyPlanCard.jsx (format input số)
frontend/src/pages/Goals.jsx               (ẩn chip quỹ=0)
frontend/src/layout/TopBar.jsx             (title /annual)
frontend/src/components/EmptyState.jsx (mới) + các trang ít dữ liệu
frontend/src/pages/{Recurring,Annual,Categories}.jsx   (widget dữ liệu)
backend/app/services/goal.py (months_needed) · backend/app/api/categories.py + schema (tx_count/total)
backend/tests/{test_goals,test_categories}.py  · frontend i18n {vi,en}.json
```
Tái dùng: `categoryColor`, `formatAmount`, `ComingSoon` pattern, `Skeleton` (đã có), `_apply_filters`/aggregate (transactions). Không migration.

## Standards áp dụng

- **frontend/forms-ui** — empty-state dùng chung; contrast WCAG; format số; reduced-motion (page-transition vẫn guard).
- **api + testing (TDD)** — endpoint categories stats nhất quán; goal fix có test; giữ 155 pytest + 34 vitest.
- **ci** — `ruff format --check` trước push ([[ci-ruff-format-check]]); không co-author ([[no-coauthor-commits]]).

## Verification (lệnh)

```bash
git worktree add ../aio2026-practice-uiux3 -b feature/budget-planner-uiux-3 develop
cd ../aio2026-practice-uiux3/conquer/budget-planner/backend
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
cd ../frontend && npm install && npm test && npm run build
# live alt ports: backend :8001 + vite :5174 (VITE_API_URL=http://localhost:8001)
```
Kịch bản: đổi trang không "mờ" · input Settings rõ · KPI gọn + ẩn widget rỗng · empty-state có icon · Categories count/tổng · Recurring tổng/tháng · Annual bảng tháng · Goals chip≠0 + ETA ≥0. Test + build + format xanh.
