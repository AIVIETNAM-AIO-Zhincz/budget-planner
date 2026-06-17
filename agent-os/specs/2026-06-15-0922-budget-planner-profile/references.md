# References for Hồ sơ tài chính người dùng

## Similar Implementations

### Migration mẫu (create/alter table)

- **Location:** `conquer/budget-planner/backend/alembic/versions/c1946410be53_add_fund_type_to_goals.py`
- **Relevance:** mẫu revision/down_revision + upgrade/downgrade + `server_default`. Bảng mới dùng
  `op.create_table` (thay `batch_alter_table`). **down_revision = `c1946410be53`** (head hiện tại).

### Auth / user hiện tại

- **Location:** `conquer/budget-planner/backend/app/api/auth.py` + `app/schemas/auth.py`
- **Relevance:** `get_current_user` (per-user dependency), `/auth/me` GET+PATCH + `ProfileUpdate{name}`,
  `UserRead` (`from_attributes`). `/profile` làm tương tự nhưng bảng riêng + upsert.

### FAQ emergency_fund (cá nhân hoá theo dependents)

- **Location:** `conquer/budget-planner/backend/app/services/faq.py` → `_emergency_fund(ctx)`
- **Relevance:** dùng `ctx["monthly_expense"]`; thêm `ctx["dependents"]` để đổi bội số 3–6 → 6–12.

### Chatbot threading (cá nhân hoá inputs)

- **Location:** `conquer/budget-planner/backend/app/services/assistant.py` + `app/api/assistant.py`
- **Relevance:** `handle_message`/`_route_llm`/`_faq_context`/`_allocation_reply`/`_goal_reply` → thêm
  tham số `profile` (mặc định None). `api/assistant.py` thêm `get_current_user` để nạp hồ sơ.
- **Key patterns:** `current_month_net`/`_month_amount` cho fallback thu nhập; engine thuần không đổi
  (chỉ đổi input).

### main.py router registration

- **Location:** `conquer/budget-planner/backend/app/main.py`
- **Relevance:** `app.include_router(...)` — thêm `profile.router`.

### FE Settings

- **Location:** `conquer/budget-planner/frontend/src/pages/Settings.jsx` + `src/api/auth.js`
- **Relevance:** `SettingCard` + form pattern (TextField + saveProfile + toast); `getMe`/`updateProfile`
  mẫu cho `api/profile.js` (`getProfile`/`saveProfile`).
