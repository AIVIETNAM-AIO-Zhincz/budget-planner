import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Hook phản ứng theo tuỳ chọn `prefers-reduced-motion` của hệ điều hành.
 * Trả về boolean và tự cập nhật khi người dùng đổi cài đặt. SSR-safe.
 *
 * @returns {boolean} true nếu người dùng muốn giảm chuyển động.
 */
export default function useReducedMotion() {
  const getInitial = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(QUERY).matches;

  const [reduced, setReduced] = useState(getInitial);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }
    const mql = window.matchMedia(QUERY);
    const handler = (event) => setReduced(event.matches);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(handler);
    }
    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", handler);
      } else if (typeof mql.removeListener === "function") {
        mql.removeListener(handler);
      }
    };
  }, []);

  return reduced;
}
