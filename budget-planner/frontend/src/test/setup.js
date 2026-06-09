// Thiết lập môi trường test (Vitest + jsdom).
import "@testing-library/jest-dom";

// MUI dùng matchMedia ở một số nhánh — jsdom chưa có, stub để tránh lỗi.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
