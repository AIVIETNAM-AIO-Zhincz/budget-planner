# Budget Planner — FE Login/Auth + Space Switcher

## Context

Backend đã bắt buộc JWT + RBAC (PR #4). FE hiện **gửi `X-Space-Id: demo-space` không token → 401/403**, app không dùng được. Spec này khôi phục luồng người dùng: trang **Đăng nhập/Đăng ký**, lưu access+refresh token, gắn `Authorization: Bearer` vào mọi request, **chuyển không gian** (space switcher), route guard, và **auto-refresh** khi access hết hạn. FE-only.

**Quyết định đã chốt:**
- **Login + Register** (đăng ký tự tạo space owner ở backend).
- **Space switcher dropdown** trên TopBar (đổ từ `GET /spaces`); đổi space → đổi `X-Space-Id` + refetch.
- **Auto refresh khi 401**: dùng refresh_token lấy access mới → retry; thất bại → logout về `/login`.
- Nhánh `feature/budget-planner-fe-auth` từ `develop`.

## Hợp đồng API (đã có)

- `POST /auth/register` (JSON `{email,password,name}`) → 201; 409 trùng.
- `POST /auth/login` (**form** `username,password`) → `{access_token,refresh_token,token_type}`; 401 sai.
- `POST /auth/refresh` (JSON `{refresh_token}`) → access mới.
- `GET /auth/me` (Bearer) → user. `GET /spaces` (Bearer) → `[{id,name,role,...}]`.
- Mọi endpoint dữ liệu cần `Authorization: Bearer` + `X-Space-Id`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-08-2139-budget-planner-fe-auth/` (plan/shape/standards/references + visuals/).

## Task 2 — API layer xác thực + client refresh

- `src/api/client.js` (sửa): bỏ `SPACE_ID` hardcode. Lưu/đọc `localStorage` keys `bp-access`,`bp-refresh`,`bp-space` qua helper `getAccessToken/getSpaceId/setTokens/setSpace/clearAuth`. `apiFetch` gắn `Authorization` (nếu có) + `X-Space-Id` (nếu có). **Refresh-on-401**: gặp 401 (path không phải `/auth/*`, chưa retry, có refresh) → gọi `/auth/refresh` (plain fetch) → lưu access mới → retry 1 lần; thất bại → `clearAuth()` + gọi `onUnauthorized()` (callback do AuthProvider đăng ký qua `setUnauthorizedHandler`) → ném `ApiError`.
- `src/api/auth.js` (mới): `login(email,password)` (gửi `application/x-www-form-urlencoded` bằng `URLSearchParams`, **không** qua apiFetch), `register({email,password,name})`, `getMe()`, `refreshToken(rt)`.
- `src/api/spaces.js` (mới): `listSpaces()` qua `apiFetch`.

## Task 3 — AuthContext + RequireAuth

- `src/auth/AuthContext.jsx` (mới): `AuthProvider` + `useAuth()`.
  - state: `status` (`loading|authed|anon`), `user`, `spaces`, `spaceId`.
  - on mount: nếu có access token → `getMe()` + `listSpaces()` → set authed, `spaceId` = `bp-space` đã lưu hoặc `spaces[0].id` (lưu lại); lỗi → `clearAuth()` → anon.
  - `login(email,password)`: gọi API → `setTokens` → nạp me+spaces → chọn space đầu → authed.
  - `register(payload)`: gọi register → rồi `login(...)`.
  - `logout()`: `clearAuth()` + reset state → navigate `/login`.
  - `selectSpace(id)`: `setSpace(id)` (localStorage) + setState.
  - Đăng ký `setUnauthorizedHandler(logout)` để client gọi khi refresh thất bại.
- `src/auth/RequireAuth.jsx` (mới): `status==="loading"` → spinner; `anon` → `<Navigate to="/login" replace/>`; else `<Outlet/>`.

## Task 4 — Trang Login + Register

- `src/pages/Login.jsx`, `src/pages/Register.jsx` (mới): layout full-screen căn giữa (Paper card, logo Budget Planner), form MUI (email/password [+name]), nút submit (loading), map lỗi `ApiError` (401 sai đăng nhập, 409 email trùng, 422) sang Alert, link chuyển qua lại. Sau thành công → `navigate("/")`. Đã đăng nhập rồi thì redirect khỏi `/login`.

## Task 5 — Shell: routes + guard + TopBar + remount theo space

- `src/main.jsx` (sửa): bọc `<AuthProvider>` bên trong `<BrowserRouter>` (để dùng `useNavigate`): ColorModeProvider → BrowserRouter → AuthProvider → App.
- `src/App.jsx` (sửa): thêm route công khai `/login`,`/register`; bọc nhóm app bằng `<RequireAuth>` → `<AppLayout>` (giữ các route hiện có).
- `src/layout/TopBar.jsx` (sửa): thay Chip "Space: demo-space" bằng **menu chọn space** (từ `useAuth().spaces`, hiện tên + role, đổi gọi `selectSpace`); thêm **menu user** (email + nút Đăng xuất). Bỏ import `SPACE_ID`.
- `src/layout/AppLayout.jsx` (sửa): `key={spaceId}` cho vùng nội dung (`<Outlet/>`) để **remount toàn trang khi đổi space** → tự refetch dữ liệu.

## Task 6 — i18n

`vi.json`/`en.json`: thêm `auth.*` (login, register, email, password, name, submit, noAccount, haveAccount, loginError, registerError, ...) + `topbar.logout`, `topbar.account`. Mọi chữ dùng `t()`.

## Task 7 — Verify

- `npm run build` ✅.
- `npm run dev` + backend `:8000`:
  - Chưa đăng nhập → mọi route app redirect `/login`.
  - Đăng ký user mới → vào app, Dashboard/Transactions/Categories/Budgets tải được (có token + space).
  - Tạo space thứ 2 (qua API hoặc bỏ qua) → switcher đổi space → dữ liệu refetch theo space.
  - Đăng xuất → về `/login`, token bị xoá.
  - (Tuỳ chọn) hết hạn access → request tự refresh, không văng ra login.

---

## Cấu trúc file (`src/`)

```
api/client.js                 (sửa — Bearer + X-Space-Id từ storage + refresh-on-401)
api/auth.js · api/spaces.js   (mới)
auth/AuthContext.jsx · auth/RequireAuth.jsx   (mới)
pages/Login.jsx · pages/Register.jsx          (mới)
layout/TopBar.jsx             (sửa — space switcher + user/logout menu)
layout/AppLayout.jsx          (sửa — key theo spaceId)
App.jsx · main.jsx            (sửa — routes/guard + AuthProvider)
i18n/locales/vi.json · en.json (sửa — auth keys)
```
Tái dùng (không sửa): các trang/feature đã có (Transactions/Categories/Budgets/Dashboard) + api modules — chúng gọi `apiFetch` nên **tự** có token+space, không cần đổi.

## Standards áp dụng

- **naming** — component `PascalCase.jsx`; giữ field API `snake_case` (`access_token`,`refresh_token`).
- **api/fastapi (phía FE)** — map HTTP code (401/409/422); login gửi đúng `x-www-form-urlencoded`; mọi request gắn `Authorization` + `X-Space-Id`.
- **coding-style** — context gọn, helper thuần cho storage; YAGNI (không thêm dep; dùng `fetch` + Context có sẵn).

## Verification (lệnh)

```bash
cd conquer/budget-planner/frontend && npm run build      # phải xanh
npm run dev                                              # :5173/5174
# backend: cd ../backend && uvicorn app.main:app --port 8000
```
Kịch bản: redirect login → đăng ký → dùng app → đổi space (refetch) → đăng xuất.
