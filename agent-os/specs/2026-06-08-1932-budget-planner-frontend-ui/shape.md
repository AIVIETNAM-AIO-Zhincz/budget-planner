# Budget Planner — Frontend UI Shell — Shaping Notes

## Scope

Dựng lại frontend của `conquer/budget-planner` theo **design system của InTraAI-WebTracking** (MUI v5 + theme token). Bao gồm:
- App shell đầy đủ: Sidebar (collapsible) + TopBar, router, dark/light mode, i18n vi/en.
- Scaffold **mọi trang** roadmap (Dashboard, Transactions, Categories, Budgets, Reports, Members, Settings, NotFound).
- **Chỉ Transactions + Dashboard nối API thật**; các trang còn lại là placeholder (backend Phase 0 chưa có endpoint).

## Decisions

- **Stack UI:** MUI v5 + Emotion + `sx`/theme (KHÔNG Tailwind) — copy token & pattern từ InTraAI để đồng bộ look-and-feel.
- **Phạm vi:** app shell đầy đủ + scaffold mọi trang; chỉ Transactions nối API thật, Dashboard tính từ list transactions.
- **Theme/i18n:** có dark/light mode (toggle, lưu localStorage) + i18next vi/en (mặc định vi).
- **HTTP:** giữ `fetch` (không thêm axios) — YAGNI.
- **Auth:** chưa có ở backend → space đi qua header `X-Space-Id=demo-space` (hardcode), thay sau khi có slice RBAC.

## Context

- **Visuals:** Không có mockup. Bám design system InTraAI làm chuẩn thị giác.
- **References:**
  - Design system gốc: `conquer/sample/InTraAI-WebTracking/frontend/` (theme, StatCard, BrandDialog, motion, badgeColors).
  - FE hiện tại: `conquer/budget-planner/frontend/src/App.jsx` + `api.js` (sẽ thay).
  - Backend API: `conquer/budget-planner/backend/app/` (routers, schemas, models).
- **Product alignment:** Khớp roadmap Phase 0 (mission.md/roadmap.md) — lõi Transactions + báo cáo cơ bản + AI phân loại. Các Phase sau (RBAC, AI nâng cao, dự báo) phản ánh bằng các trang placeholder để mở rộng dần.

## Standards Applied

- **naming** — component `PascalCase.jsx`; biến/hàm `camelCase` (JS); giữ field API `snake_case` khớp backend.
- **api/fastapi** — FE map đúng HTTP code lỗi (422 validation, 4xx); field khớp Pydantic schema; mọi truy vấn gắn `space_id` qua header.
- **coding-style** — YAGNI (chỉ thêm dep thực dùng), ưu tiên hàm thuần cho helper.
