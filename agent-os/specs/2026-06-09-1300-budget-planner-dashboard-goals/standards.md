# Standards for Goals widget Dashboard

---

## frontend/forms-ui

- MUI theme/sx (không Tailwind); widget có skeleton khi tải + empty khi rỗng; i18n đầy đủ; responsive `Grid`.
- Tái dùng `SectionCard`, `LinearProgress`, `formatAmount`, `goals.savedOf`/`goals.completed`.

## naming / coding-style

- Tái dùng helper sẵn có trong Dashboard; không thêm dependency (YAGNI). Lỗi widget cô lập (Promise.allSettled).

## api

- Chỉ đọc `GET /goals` (đã trả saved_amount/target_amount/percent). Không đổi backend ⇒ không migration/test backend.
