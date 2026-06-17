# Mở rộng test Frontend — Shaping Notes

## Scope

Thêm test FE: dialog không-fetch (ConfirmDialog, WalletFormDialog, ContributeDialog), component đơn giản (CategoryChip, PageHeader, ComingSoon), dialog có-fetch (TransactionFormDialog mock api), AuthContext (login/logout). Render với providers + user-event + mock api.

## Decisions

- Phủ cả 4 nhóm. Dùng `i18n.t(key)` cho text mong đợi (bền với wording). Không đổi code app.
- test-utils `renderWithProviders` (i18n + MemoryRouter + ColorModeProvider).

## Context

- **Visuals:** None.
- **References:** `i18n/index.js` (instance vi), `theme/ColorModeContext.jsx` (ColorModeProvider), components dialog/đơn giản, `auth/AuthContext.jsx` (+ api/auth, api/spaces), `api/{categories,wallets}.js`.
- **Product alignment:** Chất lượng — phủ test FE.

## Standards Applied

- **testing** — providers thật; mock biên (vi.mock api); user-event; text qua i18n.t().
- **naming/coding-style** — chỉ devDeps test; không đổi app; `*.test.jsx` cạnh nguồn.
- **ci** — chạy trong job `frontend-test` sẵn có.
