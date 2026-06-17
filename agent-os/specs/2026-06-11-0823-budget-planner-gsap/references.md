# References for Animation GSAP

## Hạ tầng / guard
- `src/utils/motion.js` — `isReduced(theme)=theme.motion.reducedMotion` (nguồn reduced-motion). Mới: `src/utils/gsap.js` register + hooks.
- `src/theme/index.js` / `ColorModeContext.jsx` — `theme.motion.reducedMotion`.

## Điểm tích hợp
- `src/components/StatCard.jsx` — thêm `count`/`format` (CountUpValue) + `useHoverLift`; giữ `value`.
- `src/components/CountUpValue.jsx` (mới) + test.
- `src/pages/Dashboard.jsx` · `Reports.jsx` — scope ref + `useStaggerIn` + `.gsap-in` + StatCard count; `formatCompactVnd` từ `utils/format.js`.
- `src/layout/AppLayout.jsx` — `<Outlet/>` (dòng 61) page transition theo `useLocation().pathname`.

## Skill
- `gsap-react` — useGSAP/scope/contextSafe/cleanup. `gsap-core` — to/from/stagger/ease.
