# Budget Planner — Dọn trùng lặp backend (DRY refactor)

## Context

Sau 19 PR, backend có vài mẫu lặp gây nhiễu & dễ lệch khi sửa: `_get_owned` (lấy bản ghi + 404)
ở **7 router**, `_fmt` (định dạng tiền VN) ở **2 nơi**, mapping lỗi transfer→HTTP ở **2 router**,
tạo `AuditLog(...)` ở **8 chỗ**. Spec này gom về helper dùng chung. **Pure refactor — hành vi
KHÔNG đổi** (status code/giá trị trả về giữ nguyên); **139 pytest + ruff là lưới an toàn**.

**Quyết định đã chốt:**
- Dọn toàn diện: `format_vnd` · `transfer_http_error` · `get_owned_or_404` · `write_audit`.
- Giữ **call site ổn định**: `_get_owned` mỗi router thành wrapper 1 dòng gọi helper chung (ít churn, dễ review).
- Không model/migration; không đổi FE (hợp đồng API y nguyên). Nhánh `feature/budget-planner-dry` từ `develop`. Test cũ phải xanh; thêm test nhỏ cho helper.

## Sự thật đã khảo sát

- `_get_owned` (mẫu `db.get(Model,id)` + 404 nếu None/khác space): `app/api/{budgets,categories,goals,notifications,recurring,transactions,wallets}.py`.
- `_fmt` = `f"{int(v):,}".replace(",", ".")`: `app/services/assistant.py`, `app/events/handlers.py`.
- Mapping lỗi `transfer_funds` (`same_wallet`→400, `wallet_not_found`→404): `app/api/wallets.py`, `app/api/goals.py` (lõi ở `app/services/wallet.py`).
- `AuditLog(space_id, actor_id, action, target)`: `app/api/{budgets,categories,goals,members,recurring,transactions,wallets}.py`, `app/events/handlers.py`.
- Tests chỉ assert **status code** (không assert message) → an toàn gom message.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-1345-budget-planner-dry/`.

## Task 2 — Tạo helper dùng chung (+ test)

- `app/core/format.py` (mới): `format_vnd(value: float) -> str` — `f"{int(value):,}".replace(",", ".")`.
- `app/api/_common.py` (mới — helper tầng API):
  - `get_owned_or_404(db, model, obj_id, space_id, detail="Không tìm thấy") -> model` — `db.get` + 404 nếu None/`space_id` lệch.
  - `write_audit(db, space_id, actor_id, action, target="") -> None` — `db.add(AuditLog(...))` (không commit).
  - `raise_transfer_error(err: ValueError, *, same_msg) -> NoReturn` — `same_wallet`→400(`same_msg`), còn lại→404("Không tìm thấy ví").
- `tests/test_common.py` (mới): `format_vnd` (vài giá trị); `get_owned_or_404` (trả đúng / 404 khi None / 404 khi khác space) dùng model thật + session test.

## Task 3 — Thay thế các chỗ lặp (pure refactor)

- **format**: `assistant.py` + `handlers.py` bỏ `_fmt`, import & dùng `format_vnd`.
- **_get_owned** (7 router): rút thân hàm còn 1 dòng `return get_owned_or_404(db, Model, obj_id, space_id, "<detail cũ>")` — giữ nguyên mọi call site `_get_owned(...)`.
- **audit** (8 chỗ): đổi `db.add(AuditLog(...))` → `write_audit(db, space_id=..., actor_id=..., action=..., target=...)` (gồm `handlers.audit_transaction_created` dùng session riêng — truyền session vào).
- **transfer error**: `wallets.transfer` + `goals.contribute` thay khối `except ValueError` bằng `raise_transfer_error(err, same_msg="...")` (giữ message "Hai ví phải khác nhau" / "Ví nguồn phải khác ví tiết kiệm"; 404 dùng default).

## Task 4 — Verify + giao nộp

- `ruff check app tests` + `ruff format` sạch; **`pytest -q` xanh (139 + helper mới)** — chứng minh hành vi không đổi.
- `alembic` autogenerate **no-op** (không đổi model).
- (Không cần FE build — hợp đồng API không đổi; chạy nhanh `npm run build` để chắc chắn.)
- Commit/push/PR vào `develop` sau khi người dùng xác nhận.

---

## Cấu trúc file

```
backend/app/core/format.py · app/api/_common.py      (mới)
backend/tests/test_common.py                          (mới)
backend/app/services/assistant.py · events/handlers.py (sửa — format_vnd + write_audit)
backend/app/api/{budgets,categories,goals,notifications,recurring,transactions,wallets,members}.py
   (sửa — get_owned_or_404 wrapper + write_audit + transfer error helper)
```
Tái dùng: `AuditLog` model, `transfer_funds` (đã có), `HTTPException`. Không thêm dependency.

## Standards áp dụng

- **naming/coding-style** — DRY; helper thuần/đặt đúng tầng (format ở core, helper raise-HTTP ở api). YAGNI.
- **testing/tdd** — thêm test cho helper; **toàn bộ test cũ phải xanh** (regression — bằng chứng pure refactor).
- **api/fastapi** — status code & hợp đồng không đổi; message có thể thống nhất (không bị test ràng buộc).
- **database/migrations** — không model mới ⇒ no-op.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend && ruff check app tests && pytest -q   # 139+ xanh = không đổi hành vi
# alembic autogenerate no-op ; (tuỳ chọn) cd ../frontend && npm run build
```
Kịch bản: toàn bộ test cũ xanh sau refactor ⇒ hành vi y nguyên; code gọn hơn (ít lặp).
