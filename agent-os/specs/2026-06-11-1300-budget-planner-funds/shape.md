# Quỹ (khẩn cấp/dài hạn) — Shaping Notes

## Scope

Thêm `fund_type` (emergency/long_term/general) cho Goal + hiển thị chip + dải tổng quỹ theo loại. Phase 2 feature #4 (cuối). Pattern y hệt need_level (PR #29).

## Decisions

- `fund_type ∈ {emergency, long_term, general}`, mặc định `general`, ở Goal. Migration #7 (down_revision `235fc17ed2c7`).
- Giá trị nội bộ tiếng Anh; i18n tiếng Việt. Field optional/default → không phá test cũ. 1 PR.

## Context

- **Visuals:** template Excel (Quỹ khẩn cấp/dài hạn).
- **References:** `models` Goal, `schemas/goal.py`, `api/goals.py` (_to_read, create), `GoalFormDialog.jsx`, `Goals.jsx`. Pattern `need_level` (PR #29).
- **Product alignment:** Phase 2 — phân loại quỹ tiết kiệm.

## Standards Applied

- **database/migrations** — migration #7 upgrade/downgrade + server_default.
- **api/naming + testing (TDD)** — field default; test BE trước; giữ 153 pytest + 34 vitest.
- **frontend/forms-ui** — select i18n; chip màu; dải tổng.
- **ci** — `ruff format --check` trước push ([[ci-ruff-format-check]]).
