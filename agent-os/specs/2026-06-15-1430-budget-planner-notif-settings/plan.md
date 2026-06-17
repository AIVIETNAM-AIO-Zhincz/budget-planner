# Budget Planner — Settings batch (Cài đặt thông báo + tiền tệ)

## Context

Mục review chưa làm ở trang Cài đặt: **thiếu section bật/tắt thông báo** và **section tiền tệ/không gian
nên ở đầu trang** (vì ảnh hưởng toàn app). Batch này thêm **Cài đặt thông báo** (bật/tắt 3 loại: vượt
ngân sách / mời thành viên / định kỳ chạy — per-space, dùng chung) và **đưa card Không gian/tiền tệ lên
đầu**. BE gate thông báo theo cờ + FE section Switch.

**Quyết định đã chốt:** prefs **per-space** (3 cờ boolean trên Space, mặc định bật). Gate **tập trung
trong `add_notification`** (1 chỗ phủ cả 3 nguồn). Worktree **mới** `../aio2026-practice-notif` từ develop
(nhánh `feature/budget-planner-notif-settings`) — KHÔNG đụng nhánh đang dev. **Migration #8**
(down_revision = `8edb758c6885`). PR vào develop.

## Sự thật đã khảo sát (develop)

- **`services/notification.py add_notification(db, space_id, type_, message)`** = chokepoint duy nhất (chỉ `db.add`). 3 type: `budget.exceeded` (event handler), `member.invited` (api/members inline), `recurring.ran` (api/recurring inline). → gate ở đây phủ cả 3.
- **Model Space**: id/name/owner_id/currency/created_at → thêm `notify_budget`/`notify_member`/`notify_recurring` (Boolean, default True, `server_default=sa.true()`). Mẫu server_default: need_level/fund_type.
- **`schemas/space.py`**: `SpaceUpdate` (partial) + `SpaceRead` (id/name/owner_id/currency/role). **`api/spaces.py PATCH /spaces/{id}`** (admin+, dùng `setattr`-loop → tự nhận field mới). SpaceRead build thủ công ở **3 chỗ** (list/create/update) → thêm 3 cờ vào cả 3.
- **FE `Settings.jsx`**: `SettingCard`, thứ tự Hồ sơ→Hồ sơ tài chính→Đổi mật khẩu→**Không gian** (CurrencySelect, sửa khi owner/admin)→Tạo không gian. `currentSpace = spaces.find(...)` đã có cờ qua SpaceRead. `api/spaces.js updateSpace(id, patch)`. `useAuth` có spaces + reload.
- **Alembic head** `8edb758c6885` (user_profiles). Test: `test_notifications.py` (tạo vượt/mời/định kỳ → assert notification), `test_spaces.py` (PATCH owner 200 / member 403 / cross-space 404).

---

## Task 1 — Worktree + spec docs

- `git worktree add ../aio2026-practice-notif -b feature/budget-planner-notif-settings origin/develop`. Làm trong worktree (npm install riêng; pytest dùng venv chính, xoá `$TMPDIR/bp_test.db` nếu lỗi env).
- Spec `agent-os/specs/2026-06-15-1430-budget-planner-notif-settings/`.

## Task 2 — BE: cờ thông báo trên Space + gate + migration (TDD)

- **Model**: Space thêm 3 cột `notify_budget/notify_member/notify_recurring` (Boolean, default True, server_default true).
- **Migration #8** `add_notification_prefs_to_spaces` (down_revision `8edb758c6885`): add 3 column + downgrade drop. Ruff-clean + format. Áp DB + no-op.
- **Schema** `space.py`: `SpaceUpdate` + 3 cờ `bool | None = None`; `SpaceRead` + 3 cờ `bool`. Thêm vào 3 chỗ build SpaceRead (`api/spaces.py` list/create/update).
- **Gate** `services/notification.py`: map `_NOTIFY_FLAG = {"budget.exceeded":"notify_budget","member.invited":"notify_member","recurring.ran":"notify_recurring"}`; trong `add_notification`: nếu type khớp map → `space = db.get(Space, space_id)`; nếu `space and not getattr(space, flag)` → **return** (không tạo). Không khớp map → tạo như cũ.
- **Test**: `test_notifications.py` — PATCH /spaces tắt `notify_budget` → gây vượt ngân sách → KHÔNG có notification `budget.exceeded`; bật lại → có. `test_spaces.py` — PATCH cờ → SpaceRead trả đúng.

## Task 3 — FE: Settings — section thông báo + đưa tiền tệ lên đầu

- `Settings.jsx`: **di chuyển card "Không gian hiện tại"** (tiền tệ) lên **đầu** Stack. Thêm card **"Cài đặt thông báo"** (3 `Switch`: vượt ngân sách / mời thành viên / định kỳ) đọc từ `currentSpace.notify_*`, onChange → `updateSpace(spaceId, { notify_x })` + `reload()` (useAuth) + toast; chỉ bật được khi owner/admin (else readonly + tooltip).
- `api/spaces.js`: không đổi (updateSpace nhận patch). i18n `settings.notifications.*`.

## Task 4 — Verify + giao nộp

- BE: `pytest` (+ mới) + `ruff check` + **`ruff format --check`** (venv chính; xoá bp_test.db nếu env lỗi — CI là chuẩn). `alembic upgrade head` áp #8 + no-op. FE: `npm test` (34) + `npm run build`. JSON i18n hợp lệ.
- Commit/push `feature/budget-planner-notif-settings` → PR vào develop; CI 5 check. **Gỡ worktree sau khi merge.**

---

## Cấu trúc file (trong worktree)

```
backend/app/models/__init__.py             (Space + 3 cờ notify_*)
backend/app/schemas/space.py               (SpaceUpdate/SpaceRead + 3 cờ)
backend/app/api/spaces.py                  (3 chỗ build SpaceRead + 3 cờ)
backend/app/services/notification.py       (gate theo cờ)
backend/alembic/versions/<rev>_add_notification_prefs_to_spaces.py  (migration #8)
backend/tests/{test_notifications,test_spaces}.py  (test)
frontend/src/pages/Settings.jsx            (section thông báo + reorder currency lên đầu)
frontend/src/i18n/locales/{vi,en}.json     (settings.notifications.*)
```
Tái dùng: `add_notification` (chokepoint), `setattr`-loop (space update), `SettingCard`/`Switch`/`updateSpace`, `useAuth reload`, pattern migration `batch_alter_table`.

## Standards áp dụng

- **database/migrations** — migration #8 upgrade/downgrade + server_default; áp + no-op.
- **api + rbac + testing (TDD)** — PATCH cờ cần admin+ (như currency); cô lập space; gate 1 chỗ; test BE trước; giữ test cũ + 34 vitest.
- **frontend/forms-ui** — Switch + readonly cho viewer; i18n; tiền tệ lên đầu.
- **ci** — `ruff format --check` trước push ([[ci-ruff-format-check]]); no co-author; worktree riêng. Env test local: xoá `$TMPDIR/bp_test.db` nếu lỗi ([[stale-test-db-bp-test]]).

## Verification (lệnh)

```bash
git worktree add ../aio2026-practice-notif -b feature/budget-planner-notif-settings origin/develop
VENV=/Users/qcinsced/Documents/GitHub/aio2026-practice/conquer/budget-planner/backend/.venv/bin
cd ../aio2026-practice-notif/conquer/budget-planner/backend
rm -f "$TMPDIR/bp_test.db"; BP_DATABASE_URL="sqlite:///./bp.db" $VENV/alembic upgrade head
$VENV/python -m pytest -q && $VENV/ruff check . && $VENV/ruff format --check .
cd ../frontend && npm install && npm test && npm run build
```
Kịch bản: trang Cài đặt — card Tiền tệ/Không gian ở đầu · section "Cài đặt thông báo" 3 Switch; tắt "vượt ngân sách" → gây vượt → không có thông báo; bật lại → có. Migration áp + no-op. Test BE+FE + build + format xanh.
