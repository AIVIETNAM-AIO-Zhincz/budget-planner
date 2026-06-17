# Standards for Quỹ (fund_type)

---

## database/migrations

- Migration #7 (`add_fund_type_to_goals`, down_revision `235fc17ed2c7`) add_column + server_default="general" nullable=False; downgrade drop. Ruff check + format. Áp + no-op.

## api/naming + testing (TDD)

- `fund_type` optional+default ("general"), pattern `^(emergency|long_term|general)$`. `_to_read` truyền `fund_type`. Test BE trước; giữ 153 pytest + 34 vitest.

## frontend/forms-ui

- Select fund_type i18n; chip màu theo loại ở Goals; dải tổng saved_amount theo loại; i18n vi/en.

## ci

- Chạy `ruff check .` + `ruff format --check .` trước push ([[ci-ruff-format-check]]).
