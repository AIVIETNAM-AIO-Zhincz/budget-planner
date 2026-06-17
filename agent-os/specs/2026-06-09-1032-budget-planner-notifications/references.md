# References for Notifications

## Backend (tái dùng/mô phỏng)

- `conquer/budget-planner/backend/app/events/handlers.py` — `notify_budget_exceeded(event)` (nâng để lưu noti); handler mở `db.SessionLocal()` rồi commit/close. `register_handlers()` subscribe.
- `app/events/events.py` — `BudgetExceeded(space_id,category_name,period,limit_amount,spent_amount)`.
- `app/api/members.py` `invite_member` (đã add AuditLog "member.invited" + commit) — thêm Notification cạnh đó.
- `app/api/recurring.py` `/run` (trả `{created}`) — thêm Notification khi created>0.
- `app/models/__init__.py` (`_uuid`/`_now`, Mapped, `__all__`), `app/rbac` (`get_current_space_id`/`require_min_role`), `alembic/env.py` (autogenerate).
- `tests/conftest.py` — `owner`/`make_member`; DB test cùng engine với `db.SessionLocal` (handler ghi đọc được trong test).

## Frontend (tái dùng/mô phỏng)

- `src/layout/TopBar.jsx` — Bell + `Badge` (placeholder), `Menu` mẫu (space switcher) để dựng dropdown.
- `src/api/client.js` — `apiFetch`. `src/auth/AuthContext.jsx` — `spaceId` (refetch theo space).
- MUI `Menu`/`MenuItem`/`Badge`/`List`/`Divider`.
