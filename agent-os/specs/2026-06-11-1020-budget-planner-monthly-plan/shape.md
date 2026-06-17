# Dự kiến vs Thực tế (Kế hoạch tháng) — Shaping Notes

## Scope

Thêm Kế hoạch tháng (planned_income + planned_expense per period) đối chiếu actual thu/chi → ✅đạt/❌chưa. Phase 2 feature #2. Budget per-category vẫn là chi tiết chi.

## Decisions

- Kế hoạch tổng tháng (entity `MonthlyPlan`), độc lập Budget. Migration #6 (down_revision `2e8056959549`).
- Actual lấy lại từ giao dịch (tái dùng `report.build_summary` + `budget._period_range`).
- API `/monthly-plan/{period}` GET (plan+actual) + PUT upsert (member+). UI card ở trang Ngân sách.
- 1 PR (`feature/budget-planner-monthly-plan`). FE tự tính diff/status (đạt/chưa).

## Context

- **Visuals:** template Excel (Thu/Chi: Dự kiến vs Thực tế).
- **References:** `models` Budget, `services/{budget,report}.py`, `api/budgets.py`, `Budgets.jsx`, `api/budgets.js`.
- **Product alignment:** Phase 2 — lập kế hoạch & đối chiếu.

## Standards Applied

- **database/migrations** — migration #6 upgrade/downgrade; áp + no-op.
- **api/rbac + testing (TDD)** — PUT member+; cô lập space; test BE trước; giữ 147 pytest + 34 vitest.
- **frontend/forms-ui** — DatePicker tháng; planned vs actual + badge; i18n.
