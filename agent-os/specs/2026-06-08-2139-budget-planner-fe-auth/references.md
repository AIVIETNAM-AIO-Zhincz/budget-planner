# References for FE Login/Auth

## FE hiện có (sửa/tái dùng)

- **`src/api/client.js`** — `apiFetch`, `ApiError`, header. Sửa: bỏ `SPACE_ID` hardcode, thêm Bearer + X-Space-Id từ localStorage + refresh-on-401.
- **`src/layout/TopBar.jsx`** — đang import `SPACE_ID`, hiện Chip "Space: demo-space". Sửa: space switcher + user/logout menu.
- **`src/layout/AppLayout.jsx`** — khung shell. Sửa: `key={spaceId}` cho `<Outlet/>`.
- **`src/App.jsx`** — lazy routes trong AppLayout. Sửa: thêm `/login`,`/register` + `RequireAuth`.
- **`src/main.jsx`** — `ColorModeProvider > BrowserRouter > App`. Sửa: thêm `AuthProvider` trong Router.
- **`src/components/BrandDialog.jsx`, `PageHeader.jsx`** — mẫu form/style (tham khảo cho Login/Register).
- Các trang/feature (`pages/Transactions|Categories|Budgets|Dashboard`, `api/*.js`) — **không sửa**: gọi `apiFetch` nên tự có token+space.

## Backend (hợp đồng — PR #4)

- **Location:** `conquer/budget-planner/backend/app/api/auth.py`, `spaces.py`.
- `POST /auth/register` (JSON), `POST /auth/login` (form), `POST /auth/refresh` (JSON), `GET /auth/me`, `GET /spaces`.
- `Token{access_token, refresh_token, token_type}`; `SpaceRead{id,name,owner_id,currency,role}`.
