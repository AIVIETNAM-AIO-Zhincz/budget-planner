# UI/UX batch 2 — Shaping Notes

## Scope

4 mục: phân trang giao dịch (BE+FE), % so kỳ trước ở Báo cáo (FE), validation inline form dialog (FE), chuẩn hoá màu badge danh mục (FE). Không phá 33 vitest / 141 pytest.

## Decisions

- 1 PR (`feature/budget-planner-uiux-2`).
- Phân trang **opt-in**: `/transactions` vẫn trả MẢNG (thêm `limit/offset`) + endpoint mới `/transactions/stats` → Dashboard (cần tất cả) + test cũ không vỡ. Thanh tổng dùng stats (toàn filter).
- % kỳ trước: FE gọi `getSummary` 2 lần (hiện tại + kỳ trước cùng độ dài). Không đổi backend reports.
- Validation: chuẩn hoá `touched+error+helperText`; gắn vào Wallet (name) + Invite (email).
- Màu badge: `categoryColor` golden-angle hue → hslToHex, deterministic + hex (giữ test).

## Context

- **Visuals:** None.
- **References:** `backend/app/api/transactions.py`, `reports.py`; `frontend/src/pages/{Transactions,Reports}.jsx`, `components/StatCard.jsx`, `components/{WalletFormDialog,InviteMemberDialog,TransactionFormDialog}.jsx`, `utils/format.js`.
- **Product alignment:** Trải nghiệm + khả năng dùng khi dữ liệu lớn.

## Standards Applied

- **api/error-handling + naming** — stats endpoint nhất quán; filter DRY; không migration.
- **frontend/forms-ui** — TablePagination; validation inline; màu phân biệt; i18n.
- **testing (TDD)** — test BE trước; giữ test cũ xanh.
