# Backend Auth (JWT) + RBAC — Shaping Notes

## Scope

Thêm xác thực JWT (đăng ký/đăng nhập/refresh/me), RBAC theo Membership (owner/admin/member/viewer), spaces + members management, bật RBAC trên các write-endpoint hiện có. Thay `demo-space` hardcode bằng không gian thật. Backend-only.

## Decisions

- **Bắt buộc token** trên mọi endpoint dữ liệu (không fallback) → FE hiện tại tạm hỏng đến spec FE-login.
- **OAuth2 password form** login + **access & refresh** token (rotate access).
- **Đầy đủ** quản lý thành viên (spaces list/create; members list/invite/role/remove + audit).
- Không cần migration (bảng users/spaces/memberships/audit_logs đã có). Thêm dep `python-multipart` + `email-validator`.
- TDD. Nhánh `feature/budget-planner-auth-rbac`.

## Ma trận quyền

`viewer < member < admin < owner`. Space hiện tại từ header `X-Space-Id` (đã xác thực membership).
- Đọc (GET dữ liệu): viewer+. Transaction POST: member+. Categories/Budgets POST/PATCH/DELETE: admin+.
- Members invite/role/remove: admin+; chỉ owner gán/đổi owner; không xoá/hạ owner.

## Context

- **Visuals:** None.
- **References:** slice transactions/categories/budgets (router pattern, Depends, audit), models User/Space/Membership/AuditLog (đã có), `events/handlers.py` (audit pattern), `conftest.py`.
- **Product alignment:** Roadmap Phase 0 "Space + RBAC + audit log"; Phase 2 cộng tác.

## Standards Applied

- **api/fastapi** — RBAC server-side (vai trò × không gian × tài nguyên); HTTP code (401/403/404/409/422); audit log + actor_id; không log mật khẩu/token.
- **testing/tdd** — test trước; happy + 403/401; độc lập.
- **naming / coding-style / database/migrations** — chuẩn; helper thuần; không revision mới.
