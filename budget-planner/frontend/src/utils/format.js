/** Định dạng số tiền theo locale Việt Nam (vd 50000 → "50.000"). */
export function formatAmount(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("vi-VN");
}

/** Chuyển HSL (h:0–360, s/l:0–1) sang mã hex `#rrggbb`. */
function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const hex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * Chọn màu ổn định + phân biệt cho một danh mục theo tên.
 * Dùng góc vàng (golden-angle) để trải đều sắc độ → các danh mục khác nhau
 * hầu như luôn có màu khác nhau (deterministic theo tên, trả mã hex).
 *
 * @param {string} name tên danh mục.
 * @returns {string} mã hex.
 */
export function categoryColor(name) {
  const key = String(name || "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const hue = (hash * 137.508) % 360;
  return hslToHex(hue, 0.62, 0.48);
}

/**
 * Màu (theo MUI palette) cho tiến độ ngân sách dựa trên %.
 *
 * @param {number} percent phần trăm đã chi.
 * @returns {"success"|"warning"|"error"}
 */
export function budgetTone(percent) {
  if (percent >= 100) return "error";
  if (percent >= 80) return "warning";
  return "success";
}

function _trim(value) {
  return value.toFixed(1).replace(/\.0$/, "");
}

/**
 * Rút gọn số tiền lớn để hiển thị gọn (1 dòng): 15000000 → "15 tr", 1.3e9 → "1.3 tỷ".
 *
 * @param {number} amount số tiền.
 * @returns {string} chuỗi rút gọn (chưa kèm ký hiệu ₫).
 */
export function formatCompactVnd(amount) {
  const n = Number(amount) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${_trim(abs / 1e9)} tỷ`;
  if (abs >= 1e6) return `${sign}${_trim(abs / 1e6)} tr`;
  if (abs >= 1e3) return `${sign}${Math.round(abs / 1e3)} k`;
  return `${sign}${Math.round(abs)}`;
}
