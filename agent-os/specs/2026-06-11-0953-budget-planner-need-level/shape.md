# Phân loại Nhu cầu/Mong muốn/Lãng phí — Shaping Notes

## Scope

Thêm `need_level` (mandatory/optional/wasteful) cho danh mục chi + báo cáo % chi theo nhóm (Báo cáo). Phase 2 feature #1. Lấy cảm hứng template Excel "Monthly Budget".

## Decisions

- `need_level ∈ {mandatory, optional, wasteful}`, mặc định `optional`, gắn ở Category.
- Transaction → need_level qua `category_name` + space (LEFT JOIN, coalesce 'optional').
- Migration #5 (down_revision `380e5fac27d4`), server_default cho dữ liệu cũ.
- Giá trị nội bộ tiếng Anh; hiển thị tiếng Việt qua i18n. Field optional/default → không phá test cũ.
- 1 PR (`feature/budget-planner-need-level`). 3 feature Phase 2 còn lại làm sau.

## Context

- **Visuals:** template Excel (file người dùng), không mockup.
- **References:** `models/__init__.py` Category, `schemas/{category,report}.py`, `api/categories.py`, `services/report.py`, `CategoryFormDialog.jsx`, `Categories.jsx`, `Reports.jsx`, `utils/charts.js pieOption`.
- **Product alignment:** Phân tích chi tiêu sâu hơn (50/30/20).

## Standards Applied

- **database/migrations** — migration #5 upgrade/downgrade + server_default; áp + no-op.
- **api/naming + testing (TDD)** — field default; test BE trước; giữ 143 pytest + 34 vitest.
- **frontend/forms-ui** — select i18n; donut màu nhóm.
