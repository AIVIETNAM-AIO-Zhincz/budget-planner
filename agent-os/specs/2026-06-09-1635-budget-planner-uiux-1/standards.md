# Standards for Cải thiện UI/UX (batch 1)

---

## frontend/forms-ui

- MUI theme/sx (không Tailwind); chart có empty + loading state; responsive; i18n đầy đủ cho text mới.
- Tái dùng `summarize`/`categoryColor`/`ChartCard`/`SectionCard`/`Chip`.

## testing

- Thêm test `formatCompactVnd` trong `format.test.js`; **giữ toàn bộ 30 vitest xanh**.

## naming / coding-style

- Không thêm dependency; chỉ FE; thay đổi tách rõ theo từng vùng. Không đụng backend/hợp đồng API.
