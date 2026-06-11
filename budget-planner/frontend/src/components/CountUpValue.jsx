import { useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { gsap, useGSAP, reduced } from "../utils/gsap.js";

/**
 * Hiển thị một con số có hiệu ứng đếm từ 0 → `value` khi mount/đổi giá trị.
 * Render sẵn giá trị cuối (an toàn khi không có animation / reduced-motion / test).
 *
 * @param {{value:number, format:(n:number)=>string, suffix?:string}} props
 */
export default function CountUpValue({ value, format, suffix = "" }) {
  const numRef = useRef(null);
  const theme = useTheme();
  const target = Number(value) || 0;

  useGSAP(
    () => {
      if (reduced(theme) || !numRef.current) return;
      const proxy = { v: 0 };
      gsap.to(proxy, {
        v: target,
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          if (numRef.current) numRef.current.textContent = format(proxy.v);
        },
      });
    },
    { dependencies: [target], scope: numRef },
  );

  return (
    <span>
      <span ref={numRef}>{format(target)}</span>
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}
