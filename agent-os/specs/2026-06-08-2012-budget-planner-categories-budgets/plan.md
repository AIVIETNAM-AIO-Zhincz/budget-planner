# Budget Planner — Backend Categories + Budgets (CRUD + cảnh báo vượt ngân sách)

## Context

Roadmap Phase 0 cần "Danh mục + ngân sách theo danh mục/tháng + cảnh báo vượt". Backend hiện mới có slice `/transactions` (+ `/audit-logs`); các trang FE Categories/Budgets đang là placeholder vì **chưa có API**. Spec này thêm 2 resource slice **Categories** và **Budgets** (Full CRUD) cùng **logic phát hiện vượt ngân sách**, mô phỏng đúng pattern slice `/transactions`.

**Phát hiện then chốt (đã khảo sát):**
- **Model `Category` + `Budget` và bảng DB ĐÃ tồn tại** trong `app/models/__init__.py` và init migration `5fb2d5eb9124_init_schema.py` → **KHÔNG cần migration mới**.
- **Event `BudgetExceeded` + handler `notify_budget_exceeded` ĐÃ có sẵn** và đã đăng ký trong `register_handlers()`, nhưng **chưa nơi nào publish**.
- Pattern mô phỏng: router (`app/api/transactions.py`) · schema (`app/schemas/transaction.py`) · wire (`app/main.py`) · test (`tests/test_transactions.py` + `conftest.py`).

**Quyết định đã chốt:**
- **Full CRUD** cho cả Categories & Budgets (create/list/get/update/delete).
- **GET /budgets** tính sẵn `spent_amount` + `remaining` + `percent` theo period (cho FE vẽ progress).
- **Phát hiện vượt ngân sách inline** trong `create_transaction` (không dùng event handler riêng); vượt thì `event_bus.publish(BudgetExceeded(...))`.
- Phạm vi **backend-only**; wiring FE Categories/Budgets là follow-up.
- Nhánh: `feature/budget-planner-categories-budgets` từ `develop` (GitFlow). **TDD: viết test trước.**

## Mô hình dữ liệu (đã có sẵn — không sửa)

- `Category(id, space_id→spaces, name, parent_id→categories|null, type "income"|"expense")`
- `Budget(id, space_id→spaces, category_id→categories|null, period "YYYY-MM", limit_amount float)`
- `Transaction` lưu `category_name` (text) + `category_id` (null, hiện không set). → **Khớp budget↔transaction theo TÊN danh mục**: resolve `Budget.category_id → Category.name`, so với `Transaction.category_name`.

---

## Task 1 — Lưu tài liệu spec

Tạo `agent-os/specs/2026-06-08-2012-budget-planner-categories-budgets/` gồm `plan.md`, `shape.md`, `standards.md` (trích `api/fastapi`, `naming`, `coding-style`, `testing/tdd`, `database/migrations`), `references.md` (trỏ slice transactions + model/event đã có), `visuals/` (rỗng).

## Task 2 — Schemas (viết cùng test)

- `app/schemas/category.py`: `CategoryBase(name: str max_length=255; type: str pattern="^(income|expense)$" default "expense"; parent_id: str|None=None)` → `CategoryCreate` → `CategoryUpdate` (mọi field Optional, partial) → `CategoryRead(ConfigDict(from_attributes=True); id; space_id; +Base)`.
- `app/schemas/budget.py`: `BudgetBase(category_id: str|None; period: str pattern="^\\d{4}-\\d{2}$"; limit_amount: float Field(gt=0))` → `BudgetCreate` → `BudgetUpdate` (partial) → `BudgetRead(from_attributes; id; space_id; limit_amount; category_id; period)` và `BudgetStatusRead(BudgetRead + spent_amount: float; remaining: float; percent: float)` dùng cho list/get.

## Task 3 — Service tính chi tiêu (hàm thuần, tái dùng)

`app/services/budget.py`:
- `resolve_category_name(db, space_id, category_id) -> str | None` — lấy `Category.name` theo (space_id, id).
- `spent_for_period(db, space_id, category_name, period) -> float` — `SUM(amount)` các Transaction `type=="expense"` cùng space, `category_name` khớp, `strftime("%Y-%m", date)==period`. Dùng `func.sum` + filter; SQLite dùng so khớp `date LIKE 'YYYY-MM%'` (hoặc lọc bằng `func.strftime`). Trả 0.0 nếu None.
- `budget_status(db, budget) -> tuple[float,float,float]` — (spent, remaining=limit-spent, percent=spent/limit*100 nếu limit>0). Dùng cho `BudgetStatusRead` và cho overflow check.

## Task 4 — Router Categories (`app/api/categories.py`)

`APIRouter(prefix="/categories", tags=["categories"])`, mọi handler `db=Depends(get_db)`, `space_id=Depends(get_current_space_id)`:
- `POST ""` 201 → tạo `Category(space_id=space_id, ...)`, commit/refresh → `CategoryRead`.
- `GET ""` → `select(Category).where(space_id==)` → list.
- `GET "/{id}"` → lấy theo (id, space_id); không có → `HTTPException(404)`.
- `PATCH "/{id}"` → `model_dump(exclude_unset=True)` áp lên row; 404 nếu không thuộc space.
- `DELETE "/{id}"` 204 → xoá; ghi **AuditLog**(action="category.deleted", target=id) (mirror handler audit, hành động nhạy cảm theo `api/fastapi`).

## Task 5 — Router Budgets (`app/api/budgets.py`)

`APIRouter(prefix="/budgets", tags=["budgets"])`, deps như trên:
- `POST ""` 201 → tạo `Budget` → trả `BudgetStatusRead` (spent tính qua `budget_status`).
- `GET ""` → list budgets của space, mỗi cái kèm spent/remaining/percent.
- `GET "/{id}"` → `BudgetStatusRead`; 404 nếu khác space.
- `PATCH "/{id}"` → cập nhật `limit_amount`/`period`/`category_id` (partial) → `BudgetStatusRead`.
- `DELETE "/{id}"` 204 → xoá + AuditLog(action="budget.deleted").

## Task 6 — Overflow check inline + wire app

- Trong `app/api/transactions.py` `create_transaction`, **sau commit** (chỉ khi `tx.type=="expense"`):
  - `period = tx.date.strftime("%Y-%m")`
  - tìm `Category` theo (space_id, name==tx.category_name); nếu có → tìm `Budget` theo (space_id, category_id==cat.id, period).
  - nếu có budget: `spent = spent_for_period(...)` (đã gồm tx vừa thêm); nếu `spent > budget.limit_amount` → `event_bus.publish(BudgetExceeded(space_id, category_name=tx.category_name, period, limit_amount, spent_amount=spent))`.
- `app/main.py`: `from app.api import budgets, categories` + `app.include_router(categories.router)` + `app.include_router(budgets.router)`.
- Giữ router mỏng: logic check gọi helper trong `app/services/budget.py`.

## Task 7 — Tests (TDD — viết trước implement mỗi slice)

- `tests/test_categories.py`: create→201; list cô lập theo `X-Space-Id`; get 404 khác space; patch đổi tên; delete→204 rồi get→404; validation `type` sai→422.
- `tests/test_budgets.py`: create→201; period sai (vd "2026-6")→422; limit_amount≤0→422; GET kèm spent: tạo category "Ăn uống" + budget period hiện tại + vài transaction expense → assert `spent_amount`/`remaining`/`percent` đúng; patch limit; delete→204.
- `tests/test_budget_overflow.py`: tạo Category "Ăn uống" + Budget limit nhỏ + period khớp; POST expense vượt limit → assert `BudgetExceeded` được phát. **Cách assert:** dùng `caplog.at_level(logging.WARNING)` kiểm message "Vượt ngân sách" từ `notify_budget_exceeded` (handler chỉ log, không ghi DB). Case biên: chi đúng = limit → KHÔNG vượt (dùng `>`); income không kích hoạt.

---

## Cấu trúc file (thêm mới / sửa)

```
backend/app/schemas/category.py        (mới)
backend/app/schemas/budget.py          (mới)
backend/app/services/budget.py         (mới — helper thuần)
backend/app/api/categories.py          (mới)
backend/app/api/budgets.py             (mới)
backend/app/api/transactions.py        (sửa — overflow check inline)
backend/app/main.py                    (sửa — include 2 router)
backend/tests/test_categories.py       (mới)
backend/tests/test_budgets.py          (mới)
backend/tests/test_budget_overflow.py  (mới)
```
KHÔNG sửa: `app/models/__init__.py`, migration (Category/Budget đã có), `events.py` (BudgetExceeded đã có), `handlers.py`.

## Standards áp dụng

- **api/fastapi** — router theo tài nguyên; Pydantic schema rõ ràng; HTTP code đúng (404 không thấy, 422 validation); mọi truy vấn lọc `space_id`; **audit log cho hành động xoá**.
- **testing/tdd** — viết test trước; happy + biên; test độc lập (fixture `_fresh_db` đã có); AI/overflow test có fallback, không assert cứng.
- **naming** — file/biến `snake_case`, class/model `PascalCase`; bảng số nhiều (`categories`,`budgets`).
- **database/migrations** — không cần revision mới; **verify** model↔migration vẫn khớp (autogenerate "no changes").
- **coding-style** — type hint + docstring tiếng Việt cho hàm public; helper thuần; YAGNI.

## Verification (chạy thử end-to-end)

1. **Test trước**: `cd conquer/budget-planner/backend && pytest -q` — toàn bộ test mới + cũ xanh (17 cũ + mới).
2. **Lint**: `ruff check app tests` sạch; (ci.yml) `ruff check .` + `ruff format --check .` sạch.
3. **Migration khớp**: `alembic upgrade head` OK; `alembic revision --autogenerate -m _tmp` ⇒ "no changes detected" (rồi xoá file tmp) — chứng minh không cần migration.
4. **Thủ công** (uvicorn `:8000`, header `X-Space-Id: demo-space`):
   - `POST /categories {"name":"Ăn uống","type":"expense"}` → 201.
   - `POST /budgets {"period":"2026-06","limit_amount":100000,"category_id":"<id>"}` → 201, `spent_amount:0`.
   - `POST /transactions {"amount":150000,"note":"ăn trưa","category_name":"Ăn uống"}` → 201; log server hiện cảnh báo "Vượt ngân sách".
   - `GET /budgets` → budget kèm `spent_amount:150000, remaining:-50000, percent:150`.
   - `GET /categories/<id-khác-space>` (đổi header) → 404 (cô lập space).
5. **CI**: mở PR → `backend-test` (ruff+alembic+pytest) và `Lint + Format + Test` xanh.
