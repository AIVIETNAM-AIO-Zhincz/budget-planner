# Budget Planner — Saving Goals (mục tiêu tiết kiệm)

## Context

Thêm **mục tiêu tiết kiệm**: đặt đích (target) gắn với một **ví tiết kiệm**; tiến độ = số dư ví đó / target; "Góp" = **chuyển tiền** từ ví nguồn → ví tiết kiệm (đúng dòng tiền, tái dùng transfer). Cần model `Goal` + migration #3. Full-stack.

**Quyết định đã chốt (Mô hình "ví tiết kiệm + chuyển tiền"):**
- `Goal{name, target_amount, wallet_id (ví tiết kiệm), deadline?}`. Tiến độ = `wallet.balance / target` (soi ví, **không** lưu saved riêng).
- "Góp x" = transfer `from_wallet → goal.wallet` (cập nhật cả 2 số dư), không tạo giao dịch.
- RBAC: CRUD + góp = member+. Nhánh `feature/budget-planner-goals` từ `develop`. TDD.

## Hợp đồng hiện có

- `app/api/wallets.py` `transfer` route — logic: `from==to → 400`, `_get_owned` cô lập, `src.balance-=amount; dst.balance+=amount`, audit `wallet.transfer`. **Sẽ rút lõi ra service dùng chung.**
- `app/api/budgets.py` `_to_read` — mẫu dựng Read kèm tiến độ (spent/percent) từ truy vấn phụ → áp cho GoalRead.
- `app/models` (`_uuid`/`_now`, Mapped, `__all__`), `app/rbac` (`require_min_role`/`get_current_space_id`), `alembic` (autogenerate, head = `0adbc61de675`).
- FE: `pages/Wallets.jsx`/`Budgets.jsx` (trang CRUD + progress), `TransferDialog`/`WalletFormDialog` (mẫu), `nav.js`, `App.jsx`, `TopBar.jsx`, `BrandDialog`/`ConfirmDialog`, `formatAmount`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-1108-budget-planner-goals/`.

## Task 2 — Backend: model + migration + service + router (TDD)

- **Model** `Goal` (`app/models/__init__.py`): `id, space_id(FK,index), name(String255), target_amount(Float), wallet_id(FK wallets), deadline(Date,nullable), created_at`. Thêm `__all__`.
- **Migration**: autogenerate `add goals` (down_revision `0adbc61de675`) → bảng `goals`; review; upgrade head.
- **Service** `app/services/wallet.py` (bổ sung) `transfer_funds(db, space_id, from_id, to_id, amount) -> tuple[Wallet, Wallet]`: `from==to` → `ValueError("same_wallet")`; ví thiếu/khác space → `ValueError("wallet_not_found")`; trừ/cộng số dư; trả (src,dst). **Refactor** `wallets.py` transfer route gọi service (giữ 400/404 + audit `wallet.transfer`; test_wallets phải vẫn xanh).
- `app/schemas/goal.py`: `GoalCreate(name, target_amount>0, wallet_id, deadline?)`, `GoalUpdate(partial)`, `Contribute(from_wallet_id, amount>0)`, `GoalRead(id, space_id, name, target_amount, wallet_id, wallet_name, saved_amount, percent, deadline)`.
- `app/api/goals.py` (`prefix="/goals"`): GET "" (viewer+, kèm tiến độ qua `_to_read`: saved=ví.balance, percent=min(100, saved/target*100), wallet_name); POST "" (member+, kiểm wallet thuộc space); GET/{id}; PATCH/{id} (member+); DELETE/{id} (member+, audit `goal.deleted`); **POST "/{id}/contribute"** (member+) → `transfer_funds(from=payload.from_wallet_id, to=goal.wallet_id, amount)` + audit `goal.contribute` + commit → GoalRead. Wire `main.py`.
- `tests/test_goals.py`: CRUD + RBAC; tạo goal gắn ví; GET kèm percent/saved đúng; contribute chuyển tiền (ví nguồn -x, ví tiết kiệm +x, percent tăng); from==to 400; ví lạ 404; cô lập space. (+ chạy lại test_wallets sau refactor.)

## Task 3 — FE api + nav + route

- `src/api/goals.js`: `listGoals`, `createGoal`, `updateGoal`, `deleteGoal`, `contribute(id, {from_wallet_id, amount})`.
- `src/constants/nav.js`: thêm `goals` (icon cờ/đích) nhóm "manage"; `App.jsx` lazy route `/goals`; TopBar title; i18n `nav.goals`.

## Task 4 — FE Trang Mục tiêu + dialog

- `src/pages/Goals.jsx`: lưới card mỗi mục tiêu (tên · ví tiết kiệm · `LinearProgress` percent · `saved/target` · deadline · badge "Hoàn thành" nếu ≥100%) + nút **Thêm** (member+) + **Góp** (member+) + sửa/xoá (ConfirmDialog). skeleton/empty/error/snackbar. RBAC ẩn nút < member.
- `src/components/GoalFormDialog.jsx` (BrandDialog): name, target_amount, wallet (select ví tiết kiệm — danh sách ví), deadline (DatePicker optional).
- `src/components/ContributeDialog.jsx`: chọn ví nguồn (khác ví tiết kiệm) + số tiền → `contribute`. Hiển thị lỗi API (số dư/ví).

## Task 5 — i18n

`vi.json`/`en.json`: `nav.goals`, `pages.goals`/`goalsDesc`, `goals.*` (add, contribute, completed, savedOf, deadline, noDeadline, colName, created/updated/deleted/contributed, deleteTitle/Confirm, empty, loadError/saveError, form{name,target,wallet,deadline}, contributeForm{title,from,amount,submit,sameWallet,amountRequired}). `t()`.

## Task 6 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh (gồm test_wallets sau refactor); `alembic upgrade head` OK; autogenerate **no-op**.
- FE: `npm run build` xanh.
- Live (alembic upgrade DB demo + restart + dev): tạo ví "Quỹ du lịch", tạo goal target gắn ví đó → góp từ Tiền mặt → ví nguồn giảm, ví tiết kiệm tăng, progress tăng; đạt 100% → badge Hoàn thành.

---

## Cấu trúc file

```
backend/app/models/__init__.py              (sửa — Goal + __all__)
backend/alembic/versions/xxxx_add_goals.py   (mới — migration #3)
backend/app/services/wallet.py              (sửa — transfer_funds)
backend/app/api/wallets.py                  (sửa — transfer route dùng service)
backend/app/schemas/goal.py · api/goals.py   (mới) · main.py (wire)
backend/tests/test_goals.py                 (mới)
frontend/src/api/goals.js · pages/Goals.jsx · components/GoalFormDialog.jsx · components/ContributeDialog.jsx  (mới)
frontend/src/constants/nav.js · App.jsx · layout/TopBar.jsx · i18n/locales/{vi,en}.json  (sửa)
```
Tái dùng: `transfer_funds` (rút từ wallets), `require_min_role`/`get_current_space_id`, `_to_read` mẫu (budgets), `TransferDialog`/`WalletFormDialog` mẫu, `LinearProgress`, `formatAmount`.

## Standards áp dụng

- **api/fastapi** — RBAC (đọc viewer+, CRUD/góp member+); lọc space_id; 400/404; audit `goal.deleted`/`goal.contribute`.
- **testing/tdd** — test trước CRUD/contribute/biên (same/404) + tiến độ; **không phá test_wallets** sau refactor.
- **database/migrations** — một revision mới qua autogenerate, review; verify no-op.
- **naming/coding-style** — field `snake_case`; `transfer_funds` thuần (không commit/audit — route lo); YAGNI.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && alembic upgrade head && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live: alembic upgrade trên budget_planner.db ; restart uvicorn :8000 ; dev :5173
```
Kịch bản: tạo ví tiết kiệm + goal → góp từ ví nguồn → 2 số dư đổi + progress tăng → đạt 100% badge.
