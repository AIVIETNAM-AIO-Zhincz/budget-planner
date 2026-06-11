import { useRef } from "react";
import { Box, Paper, Typography } from "@mui/material";
import CountUpValue from "./CountUpValue.jsx";
import { useHoverLift } from "../utils/gsap.js";

/**
 * Thẻ KPI: nhãn + giá trị (font mono, tabular-nums) + icon accent.
 * - Truyền `value` (ReactNode) để hiển thị tĩnh, HOẶC `count`+`format` để đếm số (GSAP).
 * - Hover nhấc nhẹ qua GSAP (tôn trọng reduced-motion).
 *
 * @param {{label:string, value?:React.ReactNode, count?:number, format?:Function, suffix?:string,
 *          note?:string, icon?:React.ReactNode, accent?:string}} props
 */
export default function StatCard({
  label,
  value,
  count,
  format,
  suffix = "",
  note,
  icon,
  accent = "#6366f1",
}) {
  const cardRef = useRef(null);
  useHoverLift(cardRef);

  return (
    <Paper
      ref={cardRef}
      sx={(theme) => ({
        p: 2.5,
        borderRadius: 3,
        border: `2px solid ${accent}33`,
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 12px 24px rgba(0, 0, 0, 0.25)"
            : "0 12px 24px rgba(15, 23, 42, 0.08)",
        display: "grid",
        gap: 0.5,
        height: "100%",
        willChange: "transform",
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography
          sx={{ fontSize: 12, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.3 }}
        >
          {label}
        </Typography>
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              background: `${accent}1F`,
              color: accent,
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: { xs: 22, sm: 26 },
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {count != null && format ? (
          <CountUpValue value={count} format={format} suffix={suffix} />
        ) : (
          value
        )}
      </Typography>
      {note && <Typography sx={{ fontSize: 11, color: "text.disabled" }}>{note}</Typography>}
    </Paper>
  );
}
