# Notifications — Shaping Notes

## Scope

Chuông thông báo thật: lưu sự kiện vào DB, badge đếm chưa đọc, dropdown danh sách. Tận dụng event bus. Cần model `Notification` + migration #2.

## Decisions

- Theo không gian (mọi thành viên thấy chung, `is_read` chung).
- Nguồn: vượt ngân sách (handler BudgetExceeded), mời thành viên (inline /members), định kỳ đã chạy (inline /recurring/run khi created>0).
- Badge: poll ~60s + lấy khi mở app/dropdown (không websocket).
- RBAC đọc/đánh dấu = viewer+. TDD.

## Context

- **Visuals:** None (chuông + dropdown theo style app).
- **References:** `app/events/handlers.py` (handler tự mở `db.SessionLocal()`), `events.py` (BudgetExceeded), `api/members.py`/`recurring.py` (chỗ thêm noti), `layout/TopBar.jsx` (Bell+Badge, Menu space switcher), `api/client.js`.
- **Product alignment:** Roadmap — cảnh báo/thông báo trong app.

## Standards Applied

- **api/fastapi** — lọc space_id; viewer+; handler cô lập lỗi.
- **testing/tdd** — test trước 3 nguồn + unread/mark/read-all + cô lập.
- **database/migrations** — 1 revision mới qua autogenerate, verify no-op.
- **naming/coding-style** — snake_case; `add_notification` thuần (không commit); YAGNI (poll, không websocket).
