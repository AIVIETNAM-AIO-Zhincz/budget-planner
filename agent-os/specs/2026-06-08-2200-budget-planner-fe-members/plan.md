# Budget Planner — FE Members (quản lý thành viên, RBAC-aware)

## Context

Backend `/members` (list/invite/đổi vai trò/xoá + audit) đã merge (PR #4). Trang FE **Members** vẫn là `ComingSoon` placeholder. Spec này nối trang vào API: xem danh sách thành viên, mời, đổi vai trò, xoá — với **UI nhận biết vai trò** (chỉ owner/admin thấy nút quản lý; member/viewer chỉ xem). FE-only.

**Quyết định đã chốt:**
- **Ẩn nút quản lý** nếu user hiện tại không phải owner/admin (UI trải nghiệm; backend vẫn chặn 403).
- **Đổi vai trò bằng dropdown inline** trên từng hàng → PATCH.
- Nhánh `feature/budget-planner-fe-members` từ `develop`.

## Hợp đồng API (đã có)

- `GET /members` → `[{id, user_id, email, name, role, status}]` (viewer+).
- `POST /members {email, role}` → 201; **404** email chưa có tài khoản, **409** đã là thành viên, **403** thiếu quyền.
- `PATCH /members/{id} {role}` → 200; **403** đổi owner / không đủ quyền, **404**.
- `DELETE /members/{id}` → 204; **403** xoá owner / thiếu quyền.
- Quy tắc backend: admin+ mới quản lý; chỉ owner gán/đổi `owner`; không xoá/hạ owner.

## Vai trò user hiện tại

Lấy từ `useAuth()`: `spaces.find(s => s.id === spaceId).role`. `canManage = role ∈ {owner, admin}`. `isOwner = role === "owner"`. User id hiện tại = `useAuth().user.id` (để khoá thao tác trên chính mình).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-08-2200-budget-planner-fe-members/` (plan/shape/standards/references + visuals/).

## Task 2 — API module

`src/api/members.js`: `listMembers()`, `inviteMember({email, role})`, `updateMemberRole(id, role)` (PATCH `{role}`), `removeMember(id)` — dùng `apiFetch`.

## Task 3 — InviteMemberDialog

`src/components/InviteMemberDialog.jsx` (bọc `BrandDialog`): form `email` (TextField) + `role` (Select: admin/member/viewer, thêm owner nếu `isOwner`). `onSubmit({email, role})` async; map lỗi `ApiError` (404 email chưa có tài khoản, 409 đã là thành viên) hiển thị trong dialog/Alert.

## Task 4 — Trang Members

`src/pages/Members.jsx` (thay `ComingSoon`):
- fetch `listMembers`; lấy `canManage/isOwner/currentUserId` từ `useAuth`.
- **Bảng**: Tên/Email | Vai trò | (Thao tác).
  - **Vai trò**: nếu `canManage` & `member.role !== "owner"` & không phải chính mình → `Select` (admin/member/viewer [+owner nếu isOwner]) đổi trực tiếp → `updateMemberRole` → refetch + toast. Ngược lại → `Chip` tĩnh (nhãn vai trò i18n).
  - **Thao tác**: nút Xoá (TrashIcon) chỉ khi `canManage` & `role !== "owner"` & không phải chính mình → `ConfirmDialog` → `removeMember`.
  - Hàng của chính mình: badge "(bạn)".
- `PageHeader` + nút **"Mời thành viên"** chỉ khi `canManage` → `InviteMemberDialog`.
- skeleton (loading), empty, `Alert` lỗi (map `ApiError`), `Snackbar` thành công.

## Task 5 — i18n

`vi.json`/`en.json`: thêm `members.*` (invite, colName, colRole, colActions, you, empty, inviteForm: {title,email,role,emailHint}, roles: {owner,admin,member,viewer}, invited/updated/removed, removeTitle, removeConfirm, loadError, saveError). Mọi chữ dùng `t()`.

## Task 6 — Verify

- `npm run build` ✅.
- `npm run dev` + backend `:8000`:
  - Owner đăng nhập → Members hiện chính mình (owner, không sửa/xoá được bản thân).
  - Đăng ký user thứ 2 (tab ẩn danh / API) → owner mời theo email role=member → xuất hiện; đổi dropdown sang admin → cập nhật; xoá → biến mất.
  - Mời email chưa tồn tại → lỗi 404 hiển thị.
  - Đăng nhập bằng member → trang Members **chỉ xem**, không có nút Mời/đổi/xoá.

---

## Cấu trúc file (`src/`)

```
api/members.js                    (mới)
components/InviteMemberDialog.jsx  (mới)
pages/Members.jsx                  (thay ComingSoon)
i18n/locales/vi.json · en.json     (sửa — members.*)
```
Tái dùng (không sửa): `BrandDialog`, `ConfirmDialog`, `PageHeader`, `api/client.js` (`apiFetch`/`ApiError`), `auth/AuthContext` (`useAuth`). Router đã có route `/members`.

## Standards áp dụng

- **naming** — component `PascalCase.jsx`; giữ field API `snake_case` (`user_id`).
- **api/fastapi (FE)** — map HTTP code (403/404/409) sang thông báo; body khớp (`role` ∈ owner|admin|member|viewer). UI ẩn nút theo vai trò chỉ là UX — backend mới chặn thật.
- **coding-style** — helper/format thuần; YAGNI (không thêm dep).

## Verification (lệnh)

```bash
cd conquer/budget-planner/frontend && npm run build      # phải xanh
npm run dev                                              # :5173/5174
# backend: cd ../backend && uvicorn app.main:app --port 8000
```
Kịch bản: owner mời/đổi vai trò/xoá thành viên; member chỉ xem (ẩn nút).
