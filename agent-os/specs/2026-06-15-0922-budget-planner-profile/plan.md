# Budget Planner — Hồ sơ tài chính người dùng + cá nhân hoá (Phase 3, slice #4)

## Context

Production Description: *"điều chỉnh khuyến nghị với những đối tượng khác nhau (cá nhân hoá hơn — tùy độ
tuổi, nơi sống, người phụ thuộc)"*. Ba slice trước (FAQ #35, allocation #38, goal #37) đã merge vào
`develop`. Slice cuối thêm **hồ sơ tài chính người dùng** + **cá nhân hoá lời khuyên** chatbot.

**Quyết định đã chốt với chủ repo:**
- **Lưu trữ**: bảng `user_profiles` **riêng** (1-1 với user), endpoint riêng `/profile`.
- **Phạm vi**: hồ sơ + **cá nhân hoá**: (a) quỹ khẩn cấp tăng theo **người phụ thuộc** (3–6× → 6–12×);
  (b) **thu nhập hồ sơ làm fallback** cho FAQ/allocation/goal khi tháng chưa ghi giao dịch thu.
- **Nhánh** `feature/budget-planner-profile` từ `develop` (đã có 3 slice trước — **không stack**).
- **Có migration** (#N, `create_table user_profiles`, down_revision = head hiện tại `c1946410be53`).

## Sự thật đã khảo sát

- **User** (`models/__init__.py`): chỉ id/email/password_hash/name/is_active. `/auth/me` GET+PATCH có
  sẵn (`ProfileUpdate{name}`) — nhưng hồ sơ tài chính tách bảng riêng.
- **Migration** mẫu `c1946410be53_add_fund_type_to_goals.py` (revision/down_revision, `batch_alter_table`);
  bảng mới dùng `op.create_table`. **Head = `c1946410be53`** (xác nhận `alembic heads`).
- **main.py** đăng ký router bằng `app.include_router(...)` — thêm `profile.router`.
- **Chatbot** `api/assistant.py message` hiện chỉ `get_current_space_id` → **thêm `get_current_user`** để
  nạp hồ sơ. `assistant.handle_message(db, space_id, text, today)` + `_faq_context`/`_allocation_reply`/
  `_goal_reply`/`_route_llm` → thêm tham số `profile` (mặc định None, giữ test cũ).
- **`faq._emergency_fund(ctx)`** dùng `monthly_expense`; thêm `dependents` vào ctx để đổi bội số 3–6→6–12.
- **`current_month_net`** (report) + `_month_amount` (assistant) cho fallback thu nhập.
- **FE** `pages/Settings.jsx` có `SettingCard` + card "Hồ sơ" (name). `api/auth.js` mẫu `getMe`/`updateProfile`.

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-15-0922-budget-planner-profile/` (plan/shape/standards/references).

## Task 2 — BE: model UserProfile + migration

- `models/__init__.py`: `UserProfile` (`user_profiles`): id (uuid), `user_id` FK users **unique**,
  `monthly_income` Float nullable, `occupation` String(255) nullable, `age` Integer nullable,
  `location` String(255) nullable, `dependents` Integer default 0 server_default "0", created_at.
  Thêm vào `__all__`.
- **Migration #N** `add_user_profiles` (down_revision `c1946410be53`): `op.create_table("user_profiles", ...)`
  + index/unique trên user_id; downgrade `op.drop_table`. Áp `alembic upgrade head` + verify no-op lần 2.

## Task 3 — BE: schema + API `/profile` — TDD

- `schemas/profile.py` (mới): `ProfileUpdate` (partial, validation `monthly_income ge=0`,
  `age ge=0 le=120`, `dependents ge=0`, occupation/location max_length); `ProfileRead`
  (`from_attributes`: user_id + 5 trường).
- `api/profile.py` (mới, prefix `/profile`, `get_current_user`): `GET /profile` (trả hồ sơ user, mặc
  định rỗng nếu chưa có); `PUT /profile` (upsert — tạo nếu chưa có, set field từ `model_dump(exclude_unset)`).
  Đăng ký `profile.router` trong `main.py`.
- **Test** `tests/test_profile.py`: GET mặc định rỗng; PUT upsert → GET phản ánh; validation 422
  (age=200, dependents=-1, income<0); thiếu token → 401; cô lập giữa user.

## Task 4 — BE: cá nhân hoá lời khuyên chatbot — TDD

- `api/assistant.py`: thêm `user=Depends(get_current_user)`; nạp `profile` (dict
  `{"monthly_income", "dependents"}` từ UserProfile, None nếu chưa có) → `handle_message(..., profile=...)`.
- `assistant.py`: thêm tham số `profile=None` vào `handle_message`/`_route_llm`/`_faq_context`/
  `_allocation_reply`/`_goal_reply`:
  - `_faq_context`: `monthly_income = income_tx or (profile.monthly_income or 0)`; thêm `dependents`.
  - `_allocation_reply`: nếu income (giao dịch) = 0 và hồ sơ có thu nhập → dùng thu nhập hồ sơ làm gốc.
  - `_goal_reply`: nếu `cap ≤ 0` và hồ sơ có thu nhập → `cap = 0.2 × monthly_income` (ước tính).
- `faq._emergency_fund`: `dependents>0` → quỹ 6–12× chi tiêu (kèm số nếu có), else 3–6×.
- **Test**: `test_faq.py` (emergency_fund dependents>0 → bội số 6–12); `test_assistant.py` (đặt
  `/profile` income, KHÔNG ghi giao dịch thu → "phân bổ"/"tiết kiệm %"/mục tiêu dùng thu nhập hồ sơ;
  emergency fund qua chatbot đổi theo dependents). Giữ test cũ xanh (profile=None → hành vi cũ).

## Task 5 — FE: card "Hồ sơ tài chính" trong Settings

- `api/profile.js` (mới): `getProfile`, `saveProfile(payload)` (PUT `/profile`).
- `pages/Settings.jsx`: thêm `SettingCard` "Hồ sơ tài chính" — TextField số (monthly_income, age,
  dependents) + text (occupation, location); load `getProfile` khi mount, lưu `saveProfile`. Toast tái dùng.
- `i18n vi/en`: `settings.financialProfile.*` (title, desc, income, occupation, age, location,
  dependents, save, saved).

## Task 6 — Verify + giao nộp

- **`alembic upgrade head`** áp migration #N + no-op lần 2; `pytest` (toàn bộ + mới) xanh; `ruff check`
  + `ruff format` sạch.
- `npm test` + `npm run build` xanh.
- **Live**: điền Hồ sơ (thu nhập 20tr, 2 người phụ thuộc) **không ghi giao dịch thu** → Trợ lý "phân bổ
  của tôi hợp lý chưa?" dùng thu nhập hồ sơ; "quỹ khẩn cấp nên có bao nhiêu?" → bội số 6–12×.
- Commit/push, **PR vào `develop`** (CI 5 check gồm alembic). **Không** trailer `Co-Authored-By`.

---

## Cấu trúc file

```
backend/app/models/__init__.py              (sửa — UserProfile + __all__)
backend/alembic/versions/<rev>_add_user_profiles.py   (mới — create_table)
backend/app/schemas/profile.py              (mới — ProfileUpdate/ProfileRead)
backend/app/api/profile.py                  (mới — GET/PUT /profile)
backend/app/main.py                         (sửa — include profile.router)
backend/app/api/assistant.py                (sửa — get_current_user → profile)
backend/app/services/assistant.py           (sửa — thread profile; income fallback; goal cap)
backend/app/services/faq.py                 (sửa — emergency_fund theo dependents)
backend/tests/test_profile.py               (mới)
backend/tests/{test_faq,test_assistant}.py  (sửa — cá nhân hoá)
frontend/src/api/profile.js                 (mới)
frontend/src/pages/Settings.jsx             (sửa — card Hồ sơ tài chính)
frontend/src/i18n/locales/{vi,en}.json      (sửa — settings.financialProfile.*)
```
Tái dùng: pattern migration `c1946410be53`, `get_current_user`, `model_dump(exclude_unset)`,
`current_month_net`/`_month_amount`, `SettingCard`/`getMe`. occupation/age/location: lưu + hiển thị
(cá nhân hoá cụ thể chỉ dùng income + dependents — YAGNI cho phần còn lại).

## Standards áp dụng

- **database/migrations** — migration #N có upgrade/downgrade + `server_default` cho cột không null
  (`dependents`); áp + no-op verify.
- **testing/tdd** — `test_profile.py` (happy + 422 + 401 + cô lập); cá nhân hoá test (profile None giữ
  hành vi cũ); test BE trước.
- **api/fastapi** — router `/profile` theo tài nguyên, Pydantic validation, `get_current_user` (per-user,
  không space). **root/coding-style + naming**.

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
BP_DATABASE_URL="sqlite:///./budget_planner.db" .venv/bin/alembic upgrade head   # áp migration #N
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
cd ../frontend && npm test && npm run build
# live: điền Hồ sơ (income 20tr, dependents 2), không ghi thu → Trợ lý dùng thu nhập hồ sơ;
#        "quỹ khẩn cấp nên có bao nhiêu?" → 6–12× chi tiêu
```
Kịch bản: PUT /profile {income 20tr, dependents 2}; chatbot "phân bổ hợp lý chưa?" (chưa ghi thu) → đánh
giá theo 20tr hồ sơ; "quỹ khẩn cấp?" → "6–12 tháng". Migration áp + no-op. Test BE+FE + build xanh.
