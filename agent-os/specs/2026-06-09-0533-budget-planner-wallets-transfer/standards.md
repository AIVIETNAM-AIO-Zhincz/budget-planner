# Standards for Wallets + Transfer

---

## api/fastapi

- RBAC server-side: đọc ví = viewer+; CRUD ví = admin+; transfer = member+ (`require_min_role`).
- HTTP code: 400 (transfer sai: same wallet/amount≤0), 403, 404 (ví khác space), 422.
- Mọi truy vấn lọc `space_id`. Audit `wallet.transfer`, `wallet.deleted` kèm `actor_id`.

## testing/tdd

- Viết test trước: CRUD ví, RBAC 403, cô lập 404, transfer chỉnh số dư, đối soát số dư giao dịch (create/edit/delete/đổi ví).
- Test độc lập, fixture `owner`/`make_member`/`register`.

## naming / coding-style

- Field `snake_case` (`wallet_id`, `from_wallet_id`). Service tính số dư là **hàm thuần** dễ test. YAGNI.

## database/migrations

- Không revision mới (Wallet + Transaction.wallet_id đã có). Verify autogenerate no-op.
