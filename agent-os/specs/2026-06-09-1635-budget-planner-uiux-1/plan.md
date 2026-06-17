# Budget Planner — Cải thiện UI/UX (batch 1)

## Context

Sau khảo sát thực tế, người dùng (Tech Leader) góp ý loạt vấn đề UI/UX. Spec này xử lý **batch 1**
gồm các điểm ưu tiên cao + có thay đổi code rõ ràng: **biểu đồ tròn không hiển thị** (Dashboard +
Báo cáo), **số tiền bị xuống dòng** ở thẻ tổng, **line chart Thu/Chi mất cân bằng**, **trang Giao
dịch thiếu tổng kết + tháng mặc định**, **Trợ lý thiếu quick prompts + input mờ nhạt**, **badge
ngôn ngữ trông như notification**. Một số góp ý khác (sidebar active/tooltip, badge chuông) **code đã
đúng** → verify live, chỉ chỉnh nếu thực sự lệch. Thuần FE.

**Quyết định đã chốt:** làm cả 4 batch (Charts · Số tiền+cards · Giao dịch · Trợ lý+Nav/Header) trong 1 PR UI/UX.
Nhánh `feature/budget-planner-uiux-1` từ `develop`. Có FE test (vitest) — không được phá; thêm test cho util mới.

## Sự thật đã khảo sát

- ECharts 5.5 + `echarts-for-react@3.0.2`. `utils/charts.js`: `pieOption`/`lineOption`/`barOption` (option HỢP LỆ, màu theo `categoryColor` từng phần). `ChartCard` đã có empty + Skeleton loading → **pie trống dù có data ⇒ nghi lỗi render (resize/width) hơn là empty state**.
- `lineOption`: 2 series Thu/Chi **chung 1 trục Y** → Chi (1.3tr) phẳng cạnh Thu (15tr).
- `StatCard.jsx` value Typography **thiếu `whiteSpace:nowrap`** → "số + ₫" xuống dòng. `formatAmount` chỉ `toLocaleString` (chưa có bản rút gọn).
- `Transactions.jsx`: filter `month` mặc định `null`; **không có thanh tổng**; `items` là mảng đã tải; chỗ chèn = sau khối `error`, trước `<Paper>` bảng.
- `Assistant.jsx`: chỉ bong bóng chào + input `size="small"`; **chưa có quick-prompt chips**.
- `TopBar.jsx`: badge ngôn ngữ `<Badge badgeContent="VI" color="primary">` (giống notification). Chuông `<Badge badgeContent={unread} color="error">` — **đã đúng**.
- `Sidebar.jsx`: `selected={isActive(path)}` (startsWith) + Tooltip khi `collapsed` — **đã đúng** (verify lại).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-1635-budget-planner-uiux-1/`.

## Task 2 — Charts: sửa pie render + line 2 trục + empty/loading

- **Chẩn đoán pie trống (live)**: chạy dev, mở Dashboard/Báo cáo, kiểm console + canvas. Sửa nguyên nhân gốc — ứng viên: ép `style={{ width:"100%", height:300 }}` + `opts={{ renderer:"svg" }}` cho `ReactECharts`, và/hoặc `onChartReady`/resize; nếu do option thì chỉnh `pieOption`. **Tiêu chí: donut hiện slices đúng màu.** Áp cho cả Dashboard + Reports (dùng chung `pieOption`).
- **`lineOption` 2 trục Y**: Thu (yAxisIndex 0) + Chi (yAxisIndex 1) với 2 `yAxis` scale riêng (hoặc 1 trục + đánh dấu rõ); tooltip giữ `₫`. Mục tiêu: cả 2 đường đọc được.
- Giữ/đảm bảo **empty state** (đã có) + Skeleton loading mọi chart (Dashboard có; thêm cho Reports nếu thiếu).
- (Bar "Top danh mục" đã tô màu theo từng danh mục — verify; nếu người dùng thấy đồng màu do legend khác, cân nhắc thêm `legend` khớp màu hoặc bỏ.)

## Task 3 — Số tiền + cards

- `StatCard.jsx`: thêm `whiteSpace:"nowrap"` cho value (số + ₫ cùng dòng); giảm `fontSize` responsive nếu cần (clamp) để không tràn.
- `utils/format.js`: thêm `formatCompactVnd(n)` (≥1e9→"x,y tỷ", ≥1e6→"x,y tr", ≥1e3→"x.x k", else số) + **test** trong `format.test.js`. Dùng cho **StatCard ở Dashboard/Reports** (giá trị lớn) — giữ `formatAmount` cho bảng/chi tiết.
- (Widget "Định kỳ sắp đến hạn" md=5: giữ; có thể đổi layout xuống `md=12` cùng hàng với "recent" nếu trống — tinh chỉnh nhẹ.)

## Task 4 — Giao dịch: tổng kết + tháng mặc định

- `Transactions.jsx`: `month` mặc định = **tháng hiện tại** (`dayjs()`); gọi `listTransactions` với `month` đó ngay từ đầu.
- **Thanh tổng** (trên bảng): tính từ `items` đã lọc — Tổng thu / Tổng chi / Số dư (dùng `summarize` từ `utils/charts.js`), hiển thị 3 chip/stat nhỏ. i18n `transactions.summary.*`.

## Task 5 — Trợ lý + Nav/Header

- `Assistant.jsx`: **quick-prompt chips** (3–4 gợi ý từ i18n, vd "tháng này chi bao nhiêu?", "cà phê 30k", "số dư ví?") đặt dưới lời chào hoặc trên input; bấm → đổ vào input/gửi luôn. **Input nổi bật hơn**: bỏ `size="small"` (hoặc tăng padding), nút gửi `variant`/nền primary rõ.
- `TopBar.jsx`: badge ngôn ngữ — đổi từ `Badge` (giống notification) sang **nhãn chữ** cạnh icon (vd `IconButton` hiện "VI"/"EN" text) hoặc `Chip` nhỏ; giữ tooltip.
- **Verify live** (chỉ sửa nếu lệch): sidebar active nhóm "Quản lý" (đang `selected` startsWith) + tooltip khi thu gọn; chuông badge unread.

## Task 6 — Verify + giao nộp

- `npm test` xanh (30 + test `formatCompactVnd`); `npm run build` xanh.
- **Live** (restart không cần — chỉ FE; dev :5173): Dashboard/Báo cáo pie hiện đúng; line 2 đường đọc được; StatCard số tiền 1 dòng; Giao dịch có thanh tổng + mặc định tháng này; Trợ lý có quick prompts; badge ngôn ngữ kiểu mới.
- Commit/push/PR vào `develop` (FE-only; CI `frontend-test`+build chạy).

---

## Cấu trúc file

```
frontend/src/utils/charts.js           (sửa — lineOption 2 trục; có thể pieOption)
frontend/src/utils/format.js (+ .test.js)  (sửa — formatCompactVnd + test)
frontend/src/pages/Dashboard.jsx · Reports.jsx  (sửa — ReactECharts width/resize; StatCard compact)
frontend/src/components/StatCard.jsx   (sửa — nowrap)
frontend/src/pages/Transactions.jsx    (sửa — tháng mặc định + thanh tổng)
frontend/src/pages/Assistant.jsx       (sửa — quick prompts + input)
frontend/src/layout/TopBar.jsx         (sửa — badge ngôn ngữ)
frontend/src/i18n/locales/{vi,en}.json (sửa — assistant.quick*, transactions.summary*)
```
Tái dùng: `summarize` (charts), `categoryColor`, `ChartCard`/`SectionCard`, MUI `Chip`. Không đụng backend.

## Standards áp dụng

- **frontend/forms-ui** — MUI sx; empty/loading state; responsive; i18n đầy đủ; không phá test FE.
- **testing** — thêm test cho `formatCompactVnd`; chạy lại 30 vitest.
- **naming/coding-style** — không thêm dependency; tách thay đổi rõ ràng; chỉ FE.

## Verification (lệnh)

```bash
cd conquer/budget-planner/frontend
npm test && npm run build
# live: dev :5173 — kiểm pie/line/StatCard/Transactions/Assistant/TopBar
```
Kịch bản: pie hiện slices · line 2 đường đọc được · số tiền 1 dòng · giao dịch có tổng + tháng này · trợ lý quick prompts · badge ngôn ngữ kiểu mới. Test + build xanh.
