# Standards for Phân loại Nhu cầu/Mong muốn/Lãng phí

---

## database/migrations

- Migration #5 (`add_need_level_to_categories`, down_revision `380e5fac27d4`) có upgrade/downgrade; `add_column` kèm `server_default="optional"`, `nullable=False` cho dữ liệu cũ. Áp vào DB + verify no-op lần 2. CI chạy `alembic upgrade head`.

## api/naming + testing (TDD)

- `need_level` field **optional + default "optional"** → CategoryRead/Create/Update không phá test cũ. Pattern `^(mandatory|optional|wasteful)$`. Viết test BE trước (categories + reports). Giữ 143 pytest + 34 vitest xanh.

## frontend/forms-ui

- Select need_level i18n (hiện khi type=chi); chip need_level ở Categories; donut "% chi theo nhóm" qua `pieOption`/`ChartCard` (reduced-motion sẵn).
