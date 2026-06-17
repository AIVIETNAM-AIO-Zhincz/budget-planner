# Budget Planner — Categories + Budgets (backend) — Shaping Notes

## Scope

Thêm 2 resource slice backend **Categories** và **Budgets** (Full CRUD) cho Budget Planner, kèm **logic phát hiện vượt ngân sách** (publish `BudgetExceeded`). Mô phỏng đúng pattern slice `/transactions`. Backend-only; wiring FE là follow-up.

## Decisions

- **Full CRUD** cho cả hai (create/list/get/update/delete).
- **GET /budgets** trả kèm `spent_amount` + `remaining` + `percent` theo period (FE vẽ progress).
- **Phát hiện vượt ngân sách inline** trong `create_transaction` (không thêm event handler riêng); vượt → `event_bus.publish(BudgetExceeded(...))`. Handler `notify_budget_exceeded` (đã có) log cảnh báo.
- **Khớp budget ↔ transaction theo TÊN danh mục**: `Budget.category_id → Category.name` so với `Transaction.category_name` (transaction hiện lưu category dạng text).
- Vượt khi `spent > limit` (chi đúng = limit chưa tính vượt); chỉ `type=="expense"`.
- **Không cần migration mới** — model `Category`/`Budget` + bảng đã có trong init migration.
- TDD: viết test trước. Nhánh `feature/budget-planner-categories-budgets` từ `develop`.

## Context

- **Visuals:** Không.
- **References:** slice `/transactions` (`app/api/transactions.py`, `app/schemas/transaction.py`), `app/api/audit.py`, `tests/test_transactions.py` + `conftest.py`, event `BudgetExceeded` + handler `notify_budget_exceeded` (đã có), model `Category`/`Budget` (đã có).
- **Product alignment:** Roadmap Phase 0 — "Danh mục + ngân sách theo danh mục/tháng + cảnh báo vượt". Mở khoá dữ liệu cho 2 trang FE Categories/Budgets (đang placeholder).

## Standards Applied

- **api/fastapi** — router theo tài nguyên, Pydantic schema, HTTP code đúng (404/422), lọc theo `space_id`, **audit log cho hành động xoá**.
- **testing/tdd** — viết test trước; happy + biên; test độc lập.
- **naming** — `snake_case` file/biến, `PascalCase` class; bảng số nhiều.
- **database/migrations** — không revision mới; verify model↔migration khớp (autogenerate "no changes").
- **coding-style** — type hint + docstring tiếng Việt; helper thuần; YAGNI.
