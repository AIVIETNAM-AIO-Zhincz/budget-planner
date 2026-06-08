/**
 * Các helper chuyển động dùng chung, xây trên `theme.transitions` và cờ
 * `theme.motion.reducedMotion` (thiết lập trong `theme/index.js`).
 * Port rút gọn từ design system InTraAI-WebTracking.
 *
 * Mọi helper nhận `theme` tường minh để dùng được trong `sx={(theme) => ({...})}`.
 */

const isReduced = (theme) => Boolean(theme?.motion?.reducedMotion);

/**
 * Chuỗi transition cross-fade cho status pill (background/color/border).
 * Trả 'none' khi giảm chuyển động.
 *
 * @param {object} theme MUI theme.
 * @returns {string} giá trị CSS `transition`.
 */
export function pillTransition(theme) {
  if (isReduced(theme)) return "none";
  const dur = theme.transitions.duration.shorter;
  const easing = theme.transitions.easing.easeOut;
  return (
    `background-color ${dur}ms ${easing}, ` +
    `color ${dur}ms ${easing}, ` +
    `border-color ${dur}ms ${easing}`
  );
}

/**
 * Fragment `sx` cho hiệu ứng nhấc nút khi hover (translateY(-1px) + shadow).
 *
 * @param {object} theme MUI theme.
 * @returns {object} fragment sx.
 */
export function hoverLift(theme) {
  const dur = theme.transitions.duration.shorter;
  const easing = theme.transitions.easing.easeOut;
  if (isReduced(theme)) {
    return { transition: "none", "&:active": { transform: "none" } };
  }
  return {
    transition: `transform ${dur}ms ${easing}, box-shadow ${dur}ms ${easing}`,
    "&:hover": { transform: "translateY(-1px)", boxShadow: theme.shadows[2] },
    "&:active": { transform: "translateY(0)" },
  };
}

/**
 * Fragment `sx` cho card bấm được: scale nhẹ + tăng shadow khi hover.
 *
 * @param {object} theme MUI theme.
 * @returns {object} fragment sx.
 */
export function cardHover(theme) {
  const dur = theme.transitions.duration.shorter;
  const easing = theme.transitions.easing.easeOut;
  if (isReduced(theme)) return { transition: "none" };
  return {
    transition: `transform ${dur}ms ${easing}, box-shadow ${dur}ms ${easing}`,
    "&:hover": { transform: "scale(1.005)", boxShadow: theme.shadows[3] },
  };
}

/**
 * Option animation mặc định cho ECharts. Spread TRƯỚC phần option còn lại để
 * override ở call-site thắng.
 *
 * @param {object} theme MUI theme.
 * @returns {object} fragment option ECharts.
 */
export function echartsAnimationDefaults(theme) {
  if (isReduced(theme)) {
    return { animation: false, animationDuration: 0, animationDurationUpdate: 0 };
  }
  return {
    animation: true,
    animationDuration: 600,
    animationDurationUpdate: 450,
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicOut",
  };
}
