# Budget Planner — Tổng quan năm (Phase 2, feature #3)

## Context

Lấy cảm hứng từ template Excel "Monthly Budget" (sheet *Annual Summary*: dòng tiền + tăng trưởng số dư
theo năm). Thêm trang **Tổng quan năm** — biểu đồ 12 tháng (thu/chi mỗi tháng + **số dư luỹ kế**) +
thẻ tổng cả năm, giúp nhìn bức tranh tài chính dài hạn. Feature #3 trong 4 feature Phase 2 (mỗi cái 1 PR).
**Không cần migration** (chỉ đọc/tổng hợp).

**Quyết định đã chốt:** thêm **trang mới `/annual`** vào nhóm nav "Tổng quan" (nav còn chỗ). Backend
**tái dùng `build_summary`** rồi gom `by_day` theo tháng (DB-agnostic, không dùng `strftime`). Nhánh
`feature/budget-planner-annual` từ `develop`.

## Sự thật đã khảo sát

- **`services/report.py build_summary(db, space, start, end)`** trả `by_day=[{date(date obj), income, expense}]` → gom theo tháng được (DB-agnostic). `api/reports.py` pattern Query. `schemas/report.py` (CategoryAmount/DayFlow/ReportSummary).
- **FE App.jsx**: `lazy()` + `lazyEl()` + route con trong `<AppLayout>` (sau RequireAuth). `constants/nav.js` nhóm overview (Dashboard/Transactions/Assistant/Reports) — thêm item. `@heroicons` có `CalendarIcon`.
- **charts.js** đã import `formatCompactVnd`; có `pieOption/lineOption`; cần **`annualOption`** (cột Thu/Chi grouped + đường số dư luỹ kế, 2 trục Y) — mẫu theo `lineOption`.
- **Reports.jsx** mẫu page (PageHeader, StatCard count/format, ChartCard, dayjs, `echartsAnimationDefaults`, `useStaggerIn`). `StatCard` dùng count/format. `api/reports.js getSummary`.
- **Test** `test_reports.py` pattern (_tx, owner).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-11-1133-budget-planner-annual/`.

## Task 2 — BE: endpoint annual (TDD)

- `services/report.py`: `build_annual_summary(db, space_id, year)` — `start=date(year,1,1)`, `end=date(year,12,31)`; gọi `build_summary`; khởi tạo **đủ 12 tháng** `{year}-01..12` (income/expense 0); cộng dồn từ `by_day` (key `d["date"].strftime("%Y-%m")`); tính **số dư luỹ kế** (`balance += income-expense`). Trả `{year, months:[{month,income,expense,balance}×12]}`.
- `schemas/report.py`: `MonthlyFlow{month, income, expense, balance}` + `AnnualReportSummary{year, months}`.
- `api/reports.py`: `GET /reports/annual?year=int` (mặc định năm hiện tại — `Query(default=None)` → fallback `date.today().year`).
- **Test** `test_reports.py`: tạo giao dịch vài tháng năm 2026 → annual trả 12 tháng, income/expense đúng tháng, balance luỹ kế đúng, tháng trống = 0.

## Task 3 — FE: chart option + api

- `utils/charts.js`: `annualOption(theme, months, animation)` — xAxis `T01..T12`; 2 series **bar** Thu (success) + Chi (error) + 1 series **line** "Số dư luỹ kế" (yAxisIndex 1, info, areaStyle); 2 trục Y formatter `formatCompactVnd`; tooltip `₫`.
- `api/reports.js`: `getAnnual(year)` → `/reports/annual?year=`.

## Task 4 — FE: trang Annual + route + nav

- `pages/Annual.jsx`: year picker (MUI DatePicker `views=["year"]`, mặc định năm nay) → `getAnnual(year)`; 3 StatCard (tổng thu/chi cả năm + số dư cuối năm, `count/format` compact); ChartCard `annualOption` (height ~400) `opts svg`; loading Skeleton + empty state + error Alert; scope `useStaggerIn`.
- `App.jsx`: `lazy(Annual)` + `<Route path="annual" element={lazyEl(<Annual/>)} />`.
- `constants/nav.js`: thêm `{labelKey:"nav.annual", path:"/annual", icon: CalendarIcon}` vào nhóm overview (sau Reports).

## Task 5 — FE: i18n

- vi/en: `nav.annual`, `pages.annual`/`annualDesc`, `annual.chartTitle`, `annual.cumulative`, `annual.income`, `annual.expense` (hoặc tái dùng `reports.*`/`plan.*` sẵn có).

## Task 6 — Verify + giao nộp

- `pytest` (152 + mới) xanh; `ruff check` + **`ruff format --check`** sạch (gotcha CI). `npm test` + `npm run build` xanh.
- **Live** (BE :8000 + FE :5173): trang Tổng quan năm hiện biểu đồ 12 tháng + số dư luỹ kế; đổi năm nạp đúng.
- Commit/push/PR vào `develop`; CI 5 check.

---

## Cấu trúc file

```
backend/app/services/report.py             (sửa — build_annual_summary tái dùng build_summary)
backend/app/schemas/report.py              (sửa — MonthlyFlow + AnnualReportSummary)
backend/app/api/reports.py                 (sửa — GET /reports/annual)
backend/tests/test_reports.py              (sửa — test annual)
frontend/src/utils/charts.js               (sửa — annualOption)
frontend/src/api/reports.js                (sửa — getAnnual)
frontend/src/pages/Annual.jsx              (mới — trang)
frontend/src/App.jsx                       (sửa — route)
frontend/src/constants/nav.js              (sửa — nav item)
frontend/src/i18n/locales/{vi,en}.json     (sửa — nav.annual, pages/annual.*)
```
Tái dùng: `build_summary` (report), `StatCard count/format`, `formatCompactVnd`, `ChartCard`, `lazyEl`, `echartsAnimationDefaults`, MUI DatePicker. Không migration, không đụng model.

## Standards áp dụng

- **api/naming + testing (TDD)** — endpoint annual; test BE trước; giữ 152 pytest + 34 vitest xanh.
- **frontend/forms-ui** — page mới lazy; chart 12 tháng rõ; year picker; i18n; reduced-motion qua ChartCard/animation.
- **ci** — chạy `ruff format --check` trước push ([[ci-ruff-format-check]]).

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
cd ../frontend && npm test && npm run build
# live :5173 — /annual: biểu đồ 12 tháng + số dư luỹ kế; đổi năm
```
Kịch bản: trang Tổng quan năm · 12 cột Thu/Chi + đường số dư luỹ kế · thẻ tổng năm · đổi năm nạp đúng. Test BE+FE + build + ruff format xanh.
