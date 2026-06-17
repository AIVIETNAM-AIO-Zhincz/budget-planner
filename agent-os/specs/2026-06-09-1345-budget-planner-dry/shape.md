# Dọn trùng lặp backend (DRY) — Shaping Notes

## Scope

Gom các mẫu lặp về helper dùng chung: `_get_owned` (7 router), `_fmt` (2 nơi), mapping lỗi transfer (2 router), `AuditLog(...)` (8 chỗ). Pure refactor — hành vi không đổi.

## Decisions

- Dọn toàn diện: `format_vnd` (core) + `get_owned_or_404`/`write_audit`/`raise_transfer_error` (api/_common).
- Giữ call site ổn định: `_get_owned` mỗi router → wrapper 1 dòng. Không model/migration/FE.
- Test cũ (139) phải xanh = bằng chứng pure refactor; thêm test helper.

## Context

- **Visuals:** None.
- **References:** `app/api/{budgets,categories,goals,notifications,recurring,transactions,wallets,members}.py`, `app/services/{assistant,wallet}.py`, `app/events/handlers.py`, `app/models.AuditLog`.
- **Product alignment:** Chất lượng code sau Phase 0–1.

## Standards Applied

- **naming/coding-style** — DRY; helper đúng tầng (format ở core, raise-HTTP ở api). YAGNI.
- **testing/tdd** — test helper + regression toàn bộ test cũ.
- **api/fastapi** — status code/hợp đồng không đổi.
- **database/migrations** — no-op (không model mới).
