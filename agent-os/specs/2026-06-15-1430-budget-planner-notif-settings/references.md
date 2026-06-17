# References for Settings batch (Notification prefs)

## Backend
- `app/services/notification.py add_notification` (chokepoint) → gate theo cờ.
- `app/models/__init__.py` Space → +notify_budget/member/recurring (mẫu server_default need_level/fund_type).
- `app/schemas/space.py` (SpaceUpdate/SpaceRead) · `app/api/spaces.py` (PATCH admin+, setattr-loop; 3 chỗ build SpaceRead).
- `alembic/versions/` head `8edb758c6885`; mẫu `c1946410be53_add_fund_type_to_goals.py`.
- `tests/test_notifications.py`, `tests/test_spaces.py`.

## Frontend
- `pages/Settings.jsx` (SettingCard, section Không gian/CurrencySelect) → +section thông báo + reorder.
- `api/spaces.js updateSpace`. `auth/AuthContext useAuth` (spaces + reload). `i18n/locales/{vi,en}.json`.
