# UI/UX batch 4 — Shaping Notes

## Scope

Mini-stats từng ví (defer batch 3) + Thành viên avatar/tooltip/mời + polish nhỏ (tooltip badge, card width, vùng click). FE + 1 fix BE (aggregate runtime, không migration). Worktree mới từ develop.

## Decisions

- Worktree `../aio2026-practice-uiux4`, nhánh `feature/budget-planner-uiux-4` từ develop. PR vào develop. Không đụng nhánh đang dev.
- Wallet stats: aggregate tháng hiện tại theo wallet_id (tx_count/income/expense), thêm vào WalletRead (như Categories batch 3).
- Danh mục cây cha-con ĐÃ có trên develop → bỏ qua.

## Context

- **Visuals:** review chữ của người dùng.
- **References:** `api/wallets.py`, `schemas/wallet.py`, `services/budget.py _period_range`, `api/categories.py` (mẫu aggregate batch 3), `Members.jsx`, `CategoryChip.jsx`, `Goals.jsx`, `Wallets.jsx`.
- **Product alignment:** UX/accessibility.

## Standards Applied

- **api + testing (TDD)** — wallet stats nhất quán Categories; test BE trước.
- **frontend/forms-ui** — avatar/tooltip; vùng click a11y; i18n.
- **ci** — `ruff format --check` trước push ([[ci-ruff-format-check]]); no co-author; worktree riêng.
