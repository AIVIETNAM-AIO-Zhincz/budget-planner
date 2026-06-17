# Budget Planner — Phân loại Nhu cầu/Mong muốn/Lãng phí (Phase 2, feature #1)

## Context

Lấy cảm hứng từ template Excel "Monthly Budget" (mục *Phân loại giao dịch chi*: Bắt buộc/Tùy chọn/Lãng
phí). Thêm thuộc tính **mức cần thiết** (`need_level`) cho **danh mục chi**, rồi báo cáo **% chi theo
nhóm** (kiểu 50/30/20) ở trang Báo cáo. Giúp người dùng thấy bao nhiêu tiền là thiết yếu vs lãng phí.
Đây là feature #1 trong 4 feature Phase 2 (làm tuần tự, mỗi cái 1 PR).

**Quyết định đã chốt:** `need_level ∈ {mandatory, optional, wasteful}` (mặc định `optional`), gắn ở
**Category**; transaction map sang need_level qua `category_name` + space. Nhánh
`feature/budget-planner-need-level` từ `develop`. **Migration #5** (down_revision = `380e5fac27d4`).
Giá trị nội bộ tiếng Anh; hiển thị tiếng Việt qua i18n.

## Sự thật đã khảo sát

- **Model** `app/models/__init__.py` Category (id, space_id, name, parent_id, type) → thêm `need_level: Mapped[str] = mapped_column(String(16), default="optional")`.
- **Schema** `schemas/category.py`: `CategoryBase` dùng `Field(pattern=...)`. Thêm `need_level` (Base default+pattern; Update optional).
- **Router** `api/categories.py`: create map field thủ công (`name/type/parent_id`) → thêm `need_level=payload.need_level`; update dùng `model_dump(exclude_unset=True)+setattr` (tự xử lý).
- **Alembic** head = `380e5fac27d4`. Pattern `batch_alter_table` + `add_column(... server_default="optional", nullable=False)` cho dữ liệu cũ.
- **Reports** `services/report.py build_summary` group `by_category` theo `Transaction.category_name`. Transaction lưu `category_name` (string) → map need_level bằng LEFT JOIN `Category` trên `name`+`space_id`, `coalesce(need_level,'optional')`. Schema `schemas/report.py ReportSummary` thêm `by_need_level`.
- **FE** `CategoryFormDialog` (name + ToggleButtonGroup type + parent) → thêm select need_level; `api/categories.js` create/update thêm `need_level`; `Categories.jsx` (card, `isIncome` dòng 42) → chip need_level cho chi. `Reports.jsx` + `utils/charts.js pieOption` tái dùng cho donut.
- **Tests** `test_categories.py`/`test_reports.py` pattern rõ; thêm test mới, giữ test cũ (field optional/default).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-11-0953-budget-planner-need-level/`.

## Task 2 — BE: Category.need_level + migration (TDD)

- Model: thêm cột `need_level` (String(16), default "optional").
- Schema `category.py`: `CategoryBase.need_level: str = Field(default="optional", pattern="^(mandatory|optional|wasteful)$")`; `CategoryUpdate.need_level: str | None = Field(default=None, pattern=...)`.
- Router create: thêm `need_level=payload.need_level`.
- **Migration #5** `add_need_level_to_categories` (down_revision `380e5fac27d4`): `add_column categories.need_level String(16) server_default="optional" nullable=False`; downgrade drop_column. Áp vào DB demo + verify no-op lần 2.
- **Test** `test_categories.py`: tạo có need_level → trả đúng; không gửi → default "optional"; pattern sai → 422.

## Task 3 — BE: report by_need_level (TDD)

- `report.py build_summary`: thêm truy vấn LEFT JOIN Category (name+space) → group `coalesce(need_level,'optional')`, sum expense → `by_need_level=[{need_level, amount}]`.
- `schemas/report.py`: `NeedLevelAmount{need_level:str, amount:float}` + `ReportSummary.by_need_level: list[NeedLevelAmount]`.
- **Test** `test_reports.py`: tạo category need_level + transaction → `by_need_level` đúng nhóm + amount.

## Task 4 — FE: form danh mục + danh sách

- `CategoryFormDialog`: thêm select `need_level` (3 lựa chọn i18n), hiện khi `type==="expense"`; payload thêm `need_level`. `api/categories.js` create/update kèm `need_level`.
- `Categories.jsx`: với danh mục chi, hiện chip nhỏ need_level (màu: mandatory xanh lá, optional xanh dương, wasteful cam/đỏ).

## Task 5 — FE: widget Báo cáo "% chi theo nhóm cần thiết"

- `Reports.jsx`: `needLevelData = by_need_level.map(...)` (tên i18n + màu theo nhóm); thêm `ChartCard` donut (`pieOption`) `.gsap-in`. Helper `needLevelColor(level)`.
- i18n vi/en: `needLevel.{mandatory,optional,wasteful}`, `reports.byNeedLevel`, `categories.form.needLevel*`.

## Task 6 — Verify + giao nộp

- `pytest` (143 + mới) xanh; `ruff` sạch; **alembic upgrade head áp migration #5** + no-op lần 2. `npm test` + `npm run build` xanh.
- **Live** (BE :8000 + FE :5173): đặt need_level cho vài danh mục chi → Báo cáo hiện donut % Bắt buộc/Tùy chọn/Lãng phí; chip ở trang Danh mục.
- Commit/push/PR vào `develop`; CI 5 check (gồm alembic).

---

## Cấu trúc file

```
backend/app/models/__init__.py             (sửa — Category.need_level)
backend/app/schemas/category.py            (sửa — need_level Base/Update)
backend/app/schemas/report.py              (sửa — NeedLevelAmount + by_need_level)
backend/app/api/categories.py              (sửa — create map need_level)
backend/app/services/report.py             (sửa — by_need_level JOIN Category)
backend/alembic/versions/<rev>_add_need_level_to_categories.py  (mới — migration #5)
backend/tests/{test_categories,test_reports}.py   (sửa — test mới)
frontend/src/components/CategoryFormDialog.jsx     (sửa — select need_level)
frontend/src/api/categories.js             (sửa — need_level)
frontend/src/pages/Categories.jsx          (sửa — chip need_level)
frontend/src/pages/Reports.jsx             (sửa — donut by_need_level)
frontend/src/i18n/locales/{vi,en}.json     (sửa — needLevel.*, reports.byNeedLevel, form)
```
Tái dùng: `get_owned_or_404`, `model_dump(exclude_unset=True)`, `pieOption`, `ChartCard`, pattern migration `batch_alter_table`. Transaction→need_level qua category_name+space (LEFT JOIN, coalesce 'optional').

## Standards áp dụng

- **database/migrations** — migration #5 có upgrade/downgrade + `server_default` cho dữ liệu cũ; áp + no-op verify.
- **api/naming + testing (TDD)** — field optional/default (không phá test cũ); test BE trước; giữ 143 pytest + 34 vitest xanh.
- **frontend/forms-ui** — select i18n; donut có màu nhóm; reduced-motion (donut qua ChartCard).

## Verification (lệnh)

```bash
cd conquer/budget-planner/backend
BP_DATABASE_URL="sqlite:///./budget_planner.db" .venv/bin/alembic upgrade head   # áp migration #5
.venv/bin/python -m pytest -q && .venv/bin/ruff check .
cd ../frontend && npm test && npm run build
# live :5173 — đặt need_level danh mục chi → Báo cáo donut % nhóm; chip Danh mục
```
Kịch bản: danh mục chi có need_level · Báo cáo donut % Bắt buộc/Tùy chọn/Lãng phí · chip ở Danh mục. Migration áp + no-op. Test BE+FE + build xanh.
