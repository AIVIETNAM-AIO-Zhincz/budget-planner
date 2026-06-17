# References for UI/UX batch 4

## Mini-stats ví
- `backend/app/schemas/wallet.py` (WalletRead) → +tx_count/tx_income/tx_expense.
- `backend/app/api/wallets.py list_wallets` → aggregate (mẫu `api/categories.py` batch 3) + `services/budget.py _period_range`.
- `backend/tests/test_wallets.py` (helper _wallet, owner). `frontend/src/pages/Wallets.jsx` (bảng + formatAmount).

## Thành viên + polish
- `frontend/src/pages/Members.jsx` (bảng + InviteMemberDialog) → MUI Avatar + Tooltip.
- `frontend/src/components/CategoryChip.jsx` → Tooltip.
- `frontend/src/pages/Goals.jsx` (grid card width) · `frontend/src/pages/Transactions.jsx` (IconButton).
- `frontend/src/i18n/locales/{vi,en}.json`.
