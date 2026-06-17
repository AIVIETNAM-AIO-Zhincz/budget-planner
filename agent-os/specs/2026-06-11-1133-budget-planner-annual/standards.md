# Standards for Tổng quan năm

---

## api/naming + testing (TDD)

- `GET /reports/annual?year=` (mặc định năm hiện tại). `build_annual_summary` tái dùng `build_summary` (DB-agnostic, không strftime trong SQL). Viết test BE trước (`test_reports.py`): 12 tháng, income/expense đúng, balance luỹ kế, tháng trống = 0. Giữ 152 pytest + 34 vitest xanh.

## frontend/forms-ui

- Trang mới lazy (`App.jsx`); chart `annualOption` (bar Thu/Chi + line luỹ kế, 2 trục, `formatCompactVnd`); year picker MUI; StatCard count/format; i18n vi/en; reduced-motion qua animation/ChartCard.

## ci

- Trước push chạy `ruff check .` **và** `ruff format --check .` ([[ci-ruff-format-check]]).
