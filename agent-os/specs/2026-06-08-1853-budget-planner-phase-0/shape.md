# Budget Planner Phase 0 — Shaping Notes

## Scope

Spec đầu tiên của sản phẩm Budget Planner, bao trọn **Phase 0** của roadmap: auth (đăng ký/đăng nhập), không gian (Space) + phân quyền (RBAC) cơ bản, ví, giao dịch, danh mục, ngân sách + cảnh báo vượt, báo cáo cơ bản, và **AI tự phân loại giao dịch**.

Phiên thực thi đầu giao: **scaffold kiến trúc + 1 vertical slice (Transactions) chạy end-to-end + lưu spec**. Phần còn lại của Phase 0 để team build song song theo vai trò.

## Decisions

- **Frontend: React (Vite)**, **Backend: FastAPI** → kiến trúc tách FE/BE qua REST API.
- **DB: SQLite + SQLAlchemy** (dev), thiết kế sẵn để lên PostgreSQL.
- **Migrations: Alembic** (autogenerate từ SQLAlchemy metadata).
- **AI: scikit-learn baseline** cho phân loại giao dịch, có **fallback rule** khi không chắc.
- Mọi thực thể gắn **`space_id`** (cô lập dữ liệu + chuẩn bị cho RBAC).
- **Event-Driven Architecture:** event bus in-process (`app/events/`); `TransactionCreated` → handler audit log + kiểm tra ngân sách (`BudgetExceeded`). Giữ giao diện để sau lên broker (Kafka/RabbitMQ).
- **Deploy: Docker** + `docker-compose` (Postgres + backend + frontend).
- **CI/CD: GitHub Actions** — ruff + alembic + pytest + docker build.
- **TDD bắt buộc:** test trước; happy path + 422 (validation) + 403 (quyền) + fallback AI.
- **Mono-repo:** `Makefile` + `README` + `.gitignore` ở gốc `budget-planner/`.

## Context

- **Visuals:** None (chưa có mockup).
- **References:** Greenfield — chưa có code app trong repo. Tham chiếu ngoài: FastAPI docs, Alembic docs, data model Firefly III (open source).
- **Product alignment:** Khớp `agent-os/product/mission.md` + `roadmap.md` (Phase 0) + `tech-stack.md`. Sản phẩm AI-first + RBAC.

## Slice còn lại của Phase 0 (cho team — chia theo vai trò)

| Slice | Vai trò chủ trì |
|---|---|
| Auth (đăng ký/đăng nhập, JWT) | Tech Leader / Pipeline |
| Space + RBAC (Owner/Admin/Member/Viewer) + audit log | Tech Leader |
| Categories + Budgets + cảnh báo vượt | Model |
| Reports / dashboard (biểu đồ) | Pipeline / Data |
| AI phân loại nâng cao + dataset + eval | Data + Model |

## Standards Applied

- `coding-style` — phong cách Python.
- `naming` — đặt tên code + bảng/cột DB.
- `api/fastapi` — router/schema, RBAC, space isolation, audit log.
- `testing/tdd` — pytest, test trước, case biên + lỗi quyền.
- `database/migrations` — quy ước Alembic (mới).
