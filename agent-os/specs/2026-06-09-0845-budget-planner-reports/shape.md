# Reports nâng cao + xuất CSV — Shaping Notes

## Scope

Nâng cấp Reports: endpoint tổng hợp backend theo khoảng thời gian + xuất CSV; FE lọc from/to, thẻ tổng thu/chi/số dư, top danh mục chi, pie + line theo khoảng. Full-stack.

## Decisions

- Tổng hợp **backend** (`GET /reports/summary?from=&to=`); xuất **CSV backend** (`GET /reports/export.csv`).
- Reports: lọc khoảng thời gian · thẻ tổng · top danh mục chi · pie + line.
- RBAC đọc/xuất = viewer+. Không cần migration. TDD backend.

## Context

- **Visuals:** None.
- **References:** `app/api/transactions.py` (lọc/space), `app/services/budget.py` (range), `app/rbac`. FE: `pages/Reports.jsx`, `utils/charts.js`, `components/StatCard.jsx`, `utils/format.js`, `api/client.js` helpers.
- **Product alignment:** Roadmap Phase 0/4 — báo cáo, biểu đồ, xuất PDF/CSV.

## Standards Applied

- **api/fastapi** — lọc space_id; query param; viewer+; HTTP code chuẩn.
- **testing/tdd** — test trước summary/CSV; happy + range + cô lập/401.
- **naming/coding-style** — field snake_case; YAGNI. **database/migrations** — không revision mới.
