# FE Login/Auth + Space Switcher — Shaping Notes

## Scope

Khôi phục luồng người dùng FE sau khi backend bắt buộc JWT+RBAC: trang Đăng nhập/Đăng ký, lưu token, gắn `Authorization: Bearer`, space switcher, route guard, auto-refresh 401. FE-only.

## Decisions

- **Login + Register** (register tự tạo space owner ở backend).
- **Space switcher dropdown** trên TopBar (từ `GET /spaces`); đổi space → đổi `X-Space-Id` + remount/refetch.
- **Auto refresh 401**: dùng refresh_token lấy access mới → retry; thất bại → logout về `/login`.
- Token lưu `localStorage` (`bp-access`/`bp-refresh`/`bp-space`). Login gửi `x-www-form-urlencoded` (OAuth2 form).
- Không thêm dependency; dùng React Context + `fetch`.

## Context

- **Visuals:** None (card căn giữa theo theme MUI hiện có).
- **References:** FE shell PR #1 (`api/client.js`, `layout/TopBar.jsx`, `AppLayout.jsx`, `App.jsx`, `main.jsx`, `theme`, `BrandDialog`), các trang/api đã có (gọi `apiFetch`). Backend auth PR #4 (`/auth/*`, `/spaces`).
- **Product alignment:** Roadmap Phase 0 — Auth; nền cộng tác.

## Standards Applied

- **naming** — component `PascalCase.jsx`; giữ field API `snake_case` (`access_token`,`refresh_token`).
- **api/fastapi (FE)** — map HTTP 401/409/422; login đúng form-urlencoded; gắn `Authorization` + `X-Space-Id`.
- **coding-style** — helper thuần cho storage; YAGNI.
