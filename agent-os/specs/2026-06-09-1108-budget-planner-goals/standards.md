# Standards for Saving Goals

---

## api/fastapi

- RBAC: đọc viewer+; CRUD + góp = member+ (`require_min_role`). Lọc `space_id`.
- `transfer_funds` lỗi → 400 (same_wallet) / 404 (wallet_not_found). Audit `goal.deleted`/`goal.contribute`.

## testing/tdd

- Test trước: CRUD + RBAC; GET kèm percent/saved đúng; contribute (ví nguồn -x, ví tiết kiệm +x, percent tăng); from==to 400; ví lạ 404; cô lập space.
- **Chạy lại test_wallets** sau khi refactor transfer route → đảm bảo không vỡ.

## database/migrations

- Một revision mới qua autogenerate (down_revision = notifications `0adbc61de675`); review; verify no-op.

## naming / coding-style

- Field `snake_case`; `transfer_funds(db, space_id, from_id, to_id, amount)` thuần (di chuyển số dư, raise ValueError; **không** commit/audit — route lo). YAGNI.
