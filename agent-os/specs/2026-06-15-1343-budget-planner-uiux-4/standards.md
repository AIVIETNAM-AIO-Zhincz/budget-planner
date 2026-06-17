# Standards for UI/UX batch 4

---

## api + testing (TDD)

- Wallet mini-stats aggregate runtime (func.count/sum group_by wallet_id, tháng hiện tại) — nhất quán pattern Categories batch 3. Thêm field optional vào WalletRead (default 0) → không phá test cũ. Viết test BE trước. Giữ 203 pytest + 34 vitest.

## frontend/forms-ui

- MUI Avatar (initials) + Tooltip; vùng click nút thao tác ~40px (a11y); card width responsive; i18n vi/en đầy đủ.

## ci

- `ruff check .` + `ruff format --check .` trước push ([[ci-ruff-format-check]]). Không Co-Authored-By ([[no-coauthor-commits]]). Worktree riêng, không đụng nhánh khác.
