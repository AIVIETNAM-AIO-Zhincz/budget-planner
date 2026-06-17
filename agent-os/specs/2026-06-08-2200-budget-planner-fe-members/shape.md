# FE Members (RBAC-aware) — Shaping Notes

## Scope

Nối trang FE Members (đang `ComingSoon`) vào backend `/members`: xem/mời/đổi vai trò/xoá thành viên. UI nhận biết vai trò user hiện tại. FE-only.

## Decisions

- **Ẩn nút quản lý** (mời/đổi/xoá) nếu user không phải owner/admin; member/viewer chỉ xem.
- **Đổi vai trò bằng dropdown inline** trên hàng → PATCH.
- Khoá thao tác trên chính mình + trên owner (không hạ/xoá owner); chỉ owner gán owner.
- Tái dùng `BrandDialog`/`ConfirmDialog`/`PageHeader`/`apiFetch`/`useAuth`. Không thêm dep.

## Context

- **Visuals:** None (bảng MUI theo theme hiện có).
- **References:** trang Categories/Budgets (pattern fetch/skeleton/empty/error/snackbar + ConfirmDialog), backend `app/api/members.py` (hợp đồng + quy tắc quyền), `auth/AuthContext` (role qua spaces/spaceId).
- **Product alignment:** Roadmap Phase 0/2 — cộng tác + RBAC.

## Standards Applied

- **naming** — component `PascalCase.jsx`; giữ field API `snake_case` (`user_id`).
- **api/fastapi (FE)** — map 403/404/409; `role` ∈ owner|admin|member|viewer; UI ẩn nút chỉ là UX, backend chặn thật.
- **coding-style** — helper thuần; YAGNI.
