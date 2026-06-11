// Hạ tầng GSAP: đăng ký plugin 1 nơi + hook tái dùng (stagger, hover-lift).
// Mọi animation tôn trọng `theme.motion.reducedMotion` (đồng bộ utils/motion.js).
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "@mui/material/styles";

gsap.registerPlugin(useGSAP);

/** Có nên bỏ animation (reduced-motion) không. */
function reduced(theme) {
  return Boolean(theme?.motion?.reducedMotion);
}

/**
 * Stagger fade+trượt lên cho các phần tử khớp `selector` trong `scopeRef` khi mount.
 *
 * @param {React.RefObject} scopeRef ref vùng chứa (scope cho selector).
 * @param {string} selector lớp CSS các phần tử cần animate (mặc định ".gsap-in").
 */
export function useStaggerIn(scopeRef, { selector = ".gsap-in", deps = [] } = {}) {
  const theme = useTheme();
  useGSAP(
    () => {
      if (reduced(theme)) return;
      gsap.from(selector, {
        opacity: 0,
        y: 16,
        duration: 0.45,
        ease: "power2.out",
        stagger: 0.06,
        clearProps: "transform,opacity",
      });
    },
    { scope: scopeRef, dependencies: deps, revertOnUpdate: true },
  );
}

/**
 * Nhấc nhẹ phần tử khi hover (mouseenter/leave) qua GSAP, gắn vào `ref`.
 *
 * @param {React.RefObject} ref ref phần tử cần hiệu ứng hover.
 */
export function useHoverLift(ref) {
  const theme = useTheme();
  useGSAP(
    (_ctx, contextSafe) => {
      if (reduced(theme) || !ref.current) return;
      const el = ref.current;
      const enter = contextSafe(() =>
        gsap.to(el, { y: -4, scale: 1.012, duration: 0.2, ease: "power2.out" }),
      );
      const leave = contextSafe(() =>
        gsap.to(el, { y: 0, scale: 1, duration: 0.2, ease: "power2.out" }),
      );
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      return () => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      };
    },
    { scope: ref },
  );
}

export { gsap, useGSAP, reduced };
