import { Chip, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { badgeTone, darkenForText, hexToRgba } from "../utils/badgeColors.js";
import { categoryColor } from "../utils/format.js";

/**
 * Chip danh mục dạng pill, màu suy từ tên; tự chuyển translucent ở dark mode.
 *
 * @param {{name:string}} props
 */
export default function CategoryChip({ name }) {
  const theme = useTheme();
  if (!name) return null;
  const accent = categoryColor(name);
  // Light mode: đậm chữ vừa đủ để đọc rõ trên nền pastel; dark mode để badgeTone tự làm sáng.
  const textColor = theme.palette.mode === "dark" ? accent : darkenForText(accent);
  const tone = badgeTone(
    { color: textColor, bg: hexToRgba(accent, 0.12), border: hexToRgba(accent, 0.25) },
    theme.palette.mode
  );
  return (
    <Tooltip title={name}>
      <Chip
        label={name}
        size="small"
        sx={{
          height: "auto",
          fontWeight: 600,
          fontSize: 11.5,
          borderRadius: 999,
          maxWidth: 180,
          color: tone.color,
          backgroundColor: tone.bg,
          border: `1px solid ${tone.border}`,
          // Cho pill tự cao theo chữ (dấu tiếng Việt cần khoảng thở) → không tràn viền.
          "& .MuiChip-label": {
            px: 1.1,
            py: 0.3,
            lineHeight: 1.45,
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
      />
    </Tooltip>
  );
}
