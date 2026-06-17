# Tổng quan năm — Shaping Notes

## Scope

Trang mới `/annual`: biểu đồ 12 tháng (cột Thu/Chi + đường số dư luỹ kế) + thẻ tổng cả năm. Phase 2 feature #3. Không migration.

## Decisions

- Trang mới `/annual` (nhóm nav Tổng quan). Backend tái dùng `build_summary` → gom `by_day` theo tháng (DB-agnostic, không strftime).
- Endpoint `GET /reports/annual?year=`. 1 PR (`feature/budget-planner-annual`).

## Context

- **Visuals:** template Excel (Annual Summary).
- **References:** `services/report.py build_summary`, `api/reports.py`, `schemas/report.py`, `pages/Reports.jsx`, `utils/charts.js`, `App.jsx`, `constants/nav.js`.
- **Product alignment:** Phase 2 — bức tranh tài chính cả năm.

## Standards Applied

- **api/naming + testing (TDD)** — test BE trước; giữ 152 pytest + 34 vitest.
- **frontend/forms-ui** — page lazy; chart 12 tháng; year picker; i18n.
- **ci** — chạy `ruff format --check` trước push ([[ci-ruff-format-check]]).
