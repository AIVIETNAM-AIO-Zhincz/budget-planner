# Hoàn thiện Transactions — Shaping Notes

## Scope

Bổ sung sửa/xoá giao dịch + lọc/tìm kiếm (backend query-param) + Autocomplete danh mục (FE). Full-stack.

## Decisions

- **Lọc ở backend**: `GET /transactions?type=&category=&month=&q=` (cộng dồn, vẫn lọc space_id).
- Thêm `GET /{id}`, `PATCH /{id}` (member+, re-check vượt ngân sách nếu expense), `DELETE /{id}` (member+, audit `transaction.deleted`).
- **Autocomplete freeSolo** cho danh mục trong form (chọn từ /categories hoặc gõ; trống → AI).
- TDD backend. Không cần migration (không đổi model).

## Context

- **Visuals:** None.
- **References:** slice transactions hiện có (`api/transactions.py` POST/GET + `_check_budget_overflow`, `schemas/transaction.py`), categories/budgets PATCH/DELETE (mẫu CRUD + audit), `services/budget._period_range`. FE: Transactions page/dialog, ConfirmDialog, CategoryChip, api/categories.
- **Product alignment:** Roadmap Phase 0 — giao dịch thêm/sửa/xoá + lọc/tìm.

## Standards Applied

- **api/fastapi** — query lọc + space_id; PATCH/DELETE member+ (RBAC); HTTP 403/404/422; audit `transaction.deleted` + actor_id.
- **testing/tdd** — test trước PATCH/DELETE/filters; happy + 403 + cô lập.
- **naming/coding-style** — field `snake_case`; helper thuần; YAGNI. **database/migrations** — không revision mới.
