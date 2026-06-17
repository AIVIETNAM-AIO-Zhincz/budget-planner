# Budget Planner — Animation GSAP

## Context

Người dùng vừa thêm các skill GSAP và muốn nâng trải nghiệm bằng animation GSAP. Spec này thêm 4 hiệu
ứng: **stagger thẻ khi vào trang**, **StatCard đếm số (count-up)**, **hover micro-interaction**,
**chuyển trang (page transition)**. Thuần FE (React 18 + Vite, SPA — không SSR). Phải **tôn trọng
reduced-motion** (app đã có `theme.motion.reducedMotion`) và **không phá 31 vitest**.

**Quyết định đã chốt:** cả 4 hiệu ứng, 1 PR. Nhánh `feature/budget-planner-gsap` từ `develop`.
Theo skill **gsap-react**: dùng `useGSAP()` (cleanup tự động) + `scope` ref + `contextSafe` cho event
handler. Guard mọi animation bằng `theme.motion.reducedMotion` (nguồn chuẩn, đồng bộ `utils/motion.js`).

## Sự thật đã khảo sát

- `package.json`: chưa có gsap. Cần `npm i gsap @gsap/react`. Register `gsap.registerPlugin(useGSAP)` 1 lần.
- `utils/motion.js`: `isReduced(theme)=theme.motion.reducedMotion`; đã có `cardHover/hoverLift/echartsAnimationDefaults` (giữ nguyên cho phần không-GSAP).
- `components/StatCard.jsx`: props `{label,value,note,icon,accent}`; value là ReactNode; dùng `cardHover(theme)` (hover CSS). **Test `StatCard.test.jsx` truyền `value` string** → phải giữ đường `value` tương thích.
- `pages/Dashboard.jsx`/`Reports.jsx`: StatCard truyền `value={`${formatCompactVnd(c.value)} ₫`}`; nhiều `<Grid item>` thẻ → gắn class `.gsap-in` để stagger.
- `layout/AppLayout.jsx`: `<Box key={spaceId} sx={{p}}>` bọc `<Outlet/>` (dòng 61) → chỗ gắn page-transition (key theo `location.pathname`).
- **Không có page-test** (chỉ test utils/api/component/AuthContext) → stagger/hover/page-transition KHÔNG đụng test. Chỉ **count-up** cần test-safe.
- `test/setup.js` stub `matchMedia → matches:false`.

## Chiến lược test-safe + reduced-motion (đã chốt)

1. Mọi hook GSAP: `if (theme.motion?.reducedMotion) return;` → reduced-motion = bỏ animation, hiện trạng thái cuối ngay.
2. **Count-up** dùng `gsap.to(proxy,{...})` (KHÔNG `fromTo`/immediateRender) + component render **giá trị cuối** làm mặc định → nếu ticker không chạy (jsdom/test) text vẫn là giá trị cuối → test xanh; ở browser proxy chạy 0→value cập nhật `textContent`.
3. Stagger/hover/transition chỉ ở pages/layout (không có test) → an toàn.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-11-0823-budget-planner-gsap/`.

## Task 2 — Hạ tầng GSAP + count-up

- `npm i gsap @gsap/react` (cập nhật lock).
- **`utils/gsap.js`**: register plugin + export `gsap`, `useGSAP`; hooks tái dùng:
  - `useStaggerIn(scopeRef, selector=".gsap-in")` — `gsap.from(selector,{opacity:0,y:16,stagger:0.06,duration:0.45,ease:"power2.out"})` (guard reduced-motion).
  - `useHoverLift(ref)` — `contextSafe` mouseenter/leave → `gsap.to(el,{y:-4,scale:1.012,dur:0.2})`/reverse; cleanup gỡ listener.
- **`components/CountUpValue.jsx`**: `{value:number, format:fn, suffix?}` → render `<span><span ref>{format(value)}</span>{suffix}</span>`; `useGSAP` `gsap.to(proxy{v:0}→value, onUpdate set ref.textContent=format(proxy.v))` (guard reduced-motion; dep `[value]`).
- **Test** `CountUpValue.test.jsx`: render → hiện ngay `format(value)+suffix` (giá trị cuối), không vỡ.

## Task 3 — StatCard + stagger + count-up (Dashboard/Reports)

- `StatCard.jsx`: thêm props optional `count`(number)+`format`(fn) → khi có thì render `<CountUpValue>`; else giữ `value` (tương thích test). Đổi hover sang `useHoverLift(paperRef)` (gắn ref Paper), bỏ `cardHover` (GSAP quản lý hover; reduced-motion → hook no-op nên không nhấc).
- `Dashboard.jsx`/`Reports.jsx`: thêm `scopeRef` + `useStaggerIn(scopeRef)`; gắn `className="gsap-in"` cho các `<Grid item>` thẻ/chart; StatCard chuyển sang `count={c.value} format={formatCompactVnd} suffix="₫"`.

## Task 4 — Page transition (AppLayout)

- `AppLayout.jsx`: thêm `useLocation`; bọc vùng `<Outlet/>` bằng ref; `useGSAP(()=>{ if(reduced)return; gsap.from(ref,{opacity:0,y:10,duration:0.3,ease:"power2.out"}) }, {dependencies:[location.pathname], scope: ref})`. Nhẹ, không pin/scroll.

## Task 5 — Verify + giao nộp

- `npm test` xanh (31 + CountUpValue); `npm run build` xanh; kiểm bundle (gsap ~+70kb — chấp nhận; cân nhắc manualChunks `gsap`).
- **Live** (dev :5173): vào Dashboard/Báo cáo thấy thẻ stagger + số đếm lên; hover thẻ nhấc nhẹ; đổi route fade/slide; bật prefers-reduced-motion (OS) → animation tắt, hiện ngay.
- Commit/push/PR vào `develop` (FE-only; CI `frontend-test`+build).

---

## Cấu trúc file

```
frontend/package.json (+lock)            (thêm gsap + @gsap/react)
frontend/src/utils/gsap.js               (mới — register + useStaggerIn + useHoverLift)
frontend/src/components/CountUpValue.jsx (+ .test.jsx)   (mới)
frontend/src/components/StatCard.jsx     (sửa — count/format + useHoverLift)
frontend/src/pages/Dashboard.jsx · Reports.jsx  (sửa — scope + stagger + count)
frontend/src/layout/AppLayout.jsx        (sửa — page transition)
```
Tái dùng: `theme.motion.reducedMotion` (guard), `formatCompactVnd`, `useGSAP`/`gsap`. Không đụng backend.

## Standards áp dụng

- **frontend/forms-ui** — animation tinh tế, tôn trọng reduced-motion; không phá layout/responsive.
- **testing** — thêm test CountUpValue; giữ 31 vitest xanh; count-up test-safe (gsap.to + render giá trị cuối).
- **naming/coding-style** — gói GSAP qua `utils/gsap.js` (register 1 nơi); hook tái dùng; chỉ FE.
- **gsap-react** (skill) — `useGSAP` + `scope` ref + `contextSafe` + cleanup; chỉ chạy client.

## Verification (lệnh)

```bash
cd conquer/budget-planner/frontend
npm install && npm test && npm run build
# live :5173 — stagger/count-up/hover/page-transition; test prefers-reduced-motion tắt animation
```
Kịch bản: thẻ stagger khi vào trang · StatCard đếm số · hover nhấc thẻ · đổi route fade/slide · reduced-motion tắt mượt. Test + build xanh.

---

> ⏳ **Việc còn treo (ngoài spec này):** backend Budget Planner chưa chạy trên :8000 (app khác đang chiếm cổng) → bạn chưa đăng nhập được. Sau khi duyệt/triển khai spec này, mình có thể khởi động lại backend đúng cổng để bạn login (`demo@aio.vn / budget2026`).
