# References for Mở rộng test Frontend

## Đối tượng test (hợp đồng)

- `src/components/ConfirmDialog.jsx` (open/title/message/onCancel/onConfirm/confirming/confirmLabel).
- `src/components/WalletFormDialog.jsx` (submit khi name≠""; payload {name,type,balance}).
- `src/components/ContributeDialog.jsx` (sources loại goal.wallet_id; amount>0; {from_wallet_id,amount}).
- `src/components/TransactionFormDialog.jsx` (nạp `api/categories.listCategories` + `api/wallets.listWallets`).
- `src/components/{CategoryChip,PageHeader,ComingSoon}.jsx` (smoke).
- `src/auth/AuthContext.jsx` (`useAuth`/`AuthProvider`; login→`api/auth.login`+`getMe`+`api/spaces.listSpaces`; logout→`clearAuth`).

## Hạ tầng test

- `src/i18n/index.js` — default `i18n` (vi). `src/theme/ColorModeContext.jsx` — `ColorModeProvider`.
- `src/test/setup.js` (đã có), `vite.config.js` test block (đã có). Thêm `src/test/utils.jsx`.
- Mock: `api/auth.js`, `api/spaces.js`, `api/categories.js`, `api/wallets.js`.
