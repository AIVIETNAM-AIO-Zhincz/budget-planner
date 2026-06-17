# Budget Planner — Dự kiến vs Thực tế (Phase 2, feature #2)

## Context

Lấy cảm hứng từ template Excel "Monthly Budget" (Thu nhập: *Dự kiến* vs *Thực tế*; Chi: *Ngân sách* vs
*Thực tế* + ✅đạt/❌chưa). App đã có **kế hoạch CHI per-category (Budget)** + **actual thu/chi (report)**,
nhưng **thiếu kế hoạch THU** và **bảng so sánh tổng tháng**. Feature này thêm **Kế hoạch tháng**
(planned thu/chi) đối chiếu actual → người dùng biết tháng này có đạt mục tiêu thu/chi/tiết kiệm không.
Feature #2 trong 4 feature Phase 2 (mỗi cái 1 PR).

**Quyết định đã chốt:** Kế hoạch **tổng tháng** (planned_income + planned_expense per period), độc lập
với Budget per-category (Budget vẫn là chi tiết theo danh mục). Nhánh `feature/budget-planner-monthly-plan`
từ `develop`. **Migration #6** (entity mới, down_revision = `2e8056959549`). Đặt UI ở **trang Ngân sách**.

## Sự thật đã khảo sát

- **Budget** (`models` dòng 104-111): `period` "YYYY-MM" + `limit_amount` + `category_id`; service `budget.py` có `_period_range(period)` (đầu→đầu tháng sau) + `spent_for_period`. → tái dùng `_period_range`.
- **Actual thu/chi**: `services/report.py build_summary(db, space, start, end)` trả `total_income`/`total_expense`. → tái dùng cho actual của 1 tháng.
- **Thiếu**: planned_income / monthly plan entity (grep không có).
- **FE Budgets** (`Budgets.jsx`): grid thẻ budget, KHÔNG có chọn tháng/dayjs; `api/budgets.js`. **Dashboard** "Tổng quan ngân sách" lọc `budgets.period === thisMonth`.
- **Alembic head** `2e8056959549`. **RBAC** member+ để sửa (như budgets). **Test** `test_budgets.py` pattern (owner fixture, period, assert spent).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-11-1020-budget-planner-monthly-plan/`.

## Task 2 — BE: model MonthlyPlan + migration (TDD)

- **Model** `MonthlyPlan(id, space_id FK, period String(7), planned_income Float=0, planned_expense Float=0)`; index space_id. (1 plan / space / period — đảm bảo ở tầng API: upsert theo (space, period).)
- **Migration #6** `add_monthly_plans` (down_revision `2e8056959549`): create_table + index; downgrade drop. Áp DB + no-op. Ruff-clean theo style migration cũ.

## Task 3 — BE: schema + API + service (TDD)

- **Schema** `schemas/plan.py`: `MonthlyPlanUpdate{planned_income, planned_expense}` (Field ≥0); `MonthlyPlanRead{period, planned_income, planned_expense, actual_income, actual_expense}` (FE tự tính diff/status).
- **Service**: hàm tính actual cho period = `build_summary(db, space, *_period_range(period))` → lấy total_income/total_expense.
- **Router** `api/plans.py` (prefix `/monthly-plan`):
  - `GET /monthly-plan/{period}` (pattern `\d{4}-\d{2}`): trả plan đã lưu (hoặc 0) + actual_income/expense.
  - `PUT /monthly-plan/{period}` (require_min_role "member"): upsert planned_income/expense → trả MonthlyPlanRead (kèm actual). Ghi audit (`write_audit`).
- Đăng ký router ở `main.py`.
- **Test** `test_plans.py`: PUT đặt kế hoạch → GET trả planned + actual (tạo vài giao dịch thu/chi trong tháng) đúng; cô lập theo space; viewer PUT → 403.

## Task 4 — FE: api + card "Kế hoạch tháng" (Budgets page)

- `api/plans.js`: `getMonthlyPlan(period)`, `saveMonthlyPlan(period, {planned_income, planned_expense})`.
- `Budgets.jsx`: thêm **card "Kế hoạch tháng"** trên đầu: chọn tháng (DatePicker dayjs, mặc định tháng này) → nạp plan; 2 ô nhập planned thu/chi (lưu khi blur/nút Lưu); hiển thị **planned vs actual** (thanh + số) cho Thu, Chi, và **Tiết kiệm** (net = thu−chi); badge ✅/❌:
  - Thu: actual ≥ planned → ✅ đạt; else ❌ chưa.
  - Chi: actual ≤ planned → ✅ trong kế hoạch; else ❌ vượt.

## Task 5 — FE: i18n + tinh chỉnh

- i18n vi/en: `plan.*` (title, month, plannedIncome, plannedExpense, actual, saving, met, notMet, over, save, saved...).
- (Tuỳ chọn nhẹ) Dashboard: 1 dòng tóm tắt "tiết kiệm tháng này vs kế hoạch" nếu gọn — không bắt buộc.

## Task 6 — Verify + giao nộp

- `pytest` (147 + mới) xanh; `ruff` sạch; **alembic upgrade head áp migration #6** + no-op. `npm test` + `npm run build` xanh.
- **Live** (BE :8000 + FE :5173): đặt kế hoạch thu/chi tháng → card hiện planned vs actual + ✅/❌; cô lập theo tháng.
- Commit/push/PR vào `develop`; CI 5 check (gồm alembic).

---

## Cấu trúc file

```
backend/app/models/__init__.py             (sửa — model MonthlyPlan)
backend/app/schemas/plan.py                (mới — MonthlyPlanUpdate/Read)
backend/app/api/plans.py                   (mới — GET/PUT /monthly-plan/{period})
backend/app/main.py                        (sửa — include plans.router)
backend/app/services/report.py             (tái dùng build_summary; có thể thêm helper actual_for_period)
backend/alembic/versions/<rev>_add_monthly_plans.py  (mới — migration #6)
backend/tests/test_plans.py                (mới — test)
frontend/src/api/plans.js                  (mới)
frontend/src/pages/Budgets.jsx             (sửa — card Kế hoạch tháng + DatePicker)
frontend/src/i18n/locales/{vi,en}.json     (sửa — plan.*)
```
Tái dùng: `_period_range` (budget service), `build_summary` (report), `require_min_role`, `write_audit`/`get_owned_or_404`, MUI DatePicker/LinearProgress (đã dùng ở Transactions/Budgets), `formatAmount`.

## Standards áp dụng

- **database/migrations** — migration #6 upgrade/downgrade; áp + no-op verify; CI alembic.
- **api/error-handling + rbac + testing (TDD)** — PUT cần member+; cô lập space; test BE trước; giữ 147 pytest + 34 vitest xanh.
- **frontend/forms-ui** — DatePicker tháng; planned vs actual rõ ràng; i18n đầy đủ.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
BP_DATABASE_URL="sqlite:///./budget_planner.db" .venv/bin/alembic upgrade head   # migration #6
.venv/bin/python -m pytest -q && .venv/bin/ruff check .
cd ../frontend && npm test && npm run build
# live :5173 — Ngân sách: card Kế hoạch tháng (planned vs actual + ✅/❌)
```
Kịch bản: đặt kế hoạch thu/chi tháng · card hiện planned vs actual Thu/Chi/Tiết kiệm + ✅đạt/❌chưa · đổi tháng nạp đúng. Migration áp + no-op. Test BE+FE + build xanh.
