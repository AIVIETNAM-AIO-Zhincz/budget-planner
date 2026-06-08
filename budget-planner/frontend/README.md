# Budget Planner — Frontend

React + Vite + **MUI v5**, theo design system của `conquer/sample/InTraAI-WebTracking`
(sidebar + topbar, dark/light mode, i18n vi/en, biểu đồ ECharts).

## Chạy dev

```bash
npm install
npm run dev          # http://localhost:5173
```

Backend mặc định ở `http://localhost:8000`. Đổi qua biến môi trường:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

Tạo file `.env.local` để cố định:

```
VITE_API_URL=http://localhost:8000
```

## Build

```bash
npm run build        # ra thư mục dist/
npm run preview      # xem thử bản build
```

## Cấu trúc

```
src/
├── main.jsx                 # providers (theme, i18n, router) + fonts
├── App.jsx                  # khai báo <Routes>
├── theme/                   # buildTheme (token InTraAI) + ColorModeContext
├── i18n/                    # cấu hình react-i18next + locales vi/en
├── layout/                  # AppLayout · Sidebar · TopBar
├── components/              # PageHeader, StatCard, BrandDialog, ComingSoon,
│                            #   CategoryChip, TransactionFormDialog
├── constants/nav.js         # cấu hình điều hướng sidebar
├── api/                     # client.js (fetch + X-Space-Id) · transactions.js
├── utils/                   # format, charts, motion, badgeColors
└── pages/                   # Dashboard · Transactions (nối API) ·
                             #   Reports · Categories · Budgets · Members ·
                             #   Settings · NotFound (placeholder)
```

## Ghi chú

- **Không gian (space):** tạm hardcode `demo-space` qua header `X-Space-Id`
  (xem `src/api/client.js`); thay sau khi backend có auth/RBAC.
- Chỉ **Transactions** + **Dashboard/Reports** nối API thật (backend Phase 0 mới
  có `/transactions`). Các trang khác là placeholder, mở rộng theo roadmap.
