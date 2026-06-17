# Standards for Animation GSAP

---

## frontend/forms-ui

- Animation tinh tế (stagger nhẹ, count-up, hover lift ~4px, page fade/slide ngắn); tôn trọng `theme.motion.reducedMotion`; không phá responsive/layout.

## testing

- Thêm test `CountUpValue` (render giá trị cuối ngay); **giữ 31 vitest xanh**. Count-up dùng `gsap.to` + render giá trị cuối → an toàn jsdom.

## naming / coding-style

- Gói GSAP qua `utils/gsap.js` (register `useGSAP` plugin 1 nơi); hook tái dùng (`useStaggerIn`/`useHoverLift`). Chỉ FE; không đụng backend.

## gsap-react (skill)

- `useGSAP()` + `scope` (ref) cho selector; `contextSafe` cho event handler; cleanup tự động/gỡ listener; chỉ chạy client (Vite SPA).
