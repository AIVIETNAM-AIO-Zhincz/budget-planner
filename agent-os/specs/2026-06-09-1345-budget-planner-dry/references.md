# References for Dọn trùng lặp backend (DRY)

## Chỗ lặp (rút về helper)

- `_get_owned` (db.get + 404): `app/api/budgets.py`, `categories.py`, `goals.py`, `notifications.py`, `recurring.py`, `transactions.py`, `wallets.py` → `get_owned_or_404`.
- `_fmt` (định dạng tiền VN): `app/services/assistant.py`, `app/events/handlers.py` → `core/format.format_vnd`.
- Mapping lỗi `transfer_funds`: `app/api/wallets.py` (transfer), `app/api/goals.py` (contribute) → `raise_transfer_error`. Lõi service: `app/services/wallet.transfer_funds`.
- `AuditLog(...)`: `app/api/{budgets,categories,goals,members,recurring,transactions,wallets}.py`, `app/events/handlers.audit_transaction_created` → `write_audit`.

## Tái dùng

- `app/models.AuditLog`, `app/services/wallet.transfer_funds`, `fastapi.HTTPException`/`status`.
- `tests/conftest.py` (`owner`, engine/session test) cho `test_common.py`.
