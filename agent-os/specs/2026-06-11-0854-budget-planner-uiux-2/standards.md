# Standards for UI/UX batch 2

---

## api/error-handling + naming

- `/transactions` giữ trả mảng (thêm `limit/offset` opt-in); endpoint `/transactions/stats` đặt tên nhất quán, cùng filter. Tách `_apply_filters` (DRY). Không đổi schema → không migration.

## frontend/forms-ui

- MUI `TablePagination`; validation inline (`touched+error+helperText`); màu badge phân biệt; i18n đầy đủ vi/en cho text mới.

## testing (TDD)

- Viết test BE trước cho limit/offset/stats; **giữ 141 pytest + 33 vitest xanh**; thêm test badge (distinctness). `categoryColor` giữ deterministic + hex để `format.test.js` không vỡ.
