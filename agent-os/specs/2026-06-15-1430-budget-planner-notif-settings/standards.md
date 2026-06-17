# Standards for Settings batch (Notification prefs)

---

## database/migrations

- Migration #8 (`add_notification_prefs_to_spaces`, down_revision `8edb758c6885`) add 3 Boolean column `server_default=sa.true()` nullable=False; downgrade drop. Ruff check + format. Áp + no-op.

## api/rbac + testing (TDD)

- PATCH cờ thông báo trên Space cần `require_min_role("admin")` (như currency); cô lập space. Gate tập trung trong `add_notification` (1 chỗ phủ 3 nguồn). Field optional/default → SpaceRead/Update không phá test cũ. Test BE trước (notifications gate + spaces flags). Giữ 34 vitest.

## frontend/forms-ui

- Switch + readonly cho viewer; toast khi lưu; i18n vi/en; card Tiền tệ/Không gian ở đầu.

## ci

- `ruff check .` + `ruff format --check .` trước push ([[ci-ruff-format-check]]). Không Co-Authored-By ([[no-coauthor-commits]]). Worktree riêng. Test local lỗi env → xoá `$TMPDIR/bp_test.db` ([[stale-test-db-bp-test]]).
