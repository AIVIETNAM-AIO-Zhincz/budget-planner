# Standards for Dự kiến vs Thực tế (Kế hoạch tháng)

---

## database/migrations

- Migration #6 (`add_monthly_plans`, down_revision `2e8056959549`) create_table + index, downgrade drop. Ruff-clean theo style migration cũ. Áp DB + no-op lần 2. CI `alembic upgrade head`.

## api/rbac + testing (TDD)

- `PUT /monthly-plan/{period}` cần `require_min_role("member")`; cô lập theo space; upsert theo (space, period). Viết test BE trước (`test_plans.py`): PUT→GET planned+actual, isolation, viewer 403. Giữ 147 pytest + 34 vitest xanh.

## frontend/forms-ui

- DatePicker chọn tháng (dayjs); card planned vs actual (LinearProgress + số) Thu/Chi/Tiết kiệm + badge ✅/❌; i18n vi/en đầy đủ.
