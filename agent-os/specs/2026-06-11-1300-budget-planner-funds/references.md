# References for Quỹ (fund_type)

## Backend
- `app/models/__init__.py` Goal (mẫu Category.need_level) → +fund_type.
- `app/schemas/goal.py` (GoalBase/Update Field pattern).
- `app/api/goals.py` (`create_goal` map field; `_to_read` dựng thủ công → +fund_type; `model_dump+setattr` update).
- `alembic/versions/` head `235fc17ed2c7`; mẫu `2e8056959549_add_need_level_to_categories.py`.
- `tests/test_goals.py` (helper `_goal`, owner).

## Frontend
- `components/GoalFormDialog.jsx` (name/target/wallet/deadline) → +select fund_type.
- `pages/Goals.jsx` (grid card + progress) → chip + dải tổng theo loại; `api/goals.js` (createGoal truyền payload).
- `i18n/locales/{vi,en}.json` (goals.*).
