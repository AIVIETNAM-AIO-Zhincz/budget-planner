# Settings batch (Cài đặt thông báo + tiền tệ) — Shaping Notes

## Scope

Thêm section "Cài đặt thông báo" (bật/tắt 3 loại: vượt ngân sách/mời thành viên/định kỳ — per-space) + đưa card Tiền tệ/Không gian lên đầu trang Settings. BE gate + FE Switch. Worktree mới từ develop.

## Decisions

- Prefs per-space: 3 cờ boolean trên Space (mặc định bật). Gate tập trung trong `add_notification`. Migration #8 (down_revision `8edb758c6885`).
- SpaceUpdate/Read +3 cờ; update tự nhận nhờ setattr-loop; thêm cờ vào 3 chỗ build SpaceRead. PATCH cờ cần admin+ (như currency).

## Context

- **Visuals:** review chữ của người dùng.
- **References:** `services/notification.py add_notification`, `models Space`, `schemas/space.py`, `api/spaces.py`, `Settings.jsx`, `api/spaces.js`.
- **Product alignment:** UX cài đặt + tôn trọng lựa chọn thông báo.

## Standards Applied

- **database/migrations** — migration #8 + server_default.
- **api/rbac + testing (TDD)** — admin+; gate 1 chỗ; test BE trước.
- **frontend/forms-ui** — Switch + readonly viewer; i18n; currency lên đầu.
- **ci** — `ruff format --check` ([[ci-ruff-format-check]]); no co-author; stale test DB ([[stale-test-db-bp-test]]).
