# Budget Planner — Recurring Transactions (giao dịch định kỳ)

## Context

Roadmap Phase 4: "giao dịch định kỳ". Spec này thêm **mẫu giao dịch định kỳ** (ngày/tuần/tháng) + cơ chế **sinh giao dịch tự động** khi mở app (catch-up các kỳ bị lỡ tới hôm nay) và nút "Chạy ngay". Đây là spec **đầu tiên cần model + migration mới** (`recurring_rules`). Full-stack.

**Quyết định đã chốt:**
- Sinh giao dịch: **tự động khi mở app** (FE gọi `POST /recurring/run` lúc vào shell + đổi space) + **nút "Chạy ngay"**. App chưa có scheduler → catch-up theo `next_run <= today`.
- Tần suất: **daily / weekly / monthly** (mỗi kỳ 1 lần).
- RBAC: đọc viewer+, CRUD/run = member+. Catch-up nhiều kỳ tới hôm nay; hết `end_date` → tắt rule.
- **Cần migration** (Alembic autogenerate). Nhánh `feature/budget-planner-recurring` từ `develop`. TDD.

## Hợp đồng hiện có

- `app/models/__init__.py` — `Transaction`, `Wallet`; helper `_uuid`/`_now`; pattern `Mapped[...]`.
- `app/services/wallet.py` — `apply_effect(db, space, wallet_id, type, amount)` (cập nhật số dư) → tái dùng khi sinh giao dịch.
- `app/api/categories.py`/`budgets.py` — mẫu CRUD (RBAC route-level, 404 cô lập, audit).
- `alembic/` — `env.py` autogenerate từ `Base.metadata`; init revision `5fb2d5eb9124`.
- FE: `pages/Wallets.jsx`/`Budgets.jsx` (mẫu trang CRUD), `TransactionFormDialog` (Autocomplete danh mục, select ví), `nav.js`, `App.jsx`, `AppLayout.jsx` (useAuth → spaceId), `BrandDialog`/`ConfirmDialog`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-0909-budget-planner-recurring/`.

## Task 2 — Backend: model + migration + service + router (TDD)

- **Model** `RecurringRule` (`app/models/__init__.py`): `id, space_id(FK spaces,index), name, amount(Float), type(String8 "expense"), category_name(String255 ""), wallet_id(FK wallets,nullable), frequency(String8 "monthly"), start_date(Date), next_run(Date), end_date(Date,nullable), active(Bool True), created_at`. Thêm vào `__all__`.
- **Migration**: `alembic revision --autogenerate -m "add recurring_rules"` → review tạo bảng `recurring_rules`; `alembic upgrade head`.
- `app/schemas/recurring.py`: `RecurringBase(name, amount gt 0, type pattern, category_name, wallet_id|None, frequency pattern "^(daily|weekly|monthly)$", start_date, end_date|None)`, `RecurringCreate`, `RecurringUpdate(partial)`, `RecurringRead(from_attributes; + id, space_id, next_run, active)`.
- `app/services/recurring.py` (hàm thuần `advance` + `run_due`):
  - `advance(d, frequency)`: daily +1d, weekly +7d, monthly +1 tháng (clamp ngày cuối tháng).
  - `run_due(db, space_id, today) -> int`: với mỗi rule active của space, `while next_run <= today và (end_date None hoặc next_run <= end_date)`: tạo `Transaction(date=next_run, ...)` + `apply_effect` (số dư ví) + advance `next_run`; nếu vượt `end_date` → `active=False`. Trả số giao dịch đã tạo.
- `app/api/recurring.py` (`prefix="/recurring"`): GET "" (viewer+); POST "" (member+, `next_run=start_date`); GET/{id}; PATCH/{id} (member+); DELETE/{id} (member+, audit `recurring.deleted`); **POST "/run"** (member+) → `{"created": run_due(db, space, date.today())}`. Wire `main.py`.
- `tests/test_recurring.py`: CRUD + RBAC; `advance` 3 tần suất (+clamp tháng); `run` sinh đúng số kỳ catch-up + advance `next_run` + cập nhật số dư ví; `end_date` tắt rule; cô lập space.

## Task 3 — FE api + nav + route + auto-run

- `src/api/recurring.js`: `listRecurring`, `createRecurring`, `updateRecurring`, `deleteRecurring`, `runRecurring()`.
- `src/constants/nav.js`: thêm `recurring` (icon đồng hồ/lặp) nhóm "manage"; `App.jsx` lazy route `/recurring`; TopBar title; i18n `nav.recurring`.
- `src/layout/AppLayout.jsx`: `useEffect(() => { runRecurring().catch(()=>{}); }, [spaceId])` — tự sinh khi vào shell + đổi space (fire-and-forget).

## Task 4 — FE Trang Định kỳ + form

- `src/pages/Recurring.jsx`: bảng (tên · số tiền · loại · tần suất · kỳ kế · trạng thái) + nút **Thêm** (member+) + **"Chạy ngay"** (gọi `runRecurring` → toast "đã tạo N" → refetch) + sửa/xoá (`ConfirmDialog`). skeleton/empty/error/snackbar. RBAC ẩn nút nếu < member.
- `src/components/RecurringFormDialog.jsx` (BrandDialog): name, amount, type (ToggleButton), category (Autocomplete danh mục), wallet (select), frequency (select daily/weekly/monthly), start_date (DatePicker), end_date (DatePicker optional). Mô phỏng `TransactionFormDialog`.

## Task 5 — i18n

`vi.json`/`en.json`: `nav.recurring`, `pages.recurring`/`recurringDesc`, `recurring.*` (add, runNow, ranDone, colName/amount/type/frequency/nextRun/active, frequencies {daily,weekly,monthly}, form {name,amount,type,category,wallet,frequency,start,end}, created/updated/deleted, deleteTitle/Confirm, empty, loadError/saveError). `t()`.

## Task 6 — Verify

- Backend: `ruff check app tests` + `pytest -q` xanh; `alembic upgrade head` OK; **autogenerate sau migration ⇒ no-op** (model↔migration khớp).
- FE: `npm run build` xanh.
- Live (restart backend + dev): tạo rule monthly start_date quá khứ → "Chạy ngay" sinh các kỳ tới hôm nay (số dư ví/giao dịch cập nhật); rule daily; end_date tắt đúng; mở app tự chạy.

---

## Cấu trúc file

```
backend/app/models/__init__.py             (sửa — RecurringRule + __all__)
backend/alembic/versions/xxxx_add_recurring_rules.py  (mới — migration)
backend/app/schemas/recurring.py · services/recurring.py · api/recurring.py  (mới)
backend/app/main.py                         (sửa — include recurring)
backend/tests/test_recurring.py             (mới)
frontend/src/api/recurring.js               (mới)
frontend/src/pages/Recurring.jsx · components/RecurringFormDialog.jsx  (mới)
frontend/src/layout/AppLayout.jsx · constants/nav.js · App.jsx · layout/TopBar.jsx  (sửa)
frontend/src/i18n/locales/vi.json · en.json (sửa)
```
Tái dùng: `apply_effect` (số dư ví), `require_min_role`, mẫu CRUD categories/budgets, `TransactionFormDialog`/`ConfirmDialog`/`BrandDialog`, `formatAmount`.

## Standards áp dụng

- **api/fastapi** — RBAC (đọc viewer+, CRUD/run member+); HTTP code; lọc space_id; audit xoá.
- **testing/tdd** — test trước `advance`/`run_due`/CRUD; deterministic (truyền `today`); happy + biên (catch-up, end_date).
- **database/migrations** — **một revision mới** qua `--autogenerate`, review trước; `env.py` đã trỏ metadata; verify autogenerate sau đó "no changes".
- **naming/coding-style** — field `snake_case`; service hàm thuần; YAGNI (không scheduler nền).

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && alembic upgrade head && ruff check app tests && pytest -q
cd ../frontend && npm run build
# live: restart uvicorn :8000 ; dev :5173 — chú ý chạy alembic upgrade trên DB demo
```
Kịch bản: tạo rule định kỳ · "Chạy ngay" sinh catch-up · số dư/giao dịch cập nhật · auto khi mở app.
