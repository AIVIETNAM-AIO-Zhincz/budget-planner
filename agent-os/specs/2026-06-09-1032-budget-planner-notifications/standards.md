# Standards for Notifications

---

## api/fastapi

- Lọc mọi truy vấn theo `space_id`; đọc/đánh dấu = viewer+ (`get_current_space_id`).
- Handler event cô lập lỗi (bus đã log + không hỏng request chính); handler tự mở/đóng `db.SessionLocal()`.

## testing/tdd

- Test trước: 3 nguồn (budget vượt qua event, mời thành viên, /recurring/run created>0) tạo noti; unread-count; mark read giảm; read-all; cô lập space; viewer đọc được.

## database/migrations

- Một revision mới qua `alembic revision --autogenerate` (down_revision = migration recurring `f8dc0ceb6d66`); review; verify no-op + `upgrade head` OK.

## naming / coding-style

- Field `snake_case`; `add_notification(db, space_id, type, message)` thuần (db.add, không commit — caller commit). YAGNI (poll nhẹ, không websocket).
