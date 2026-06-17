# Budget Planner — Quỹ (khẩn cấp/dài hạn) — Phase 2, feature #4

## Context

Lấy cảm hứng từ template Excel "Monthly Budget" (Quỹ khẩn cấp / Quỹ dài hạn). Mở rộng **Mục tiêu tiết
kiệm (Goal)** bằng trường **loại quỹ** `fund_type` để phân loại + nhìn tổng quỹ theo loại. Feature #4
(cuối) của Phase 2. **Pattern y hệt `need_level` (PR #29)** áp cho Goal — thêm enum field + migration +
hiển thị nhóm.

**Quyết định đã chốt:** `fund_type ∈ {emergency, long_term, general}` (mặc định `general`), gắn ở **Goal**.
Nhánh `feature/budget-planner-funds` từ `develop`. **Migration #7** (down_revision = `235fc17ed2c7`).
Giá trị nội bộ tiếng Anh; hiển thị tiếng Việt qua i18n. Field optional/default → không phá test cũ.

## Sự thật đã khảo sát

- **Model** `Goal` (`models/__init__.py` ~dòng 170): id, space_id, name, target_amount, wallet_id, deadline, created_at. **Không** lưu current — `saved_amount` = `wallet.balance` (tính runtime ở `goals.py _to_read`). Mẫu enum: `Category.need_level` (String(16)+server_default).
- **Schema** `schemas/goal.py`: GoalBase/Create/Update/Read (Field pattern). `GoalRead` extends GoalBase nhưng `_to_read` **dựng thủ công** → phải truyền `fund_type=goal.fund_type`.
- **Router** `api/goals.py`: `create_goal` (member+) map field thủ công → thêm `fund_type`; update `model_dump(exclude_unset)+setattr` (tự xử lý nếu thêm vào Update); `contribute` (góp=chuyển tiền) không đổi.
- **Alembic head** `235fc17ed2c7` (monthly_plans). Mẫu add_column `2e8056959549` (need_level).
- **FE** `GoalFormDialog` (name/target/wallet/deadline) → thêm select fund_type; `Goals.jsx` (grid card + progress) → chip fund_type + dải tổng theo loại; `api/goals.js createGoal(payload)` truyền nguyên payload (fund_type tự theo).
- **Test** `test_goals.py` (helper `_goal`, owner) — thêm test fund_type, giữ test cũ (default).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-11-1300-budget-planner-funds/`.

## Task 2 — BE: Goal.fund_type + migration + API (TDD)

- **Model**: `fund_type: Mapped[str] = mapped_column(String(16), default="general", server_default="general")`.
- **Schema** `goal.py`: `GoalBase.fund_type: str = Field(default="general", pattern="^(emergency|long_term|general)$")`; `GoalUpdate.fund_type: str | None = Field(default=None, pattern=...)`.
- **Router**: `create_goal` thêm `fund_type=payload.fund_type`; `_to_read` thêm `fund_type=goal.fund_type`.
- **Migration #7** `add_fund_type_to_goals` (down_revision `235fc17ed2c7`): `add_column goals.fund_type String(16) server_default="general" nullable=False`; downgrade drop. Ruff-clean + format. Áp DB + no-op.
- **Test** `test_goals.py`: tạo có fund_type → trả đúng; không gửi → default "general"; pattern sai → 422.

## Task 3 — FE: form + danh sách + i18n

- `GoalFormDialog`: thêm select `fund_type` (3 lựa chọn i18n); payload `fund_type`. (`api/goals.js` không đổi — truyền nguyên payload.)
- `Goals.jsx`: chip nhỏ fund_type trên mỗi card (màu: emergency đỏ/cam, long_term xanh dương, general xám); **dải tổng "Quỹ theo loại"** trên đầu (tính từ `items`: tổng `saved_amount` theo fund_type) — 3 chip/stat.
- i18n vi/en: `goals.fundType`, `goals.fundTypes.{emergency,long_term,general}`, `goals.totalByFundType`, `goals.form.fundType`.

## Task 4 — Verify + giao nộp

- `pytest` (153 + mới) xanh; `ruff check` + **`ruff format --check`** sạch; **alembic upgrade head áp #7** + no-op. `npm test` + `npm run build` xanh.
- **Live** (BE :8000 + FE :5173): đặt loại quỹ cho mục tiêu → chip + dải tổng theo loại.
- Commit/push/PR vào `develop`; CI 5 check. Đóng Phase 2.

---

## Cấu trúc file

```
backend/app/models/__init__.py             (sửa — Goal.fund_type)
backend/app/schemas/goal.py                (sửa — fund_type Base/Update)
backend/app/api/goals.py                   (sửa — create map + _to_read)
backend/alembic/versions/<rev>_add_fund_type_to_goals.py  (mới — migration #7)
backend/tests/test_goals.py                (sửa — test fund_type)
frontend/src/components/GoalFormDialog.jsx (sửa — select fund_type)
frontend/src/pages/Goals.jsx               (sửa — chip + dải tổng)
frontend/src/i18n/locales/{vi,en}.json     (sửa — goals.fundType*, totalByFundType)
```
Tái dùng: pattern `need_level` (PR #29), `_to_read`, `model_dump(exclude_unset)`, migration `batch_alter_table`, MUI Chip/Select, `formatAmount`.

## Standards áp dụng

- **database/migrations** — migration #7 upgrade/downgrade + server_default; áp + no-op.
- **api/naming + testing (TDD)** — field optional/default; test BE trước; giữ 153 pytest + 34 vitest.
- **frontend/forms-ui** — select i18n; chip màu theo loại; dải tổng; i18n đầy đủ.
- **ci** — `ruff format --check` trước push ([[ci-ruff-format-check]]).

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
BP_DATABASE_URL="sqlite:///./budget_planner.db" .venv/bin/alembic upgrade head   # migration #7
.venv/bin/python -m pytest -q && .venv/bin/ruff check . && .venv/bin/ruff format --check .
cd ../frontend && npm test && npm run build
# live :5173 — Goals: loại quỹ (chip) + dải tổng theo loại
```
Kịch bản: mục tiêu có loại quỹ · chip màu theo loại · dải tổng Khẩn cấp/Dài hạn/Chung · migration áp + no-op. Test BE+FE + build + format xanh.
