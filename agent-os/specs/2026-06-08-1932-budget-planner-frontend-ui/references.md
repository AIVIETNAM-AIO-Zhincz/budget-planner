# References for Budget Planner — Frontend UI Shell

## Similar Implementations

### InTraAI-WebTracking (design system gốc — bám theo)

- **Location:** `conquer/sample/InTraAI-WebTracking/frontend/`
- **Relevance:** Nguồn chuẩn thị giác — copy token màu, typography, layout, component pattern.
- **Key patterns / files:**
  - `frontend/src/App.jsx` — khối `createTheme()` (~dòng 151–384): palette light/dark, typography scale, override Button/Card/TableCell/Dialog, `customShadows`, `motion.reducedMotion`. Cũng là mẫu layout Drawer + AppBar.
  - `frontend/src/components/StatCard.jsx` — KPI card (Paper, border accent 20%, shadow, hover-lift).
  - `frontend/src/components/BrandDialog.jsx` — dialog shell header/body/footer, mobile fullscreen, backdrop blur.
  - `frontend/src/utils/motion.js` — `cardHover`, `hoverLift`, `pillTransition` (motion-aware).
  - `frontend/src/utils/badgeColors.js` — chuyển hex sáng → translucent cho dark mode (`badgeTone`).
  - `frontend/src/constants/taskTypes.js` — bảng màu badge mẫu (color/bg/border).

### Design tokens trích sẵn (đích)

- Màu: primary `#6366f1`, success `#10b981`, warning `#f59e0b`, error `#ef4444`, info `#2563eb`.
- Light: bg `#f8fafc`, paper `#fff`, subtle `#F4F6FA`, text `#0f172a`/`#475569`, divider `#e2e8f0`.
- Dark: bg `#0e1016`, paper `#171a22`, subtle `#21242f`, text `#fff`/`#c9d1d9`, divider `#2a2f3a`.
- Font: Public Sans (UI) + JetBrains Mono (số, `tabular-nums`). Bo góc: button 8, card 12–16, dialog 12, pill 999.

## Codebase hiện tại (thay/nối)

### Frontend budget-planner (sẽ thay)

- **Location:** `conquer/budget-planner/frontend/src/App.jsx`, `api.js`, `main.jsx`
- **Relevance:** FE hiện tại (inline-style, 1 trang Transactions). Logic gọi API trong `api.js` (`listTransactions`, `createTransaction`, header `X-Space-Id: demo-space`) là nền cho `api/client.js` mới.

### Backend budget-planner (API hợp đồng)

- **Location:** `conquer/budget-planner/backend/app/`
- **Relevance:** Hợp đồng API mà FE phải khớp.
- **Key:**
  - `app/schemas/transaction.py` — `TransactionCreate` / `TransactionRead` (`amount>0`, `type` income|expense, `note`, `category_name`, `date`, `wallet_id`).
  - `app/routers/` — `GET/POST /transactions`, `GET /audit-logs`, `GET /health`.
  - `app/rbac/__init__.py` — `get_current_space_id` đọc header `X-Space-Id` (mặc định `default-space`).
  - `app/core/config.py` — CORS cho `http://localhost:5173`.
