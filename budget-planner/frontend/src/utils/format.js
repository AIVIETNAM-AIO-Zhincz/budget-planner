/** Bảng màu accent gán cho danh mục (xoay vòng theo hash tên). */
const CATEGORY_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#b45309",
  "#0891b2",
  "#be185d",
  "#15803d",
  "#c2410c",
  "#4f46e5",
];

/** Định dạng số tiền theo locale Việt Nam (vd 50000 → "50.000"). */
export function formatAmount(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("vi-VN");
}

/**
 * Chọn màu ổn định cho một danh mục dựa trên tên (hash đơn giản).
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
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}
