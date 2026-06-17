# Cải thiện UI/UX (batch 1) — Shaping Notes

## Scope

Xử lý góp ý UI/UX: pie trống (Dashboard+Báo cáo), số tiền xuống dòng, line Thu/Chi mất cân bằng, Giao dịch thiếu tổng + tháng mặc định, Trợ lý thiếu quick prompts + input mờ, badge ngôn ngữ giống notification. Thuần FE.

## Decisions

- 1 PR cho cả 4 batch. Không phá 30 vitest; thêm test cho `formatCompactVnd`.
- Pie trống: chỉ pie hỏng (line/bar render) → bug ở pieOption/renderer → chẩn đoán + sửa (ứng viên `renderer:"svg"`).
- Sidebar active/tooltip + badge chuông: code đã đúng → verify live, chỉnh nếu lệch.

## Context

- **Visuals:** Góp ý chữ của người dùng (không mockup).
- **References:** `utils/charts.js` (pie/line/barOption + summarize), `utils/format.js`, `components/StatCard.jsx`, `pages/{Dashboard,Reports,Transactions,Assistant}.jsx`, `layout/{TopBar,Sidebar}.jsx`.
- **Product alignment:** Trải nghiệm người dùng.

## Standards Applied

- **frontend/forms-ui** — MUI sx; empty/loading; responsive; i18n.
- **testing** — test `formatCompactVnd`; giữ 30 vitest xanh.
- **naming/coding-style** — không thêm dependency; chỉ FE.
