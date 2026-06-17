# References for Phân loại Nhu cầu/Mong muốn/Lãng phí

## Backend
- `app/models/__init__.py` Category (id/space_id/name/parent_id/type) → +need_level.
- `app/schemas/category.py` (CategoryBase Field pattern) · `app/schemas/report.py` (ReportSummary).
- `app/api/categories.py` (create map field; update model_dump+setattr; `_common.get_owned_or_404`).
- `app/services/report.py build_summary` (by_category theo category_name) → +by_need_level JOIN Category.
- `alembic/versions/` head `380e5fac27d4`; mẫu `0adbc61de675_add_notifications.py` (batch_alter_table).
- `tests/test_categories.py`, `tests/test_reports.py` (pattern _tx, owner fixture).

## Frontend
- `components/CategoryFormDialog.jsx` (name/type ToggleButtonGroup/parent) · `api/categories.js` (create/update).
- `pages/Categories.jsx` (card, isIncome) · `pages/Reports.jsx` + `utils/charts.js pieOption` + `ChartCard`.
- `i18n/locales/{vi,en}.json`.
