import { Chip, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { badgeTone, hexToRgba } from "../utils/badgeColors.js";
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
  const tone = badgeTone(
    { color: accent, bg: hexToRgba(accent, 0.12), border: hexToRgba(accent, 0.25) },
    theme.palette.mode
  );
  return (
    <Tooltip title={name}>
      <Chip
        label={name}
        size="small"
        sx={{
          height: 22,
          fontWeight: 600,
          borderRadius: 999,
          maxWidth: 160,
          color: tone.color,
          backgroundColor: tone.bg,
          border: `1px solid ${tone.border}`,
        }}
      />
    </Tooltip>
  );
}
