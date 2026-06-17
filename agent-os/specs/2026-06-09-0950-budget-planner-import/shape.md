# Import CSV giao dịch — Shaping Notes

## Scope

Nhập CSV để tạo giao dịch hàng loạt (khép vòng với Reports xuất CSV: `date,type,category_name,note,amount`). Upload → preview dry-run → xác nhận → tạo. Không model/migration mới.

## Decisions

- Luồng **preview (dry-run) rồi xác nhận**.
- **Không gắn ví** (khớp cột file export → không động số dư).
- **Bỏ qua dòng lỗi**, nhập phần hợp lệ; liệt kê lỗi theo dòng.
- RBAC import = member+. Danh mục trống → `suggest_category(note)`. Đọc `utf-8-sig` (bỏ BOM).

## Context

- **Visuals:** None.
- **References:** `app/api/transactions.py` (create + suggest_category + RBAC), `app/api/reports.py` (export cột chuẩn), `api/reports.js` (raw fetch/blob mẫu), `pages/Transactions.jsx`, `BrandDialog`.
- **Product alignment:** Roadmap Phase 4 — import/export dữ liệu.

## Standards Applied

- **api/fastapi** — `UploadFile`; member+; lỗi theo dòng (không 500 vì dữ liệu xấu).
- **testing/tdd** — test trước parse/dry-run/commit/lỗi/RBAC.
- **database/migrations** — không model mới ⇒ no-op.
- **naming/coding-style** — snake_case; parser tách rõ; YAGNI.
