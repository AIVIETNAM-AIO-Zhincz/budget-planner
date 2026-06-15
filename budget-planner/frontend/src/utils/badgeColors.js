/**
 * Helper bảng màu badge/pill có nhận biết dark mode.
 * Port rút gọn từ design system InTraAI-WebTracking.
 *
 * App lưu palette chip dạng triple sáng `{ color, bg, border }`. Pastel sáng
 * sẽ chói trên nền tối, nên ở dark mode ta tái dựng thành nền translucent của
 * accent + chữ sáng hơn ("badge bán trong suốt").
 */

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHex(value) {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

function normalizeHex(hex) {
  const m = String(hex || "#64748b").replace("#", "").trim();
  return m.length === 3
    ? m.split("").map((c) => c + c).join("")
    : m;
}

/** Chuyển hex sang chuỗi rgba với độ trong `alpha`. */
export function hexToRgba(hex, alpha) {
  const num = parseInt(normalizeHex(hex), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Trộn hex về phía trắng theo `amt` (0..1) để accent đậm vẫn đọc rõ trên nền tối. */
export function lighten(hex, amt) {
  const num = parseInt(normalizeHex(hex), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const mix = (c) => Math.round(c + (255 - c) * amt);
  const toHex = (c) => mix(c).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Độ sáng tương đối (0..1) theo công thức WCAG. */
function relLuminance(r, g, b) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Đậm hoá hex (trộn về đen) cho tới khi độ sáng ≤ `max`, giữ nguyên sắc (hue).
 * Mục đích: chữ badge trên nền pastel luôn đủ tương phản — màu quá sáng (cyan,
 * vàng, lục) bị làm tối lại, màu vốn đã tối (đỏ, tím, lam) gần như không đổi.
 *
 * @param {string} hex mã màu accent.
 * @param {number} max ngưỡng độ sáng tối đa (mặc định 0.18).
 * @returns {string} mã hex đã đậm vừa đủ.
 */
export function darkenForText(hex, max = 0.18) {
  const num = parseInt(normalizeHex(hex), 16);
  const r0 = (num >> 16) & 255;
  const g0 = (num >> 8) & 255;
  const b0 = num & 255;
  let k = 1;
  let r = r0;
  let g = g0;
  let b = b0;
  while (k > 0.2 && relLuminance(r, g, b) > max) {
    k -= 0.05;
    r = Math.round(r0 * k);
    g = Math.round(g0 * k);
    b = Math.round(b0 * k);
  }
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Tái dựng palette badge `{ color, bg, border }` theo mode. Dark mode: accent
 * hex thành nền translucent + chữ sáng hơn. Light mode giữ nguyên.
 *
 * @param {{color:string,bg?:string,border?:string}} style triple màu sáng.
 * @param {"light"|"dark"} mode chế độ màu.
 * @returns {{color:string,bg:string,border:string}}
 */
export function badgeTone(style, mode) {
  if (!style || mode !== "dark") return style;
  const accent = style.color;
  if (!isHex(accent)) {
    return { ...style, bg: "rgba(255, 255, 255, 0.07)", border: "rgba(255, 255, 255, 0.14)" };
  }
  return {
    ...style,
    color: lighten(accent, 0.38),
    bg: hexToRgba(accent, 0.16),
    border: hexToRgba(accent, 0.42),
  };
}
