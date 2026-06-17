# Animation GSAP — Shaping Notes

## Scope

Thêm 4 hiệu ứng GSAP cho Budget Planner FE: stagger thẻ khi vào trang, StatCard đếm số (count-up), hover micro-interaction, page transition. Tôn trọng reduced-motion; không phá 31 vitest.

## Decisions

- Cả 4 hiệu ứng trong 1 PR (`feature/budget-planner-gsap`). Theo skill gsap-react: `useGSAP` + scope + contextSafe + cleanup.
- Guard mọi GSAP bằng `theme.motion.reducedMotion` (nguồn chuẩn sẵn có).
- Count-up test-safe: `gsap.to(proxy)` (không immediateRender) + render giá trị cuối làm mặc định.
- Gói GSAP qua `utils/gsap.js` (register plugin 1 nơi + hook tái dùng).

## Context

- **Visuals:** None (yêu cầu chữ).
- **References:** `utils/motion.js` (reduced-motion), `components/StatCard.jsx`, `pages/{Dashboard,Reports}.jsx`, `layout/AppLayout.jsx`, `utils/format.js` (formatCompactVnd). Skill `gsap-react`, `gsap-core`.
- **Product alignment:** Trải nghiệm/độ tinh tế UI.

## Standards Applied

- **frontend/forms-ui** — animation tinh tế, reduced-motion, không phá layout.
- **testing** — test CountUpValue; giữ vitest xanh.
- **naming/coding-style** — gói GSAP 1 nơi; hook tái dùng; chỉ FE.
- **gsap-react** — useGSAP + scope + contextSafe + cleanup; client-only.
