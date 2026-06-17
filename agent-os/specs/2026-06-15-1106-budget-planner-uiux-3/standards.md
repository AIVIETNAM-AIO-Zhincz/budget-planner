# Standards for UI/UX batch 3

---

## frontend/forms-ui

- `EmptyState` dùng chung (icon + tiêu đề + mô tả + nút) cho trang ít dữ liệu. Contrast input đạt mức dễ đọc (border/placeholder). Format số có dấu phân cách. Page-transition tôn trọng reduced-motion.

## api + testing (TDD)

- Categories: aggregate `tx_count`/`tx_total` theo `category_name`+space (không migration). Goal `months_needed` clamp ≥0 + test. Giữ pytest + 34 vitest xanh.

## ci

- Chạy `ruff check .` + `ruff format --check .` trước push ([[ci-ruff-format-check]]). Không thêm Co-Authored-By ([[no-coauthor-commits]]).
