# UI/UX batch 3 — Shaping Notes

## Scope

Cải thiện theo review 12 trang: (1) polish + bug nhỏ, (2) empty-state đẹp dùng chung, (3) thêm dữ liệu/widget. Thuần FE + vài fix BE nhỏ. Làm trong git worktree riêng, base develop.

## Decisions

- Worktree `../aio2026-practice-uiux3`, nhánh `feature/budget-planner-uiux-3` từ develop. PR vào develop.
- "Loading mờ" = page-transition GSAP (opacity fade) → bỏ opacity, giữ y-slide nhẹ. Skeleton đã đủ.
- Màu danh mục đã đồng bộ (categoryColor) → không sửa.
- Goal `months_needed` clamp ≥0; categories thêm tx_count/tx_total (BE aggregate). Không migration.

## Context

- **Visuals:** review chữ của người dùng (12 trang).
- **References:** `AppLayout.jsx`, `theme/index.js`, `StatCard.jsx`/`Dashboard.jsx`, `MonthlyPlanCard.jsx`, `Goals.jsx`, `TopBar.jsx`, `ComingSoon.jsx`, `services/goal.py`, `api/categories.py`.
- **Product alignment:** Chất lượng UX/accessibility.

## Standards Applied

- **frontend/forms-ui** — empty-state dùng chung; contrast; format số; reduced-motion.
- **api + testing (TDD)** — categories stats; goal fix + test; giữ test cũ.
- **ci** — `ruff format --check` trước push ([[ci-ruff-format-check]]); no co-author.
