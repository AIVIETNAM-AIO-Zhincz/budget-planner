# Goals widget Dashboard — Shaping Notes

## Scope

Thêm widget "Mục tiêu tiết kiệm" vào Dashboard: liệt kê goals + thanh tiến độ, link sang /goals. Thuần FE, tái dùng API `/goals`.

## Decisions

- 1 widget full-width, tái dùng `SectionCard` + `LinearProgress` + i18n `goals.*`.
- Không backend/migration/test backend.

## Context

- **Visuals:** None.
- **References:** `src/pages/Dashboard.jsx` (Promise.allSettled + SectionCard + budget widget LinearProgress), `src/api/goals.js` (listGoals), i18n `goals.savedOf`/`goals.completed`/`dashboard.viewAll`.
- **Product alignment:** Roadmap — dashboard tổng quan.

## Standards Applied

- **frontend/forms-ui** — MUI sx; skeleton/empty; i18n; responsive Grid.
- **naming/coding-style** — tái dùng helper; YAGNI.
- **api** — chỉ đọc /goals; không backend.
