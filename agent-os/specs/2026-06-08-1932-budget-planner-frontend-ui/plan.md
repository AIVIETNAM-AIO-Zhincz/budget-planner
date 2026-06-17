# Budget Planner — Frontend UI Shell (theo design system InTraAI)

## Context

FE của `conquer/budget-planner` hiện tối giản: 1 file `App.jsx` dùng inline-style, chỉ có form + bảng Transactions, không router, deps chỉ React. Ta muốn dựng lại FE theo **design system của `conquer/sample/InTraAI-WebTracking`** (MUI v5 + theme token, sidebar/topbar, dark mode, i18n) để có nền giao diện chuyên nghiệp, đồng bộ, mở rộng được cho cả roadmap sản phẩm.

**Quyết định đã chốt:**
- **Stack UI:** MUI v5 + Emotion + `sx`/theme (KHÔNG Tailwind) — copy token & pattern từ InTraAI.
- **Phạm vi:** dựng **app shell đầy đủ + scaffold mọi trang** roadmap (placeholder), **chỉ Transactions nối API thật**.
- **Theme/i18n:** có **dark/light mode** (toggle) + **i18next vi/en**.

**Ràng buộc backend (Phase 0):** chỉ có `GET/POST /transactions`, `GET /audit-logs`, `GET /health`. **Chưa có auth** — space đi qua header `X-Space-Id` (hiện hardcode `demo-space`). CORS đã cho phép `http://localhost:5173`. → Các trang ngoài Transactions để **placeholder** đến khi backend có endpoint.

## Design tokens lấy từ InTraAI (đích bám theo)

- **Màu:** primary `#6366f1`, success `#10b981`, warning `#f59e0b`, error `#ef4444`, info `#2563eb`.
- **Light:** bg `#f8fafc`, paper `#fff`, subtle `#F4F6FA`, text `#0f172a`/`#475569`, divider `#e2e8f0`.
- **Dark:** bg `#0e1016`, paper `#171a22`, subtle `#21242f`, text `#fff`/`#c9d1d9`, divider `#2a2f3a`.
- **Font:** Public Sans (UI) + JetBrains Mono (số, `tabular-nums`).
- **Bo góc:** button 8px, card 12–16px, dialog 12px, pill 999. **Hover-lift** nhẹ (`translateY(-1px)` / `scale(1.005)`), tôn trọng `prefers-reduced-motion`.
- Layout: **Drawer trái (collapsible, lưu localStorage) + AppBar trên (minHeight 70, elevation 0, border-bottom divider)**.

Tham khảo trực tiếp khi code: `conquer/sample/InTraAI-WebTracking/frontend/src/App.jsx` (khối `createTheme`, dòng ~151–384), `components/StatCard.jsx`, `BrandDialog.jsx`, `utils/motion.js`, `utils/badgeColors.js`, `constants/taskTypes.js`.

---

## Task 1 — Lưu tài liệu spec (làm trước tiên)

Tạo `agent-os/specs/2026-06-08-1932-budget-planner-frontend-ui/` gồm:
- `plan.md` — bản plan này.
- `shape.md` — scope, 3 quyết định đã chốt, context (visuals: không; reference: InTraAI; product: align Phase 0).
- `standards.md` — trích `agent-os/standards/naming.md`, `coding-style.md`, `api/fastapi.md` (HTTP code 400/401/403/422, response là Pydantic schema, RBAC server-side, lọc theo `space_id`).
- `references.md` — trỏ tới InTraAI (đường dẫn file design ở trên) + FE/BE budget-planner hiện tại.
- `visuals/` — rỗng (chưa có mockup).

## Task 2 — Thêm dependencies & nền theme

Trong `conquer/budget-planner/frontend/`:
- Thêm deps: `@mui/material @mui/icons-material @emotion/react @emotion/styled @mui/x-date-pickers @heroicons/react react-router-dom echarts echarts-for-react i18next react-i18next dayjs @fontsource/public-sans @fontsource/jetbrains-mono`. (HTTP giữ `fetch` như hiện tại, không cần axios.)
- `src/theme/index.js` — `buildTheme(mode)` tái dựng token InTraAI ở trên (palette, typography scale, `components` override cho Button/Card/TableCell/Dialog, `customShadows`, `motion.reducedMotion`).
- `src/theme/ColorModeContext.jsx` — context + hook `useColorMode()`, lưu mode vào `localStorage` (`bp-color-mode`), default theo `prefers-color-scheme`.
- `src/utils/motion.js` — port `cardHover`, `hoverLift`, `pillTransition` (rút gọn từ InTraAI).

## Task 3 — App shell (layout + router + i18n)

- `src/main.jsx` — bọc `<BrowserRouter>` + `<ColorModeProvider>` + `<ThemeProvider>` + `<CssBaseline>`; import fontsource; init i18n.
- `src/i18n/index.js` + `src/i18n/locales/vi.json`, `en.json` — khởi tạo react-i18next, ngôn ngữ mặc định `vi`, lưu lựa chọn vào localStorage.
- `src/layout/AppLayout.jsx` — khung Drawer + AppBar + `<Outlet/>` cho nội dung.
- `src/layout/Sidebar.jsx` — drawer trái, nav nhóm, icon Heroicons, item active nền `rgba(99,102,241,0.12)` + chữ primary; collapsible lưu localStorage; ẩn ở mobile (drawer tạm).
- `src/layout/TopBar.jsx` — tiêu đề/breadcrumb trang, nút collapse sidebar, **toggle sáng/tối**, **đổi ngôn ngữ vi/en**, chuông thông báo (tĩnh), badge "Space: demo-space".
- `src/constants/nav.js` — danh sách route + nhãn i18n + icon.
- `src/App.jsx` — định nghĩa `<Routes>`: `/` → Dashboard, `/transactions`, `/categories`, `/budgets`, `/reports`, `/members`, `/settings`, `*` → NotFound.
- `src/components/PageHeader.jsx` — tiêu đề trang + mô tả + slot actions (tái dùng mọi trang).

## Task 4 — Trang Transactions (nối API thật)

- `src/api/client.js` — wrapper `fetch` quanh `VITE_API_URL || http://localhost:8000`, tự gắn header `Content-Type` + `X-Space-Id` (`demo-space`), parse lỗi theo HTTP code (422/4xx) → ném `ApiError{status,message}`.
- `src/api/transactions.js` — `listTransactions()`, `createTransaction({amount,type,note,category_name,date,wallet_id})` (khớp `TransactionCreate`/`TransactionRead` của backend).
- `src/pages/Transactions.jsx`:
  - **Bảng MUI** (override sẵn từ theme): cột Ngày | Ghi chú | Danh mục (AI) | Loại | Số tiền (JetBrains Mono, `tabular-nums`, format `vi-VN`).
  - Chip màu cho `type` (income=success, expense=error) và cho `category_name` (pill theo bảng màu, dùng helper badge cho dark mode).
  - Nút "Thêm giao dịch" → `BrandDialog` (port từ InTraAI) chứa form: amount, type (income/expense), note, category_name (để trống → AI gợi ý), date (x-date-pickers + dayjs).
  - Trạng thái loading (skeleton), empty state, error state (Alert).
  - Sau khi tạo: refetch list; toast/snackbar nhẹ.
- `src/components/BrandDialog.jsx`, `StatCard.jsx` — port rút gọn từ InTraAI.

## Task 5 — Dashboard (dữ liệu thật từ transactions)

- `src/pages/Dashboard.jsx`: 4 `StatCard` (Tổng thu, Tổng chi, Số dư, Số giao dịch — tính từ list transactions), **ECharts** pie theo `category_name` + line theo `date`. Empty state khi chưa có dữ liệu.

## Task 6 — Scaffold các trang placeholder

`src/pages/`: `Categories.jsx`, `Budgets.jsx`, `Reports.jsx`, `Members.jsx`, `Settings.jsx`, `NotFound.jsx`. Mỗi trang: `PageHeader` + card "Sắp ra mắt — chờ API Phase tiếp theo", style đồng bộ. (Reports có thể tái dùng chart Dashboard ở mức demo.)

## Task 7 — Hoàn thiện & kiểm thử thủ công

- Kiểm responsive (sidebar thu gọn ở mobile), dark/light toggle mượt, đổi ngôn ngữ cập nhật toàn UI.
- Dọn `App.jsx` cũ (inline-style) — thay hẳn bằng shell mới.
- Cập nhật `frontend/README` ngắn về cách chạy + biến `VITE_API_URL`.

---

## Cấu trúc thư mục đích (`conquer/budget-planner/frontend/src/`)

```
main.jsx                 # providers + i18n + fonts
App.jsx                  # <Routes>
theme/index.js           # buildTheme(mode) — token InTraAI
theme/ColorModeContext.jsx
i18n/index.js · locales/vi.json · locales/en.json
layout/AppLayout.jsx · Sidebar.jsx · TopBar.jsx
components/PageHeader.jsx · StatCard.jsx · BrandDialog.jsx
constants/nav.js
api/client.js · api/transactions.js
pages/Dashboard.jsx · Transactions.jsx · Categories.jsx ·
      Budgets.jsx · Reports.jsx · Members.jsx · Settings.jsx · NotFound.jsx
utils/motion.js
```

## Standards áp dụng

- **naming.md:** component `PascalCase`, file component `PascalCase.jsx`; biến/hàm `camelCase` (JS). API response giữ `snake_case` (khớp backend) — không đổi tên field khi gọi.
- **api/fastapi.md:** FE phải map đúng HTTP code (422 validation, 4xx) sang thông báo lỗi; mọi field khớp Pydantic schema (`amount`,`type`,`note`,`category_name`,`date`,`wallet_id`).
- **YAGNI:** chỉ thêm dep thực dùng; trang chưa có API để placeholder, không bịa endpoint.

## Verification (chạy thử end-to-end)

1. **Backend:** `cd conquer/budget-planner/backend && alembic upgrade head && uvicorn app.main:app --reload --port 8000` → kiểm `GET http://localhost:8000/health` trả `{"status":"ok"}`.
2. **Frontend:** `cd conquer/budget-planner/frontend && npm install && npm run dev` → mở `http://localhost:5173`.
3. **Shell:** sidebar điều hướng được mọi route; toggle dark/light đổi nền; đổi vi/en đổi nhãn menu.
4. **Transactions:** mở dialog, tạo giao dịch `amount=50000, note="ăn trưa"`, để trống danh mục → backend trả `category_name` AI gợi ý; bảng refetch và hiển thị; số tiền format `50.000`.
5. **Dashboard:** StatCards + chart phản ánh giao dịch vừa tạo.
6. **Lỗi:** tắt backend → FE hiển thị error state thay vì crash.
7. (Tuỳ chọn) kiểm dark mode đọc rõ chữ trên mọi trang.
