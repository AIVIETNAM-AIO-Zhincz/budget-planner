# References for Tổng quan năm

## Backend
- `app/services/report.py build_summary(db, space, start, end)` (by_day) → +`build_annual_summary(db, space, year)`.
- `app/schemas/report.py` (DayFlow mẫu) → +MonthlyFlow + AnnualReportSummary.
- `app/api/reports.py` (summary endpoint pattern) → +`GET /reports/annual`.
- `tests/test_reports.py` (_tx, owner).

## Frontend
- `utils/charts.js` (lineOption mẫu, formatCompactVnd đã import) → +`annualOption`.
- `api/reports.js getSummary` → +`getAnnual`.
- `pages/Reports.jsx` (mẫu page: PageHeader, StatCard count/format, ChartCard, dayjs, useStaggerIn) → `pages/Annual.jsx`.
- `App.jsx` (lazy/lazyEl route), `constants/nav.js` (overview group, CalendarIcon), `i18n/locales/{vi,en}.json`.
