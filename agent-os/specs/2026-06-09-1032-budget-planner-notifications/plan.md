# Budget Planner — Notifications (chuông thông báo)

## Context

TopBar đã có icon chuông **placeholder** (Badge dot tĩnh). Spec này biến nó thành trung tâm thông báo thật: lưu sự kiện vào DB và hiển thị danh sách + badge đếm chưa đọc. Tận dụng **event bus** sẵn có (showcase kiến trúc event-driven). Cần model `Notification` + migration (thứ 2 của dự án).

**Quyết định đã chốt:**
- Thông báo **theo không gian** (mọi thành viên thấy chung; `is_read` dùng chung).
- Nguồn: **vượt ngân sách** (qua handler `BudgetExceeded`), **mời thành viên** (inline POST /members), **định kỳ đã chạy** (inline /recurring/run khi `created>0`).
- Badge: **poll ~60s + lấy khi mở app/dropdown** (không websocket).
- RBAC đọc/đánh dấu = viewer+ (chung space). Nhánh `feature/budget-planner-notifications` từ `develop`. TDD.

## Hợp đồng hiện có

- `app/events/handlers.py` — `notify_budget_exceeded(event)` hiện chỉ log; handler tự mở `db.SessionLocal()` rồi commit/close. `register_handlers()` subscribe vào `event_bus`.
- `app/events/events.py` — `BudgetExceeded(space_id,category_name,period,limit_amount,spent_amount)` (đã publish từ `_check_budget_overflow` khi tạo giao dịch).
- `app/api/members.py` `invite_member` — đã `db.add(AuditLog "member.invited")` + commit (thêm Notification cạnh đó).
- `app/api/recurring.py` `/run` — trả `{created}` (thêm Notification khi `created>0`).
- `app/models/__init__.py` — `_uuid`/`_now`, pattern Mapped, `__all__`. `app/rbac` — `get_current_space_id`/`require_min_role`.
- FE: `layout/TopBar.jsx` (Bell + Badge dot, Menu mẫu như space switcher), `api/client.js` (`apiFetch`), `auth/AuthContext` (`spaceId`).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-1032-budget-planner-notifications/`.

## Task 2 — Backend: model + migration + nguồn + router (TDD)

- **Model** `Notification` (`app/models/__init__.py`): `id, space_id(FK spaces,index), type(String32), message(String500), is_read(bool False), created_at`. Thêm `__all__`.
- **Migration**: `alembic revision --autogenerate -m "add notifications"` (down_revision = `f8dc0ceb6d66`) → tạo bảng `notifications`; review; `alembic upgrade head`.
- `app/services/notification.py`: `add_notification(db, space_id, type, message) -> None` (db.add; **không** commit — caller commit). Tái dùng cả handler lẫn endpoint.
- **Nguồn**:
  - `app/events/handlers.py` `notify_budget_exceeded`: giữ log + mở `db.SessionLocal()`, `add_notification(... "budget.exceeded", f"Vượt ngân sách {category} ({period}): đã chi {spent}/{limit}")`, commit, close.
  - `app/api/members.py` `invite_member`: `add_notification(db, space_id, "member.invited", f"{email} được mời vào nhóm ({role})")` trước commit.
  - `app/api/recurring.py` `/run`: nếu `created>0` → `add_notification(db, space_id, "recurring.ran", f"Đã sinh {created} giao dịch định kỳ")` + commit.
- `app/schemas/notification.py`: `NotificationRead(id, space_id, type, message, is_read, created_at)`.
- `app/api/notifications.py` (`prefix="/notifications"`): GET "" (viewer+, desc, limit 50); GET "/unread-count" → `{count}`; PATCH "/{id}/read"; POST "/read-all" → `{updated}`; DELETE "/{id}". Cô lập theo `space_id`. Wire `main.py`.
- `tests/test_notifications.py`: vượt ngân sách (tạo category+budget tháng này+chi quá hạn → có noti `budget.exceeded`); mời thành viên → có noti; `/recurring/run` created>0 → có noti; unread-count; mark read giảm count; read-all; cô lập space; viewer đọc được.

## Task 3 — FE api + chuông dropdown

- `src/api/notifications.js`: `listNotifications`, `unreadCount`, `markRead(id)`, `markAllRead`.
- `src/layout/TopBar.jsx`: thay placeholder chuông → `IconButton` mở `Menu`; `Badge badgeContent={unread}`. State unread + items; `useEffect` lấy unread khi mount + `setInterval(60s)` + refetch theo `spaceId`; mở dropdown → lấy list; mỗi item bấm → `markRead` → refetch; nút **"Đánh dấu đã đọc tất cả"** → `markAllRead`. Empty state. Dọn interval khi unmount.

## Task 4 — i18n

`vi.json`/`en.json`: `notifications.*` (title, empty, markAll, justNow/ago tuỳ chọn). *(Message nội dung do backend sinh bằng tiếng Việt → hiển thị nguyên văn; ghi chú hạn chế cho bản en.)* `t()` cho phần khung.

## Task 5 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh; `alembic upgrade head` OK; autogenerate sau migration **no-op**.
- FE: `npm run build` xanh.
- Live (restart backend + `alembic upgrade` DB demo + dev): tạo ngân sách nhỏ rồi chi vượt → chuông +1 (badge); mời thành viên → +1; chạy định kỳ tạo GD → +1; mở dropdown thấy danh sách, đánh dấu đã đọc → badge về 0.

---

## Cấu trúc file

```
backend/app/models/__init__.py              (sửa — Notification + __all__)
backend/alembic/versions/xxxx_add_notifications.py  (mới — migration #2)
backend/app/services/notification.py · schemas/notification.py · api/notifications.py  (mới)
backend/app/events/handlers.py              (sửa — notify_budget_exceeded lưu noti)
backend/app/api/members.py · api/recurring.py · main.py  (sửa — nguồn + wire)
backend/tests/test_notifications.py         (mới)
frontend/src/api/notifications.js           (mới)
frontend/src/layout/TopBar.jsx              (sửa — dropdown + badge + poll)
frontend/src/i18n/locales/vi.json · en.json (sửa)
```
Tái dùng: `event_bus`/handler pattern (`db.SessionLocal()`), `require_min_role`/`get_current_space_id`, `AuditLog` mẫu, `apiFetch`, MUI `Menu`/`Badge`/`List` (mẫu space switcher trong TopBar).

## Standards áp dụng

- **api/fastapi** — lọc `space_id`; viewer+; HTTP code chuẩn; handler cô lập lỗi (không hỏng request chính).
- **testing/tdd** — test trước nguồn (budget/member/recurring) + unread/mark/read-all + cô lập.
- **database/migrations** — **một revision mới** qua autogenerate, review; verify no-op sau đó.
- **naming/coding-style** — field `snake_case`; `add_notification` thuần (không commit); YAGNI (không websocket, poll nhẹ).

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && alembic upgrade head && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live: alembic upgrade trên budget_planner.db ; restart uvicorn :8000 ; dev :5173
```
Kịch bản: vượt ngân sách / mời thành viên / định kỳ chạy → chuông tăng; mở dropdown + đánh dấu đã đọc → badge về 0.
