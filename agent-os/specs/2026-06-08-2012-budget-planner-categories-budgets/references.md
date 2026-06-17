# References for Categories + Budgets

## Slice mẫu để mô phỏng

### Transactions slice (vertical slice end-to-end)

- **Location:** `conquer/budget-planner/backend/app/api/transactions.py`, `app/schemas/transaction.py`
- **Relevance:** Khuôn cho router (APIRouter prefix/tags, `Depends(get_db)`, `Depends(get_current_space_id)`, POST 201, GET lọc space_id, publish event) và schema (Base→Create→Read, `ConfigDict(from_attributes=True)`, `Field(gt=0, pattern=...)`).

### Audit router (list-only + schema inline)

- **Location:** `conquer/budget-planner/backend/app/api/audit.py`
- **Relevance:** Mẫu router list đơn giản.

### Tests

- **Location:** `conquer/budget-planner/backend/tests/test_transactions.py`, `tests/conftest.py`
- **Relevance:** Style test (TestClient, header `X-Space-Id`, assert status/json, cô lập space, event→audit). Fixture `_fresh_db` (autouse) + `client` đã có.

## Đã tồn tại — KHÔNG sửa

- **Models:** `app/models/__init__.py` — `Category(id, space_id, name, parent_id, type)`, `Budget(id, space_id, category_id, period, limit_amount)`, `Transaction(... category_name, date ...)`, `AuditLog`.
- **Migration:** `alembic/versions/5fb2d5eb9124_init_schema.py` — bảng `categories`, `budgets` đã tạo.
- **Event:** `app/events/events.py` — `BudgetExceeded(space_id, category_name, period, limit_amount, spent_amount)`.
- **Handler:** `app/events/handlers.py` — `notify_budget_exceeded` (log warning "Vượt ngân sách"), đã đăng ký trong `register_handlers()`.
- **Bus:** `app/events/bus.py` — `event_bus.publish(...)`.

## Hạ tầng dùng lại

- `app/core/db.py` — `get_db` (Depends), `SessionLocal`, `Base`, `engine`.
- `app/rbac/__init__.py` — `get_current_space_id` (header `X-Space-Id` → default).
