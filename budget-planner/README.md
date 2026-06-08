# Budget Planner

Trợ lý tài chính AI có phân quyền (RBAC). Mono-repo: **backend (FastAPI)** + **frontend (React/Vite)**, kiến trúc **hướng sự kiện (Event-Driven)**, quản lý DB bằng **Alembic**, deploy bằng **Docker**, CI/CD qua **GitHub Actions**. Phát triển theo **TDD**.

> Tài liệu sản phẩm: [`../docs/product-description.md`](../docs/product-description.md) · Spec: [`../../agent-os/specs/2026-06-08-1853-budget-planner-phase-0/`](../../agent-os/specs/2026-06-08-1853-budget-planner-phase-0/)

## Cấu trúc

```
budget-planner/
├── backend/        # FastAPI + SQLAlchemy + Alembic + event bus (EDA)
├── frontend/       # React + Vite
├── docker-compose.yml
└── Makefile
```

## Kiến trúc hướng sự kiện (Event-Driven)

Tạo giao dịch → phát event `TransactionCreated` → các handler xử lý độc lập (ghi audit log, kiểm tra ngân sách → có thể phát `BudgetExceeded` → thông báo). Phase 0 dùng **event bus in-process** (`backend/app/events/`); giữ nguyên giao diện khi chuyển sang broker thật (Kafka/RabbitMQ).

## Chạy nhanh

```bash
# Toàn bộ stack bằng Docker (db + backend + frontend)
make up

# Hoặc dev từng phần
make backend-install   # tạo venv + cài deps
make migrate           # alembic upgrade head
make backend-dev       # uvicorn :8000
make test              # pytest (TDD)
make frontend-dev      # vite :5173
```

## Quy ước
- **TDD:** viết test trước (`backend/tests/`), chạy `make test`.
- **Migrations:** mỗi đổi schema = 1 Alembic revision (`make migration m="..."`).
- **Standards:** xem `agent-os/standards/` (coding-style, naming, api/fastapi, testing/tdd, database/migrations).
