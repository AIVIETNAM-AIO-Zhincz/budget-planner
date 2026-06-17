# Budget Planner — UI/UX batch 4 (mini-stats ví, thành viên, polish)

## Context

Tiếp nối review toàn app + batch 3. Batch 4 làm các mục còn lại: **mini-stats từng ví** (mục đã defer),
**thành viên có avatar + mời rõ ràng**, và **polish nhỏ/accessibility** (tooltip badge, độ rộng card,
vùng click nút). Mục tiêu: trang Ví/Thành viên đỡ "trống/khô khan", dễ dùng hơn. Chủ yếu FE + 1 fix BE
(aggregate runtime, **không migration**).

**Quyết định đã chốt:** base **develop** (head `bad21e7`) qua **git worktree mới** `../aio2026-practice-uiux4`
(nhánh `feature/budget-planner-uiux-4`) — KHÔNG đụng nhánh `feature/budget-planner-ml-categorizer` đang dev.
PR vào develop. **Danh mục cây cha-con ĐÃ có sẵn trên develop** (buildTree + indent + tx_stats batch 3) → bỏ qua.

## Sự thật đã khảo sát (develop)

- **Wallets**: `api/wallets.py list_wallets` trả `list[WalletRead]` (id/space_id/name/type/balance), chưa có stats. `WalletRead` schema gọn. FE `Wallets.jsx` bảng cột name/type/balance/actions + dòng tổng số dư; có `formatAmount`. Transaction có `wallet_id` (nullable). Pattern aggregate: `func.count`/`func.sum` group_by (như Categories batch 3); `_period_range(period)` ở `services/budget.py` cho khoảng tháng.
- **Members** `Members.jsx`: bảng tên/email + dropdown vai trò; owner không dropdown; có `InviteMemberDialog` (nút mời). **Chưa có Avatar**.
- **CategoryChip.jsx**: chip màu theo `categoryColor`, **chưa có Tooltip**.
- **Goals.jsx**: card grid `xs=12 sm=6 md=4` → 1 mục desktop chỉ 1/3 rộng (review muốn rộng hơn khi ít mục).
- **IconButton** edit/delete: `size="small"` + icon 18px (~36px click) — review thấy nhỏ trên mobile.
- **RBAC**: list ví cho viewer OK (không cần role). Mini-stats không cần migration.

---

## Task 1 — Worktree + spec docs

- `git worktree add ../aio2026-practice-uiux4 -b feature/budget-planner-uiux-4 origin/develop`. Làm trong worktree (npm install riêng; pytest dùng venv chính).
- Spec `agent-os/specs/2026-06-15-1343-budget-planner-uiux-4/`.

## Task 2 — BE: mini-stats ví (aggregate runtime, TDD)

- `schemas/wallet.py WalletRead`: thêm `tx_count:int=0`, `tx_income:float=0.0`, `tx_expense:float=0.0` (tháng hiện tại).
- `api/wallets.py list_wallets`: aggregate Transaction theo `wallet_id`+`type` trong **tháng hiện tại** (`_period_range(date.today().strftime("%Y-%m"))`, `wallet_id IS NOT NULL`), build map → dựng `WalletRead` kèm count/income/expense. (Mẫu Categories batch 3.)
- **Test** `test_wallets.py`: tạo ví + giao dịch tháng này (thu/chi) gắn ví → list trả tx_count/income/expense đúng; giao dịch tháng khác/không ví → không tính.

## Task 3 — FE: hiển thị mini-stats ví

- `Wallets.jsx`: dưới tên ví (hoặc cột phụ) hiện caption "N giao dịch · +{thu} / −{chi} (tháng này)" khi `tx_count>0` (màu success/error cho thu/chi). i18n `wallets.txStats*`.

## Task 4 — FE: Thành viên + polish

- `Members.jsx`: thêm **MUI Avatar** (chữ cái đầu tên/email, màu nền nhẹ) cạnh tên; **Tooltip** trên hàng owner giải thích "Chủ sở hữu — không đổi vai trò"; đảm bảo nút "Mời thành viên" rõ (variant contained, không bị mờ khi đủ quyền).
- `CategoryChip.jsx`: bọc `<Tooltip title={name}>` (hiện tên đầy đủ khi cắt ngắn).
- `Goals.jsx`: card rộng hơn khi ít mục — `md={items.length === 1 ? 6 : 4}` (1 mục → nửa màn hình thay vì 1/3).
- **Accessibility nút thao tác**: bỏ `size="small"` (hoặc tăng padding) cho IconButton edit/delete ở `Wallets.jsx`/`Transactions.jsx` → vùng click ~40px; giữ `aria-label`.
- i18n vi/en cho text mới.

## Task 5 — Verify + giao nộp

- BE: `pytest` (203 + mới) + `ruff check` + **`ruff format --check`** (dùng venv chính cho worktree). FE: `npm test` + `npm run build`. JSON i18n hợp lệ.
- (Live alt-port tuỳ chọn — thay đổi build-safe + test phủ.)
- Commit/push `feature/budget-planner-uiux-4` → PR vào develop; CI 5 check. **Gỡ worktree sau khi merge.**

---

## Cấu trúc file (trong worktree)

```
backend/app/schemas/wallet.py              (WalletRead + tx_count/income/expense)
backend/app/api/wallets.py                 (list_wallets aggregate tháng này)
backend/tests/test_wallets.py              (test mini-stats)
frontend/src/pages/Wallets.jsx             (hiển thị mini-stats)
frontend/src/pages/Members.jsx             (avatar + tooltip + nút mời)
frontend/src/components/CategoryChip.jsx   (Tooltip)
frontend/src/pages/Goals.jsx               (card width)
frontend/src/pages/Transactions.jsx        (IconButton click area)
frontend/src/i18n/locales/{vi,en}.json     (wallets.txStats*, members.*)
```
Tái dùng: `_period_range` (budget service), `func.count/sum` group_by (Categories batch 3), `formatAmount`, MUI Avatar/Tooltip. Không migration.

## Standards áp dụng

- **api + testing (TDD)** — wallet stats aggregate runtime nhất quán Categories; test BE trước; giữ 203 pytest + 34 vitest xanh.
- **frontend/forms-ui** — avatar/tooltip; vùng click đạt a11y; i18n đầy đủ.
- **ci** — `ruff format --check` trước push ([[ci-ruff-format-check]]); không co-author ([[no-coauthor-commits]]); worktree không đụng nhánh khác.

## Verification (lệnh)

```bash
git worktree add ../aio2026-practice-uiux4 -b feature/budget-planner-uiux-4 origin/develop
VENV=/Users/qcinsced/Documents/GitHub/aio2026-practice/conquer/budget-planner/backend/.venv/bin
cd ../aio2026-practice-uiux4/conquer/budget-planner/backend
$VENV/python -m pytest -q && $VENV/ruff check . && $VENV/ruff format --check .
cd ../frontend && npm install && npm test && npm run build
```
Kịch bản: mỗi ví hiện số giao dịch + thu/chi tháng này · Thành viên có avatar + tooltip owner + nút mời rõ · badge danh mục có tooltip · Goals card rộng hơn khi 1 mục · nút thao tác dễ bấm. Test BE+FE + build + format xanh.
