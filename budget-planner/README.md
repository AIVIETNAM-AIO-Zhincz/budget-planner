# Budget Planner — Quản lý chi tiêu cá nhân & nhóm

> Ứng dụng quản lý thu chi **nhiều người dùng, đa không gian (space)** có phân quyền (RBAC):
> ngân sách, ví, mục tiêu tiết kiệm, báo cáo, trợ lý hội thoại và thông báo.
> Mono-repo **backend (FastAPI)** + **frontend (React/Vite)**, kiến trúc **hướng sự kiện (Event-Driven)**,
> migrations bằng **Alembic**, deploy **Docker**, CI qua **GitHub Actions**, phát triển theo **TDD**.
> Thuộc project **AIO Conquer 2026** (AI Việt Nam — khoá AIO 2026).

![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb)
![DB](https://img.shields.io/badge/DB-PostgreSQL%20%2F%20SQLite-336791)
![Tests](https://img.shields.io/badge/Tests-pytest%20139-success)

> 📄 Tài liệu sản phẩm: [`../docs/product-description.md`](../docs/product-description.md) ·
> Backlog: [`../docs/product-backlog.md`](../docs/product-backlog.md) ·
> Spec: [`../../agent-os/specs/`](../../agent-os/specs/)

---

## Tính năng

- **Xác thực & phân quyền (RBAC)** — đăng ký/đăng nhập JWT (access + refresh, tự refresh khi 401);
  vai trò `viewer < member < admin < owner`.
- **Không gian (space) & thành viên** — mỗi người có không gian riêng; mời thành viên, gán vai trò;
  dữ liệu cô lập theo header `X-Space-Id`.
- **Danh mục** — cây thu/chi (cha–con), gợi ý danh mục tự động.
- **Ngân sách** — hạn mức theo danh mục/tháng, **cảnh báo khi vượt** (event-driven).
- **Ví & chuyển tiền** — cash/bank/e-wallet; chuyển tiền giữa ví; số dư tự cập nhật theo giao dịch.
- **Giao dịch** — CRUD, lọc (loại/danh mục/tháng) + tìm theo ghi chú, gắn ví; **Import/Export CSV**.
- **Định kỳ (recurring)** — mẫu giao dịch ngày/tuần/tháng, tự sinh khi đến hạn (catch-up).
- **Mục tiêu tiết kiệm (goals)** — gắn ví tiết kiệm, "góp" = chuyển tiền, thanh tiến độ.
- **Báo cáo** — tổng hợp theo khoảng thời gian, top danh mục, biểu đồ; **xuất CSV**.
- **Dashboard** — thẻ tổng, biểu đồ, ngân sách, ví, giao dịch gần đây, định kỳ sắp tới, mục tiêu.
- **Trợ lý hội thoại** — nhập giao dịch bằng ngôn ngữ tự nhiên + hỏi-đáp số liệu; **rule-based**,
  nâng cấp **LLM (OpenAI-compatible) tuỳ chọn** (fallback rule khi không có key).
- **Thông báo (chuông)** — vượt ngân sách / mời thành viên / định kỳ chạy; badge đếm chưa đọc.
- **Giao diện** — MUI, **dark mode**, đa ngôn ngữ **vi/en**, biểu đồ ECharts.

## Công nghệ

| Lớp | Công nghệ |
| --- | --- |
| **Backend** | FastAPI · SQLAlchemy 2.0 · Alembic · Pydantic v2 · python-jose (JWT) · bcrypt · httpx (LLM) · event bus nội bộ |
| **Frontend** | React 18 · Vite · MUI v5 + x-date-pickers · ECharts · react-router-dom · react-i18next · dayjs |
| **CSDL** | PostgreSQL (production/docker) · SQLite (dev mặc định) |
| **Chất lượng** | pytest · ruff (lint + format) · GitHub Actions (CI) · Docker |

## Kiến trúc hướng sự kiện (Event-Driven)

Tạo giao dịch → phát event `TransactionCreated` → các handler xử lý **độc lập** (ghi audit log,
kiểm tra ngân sách → có thể phát `BudgetExceeded` → sinh thông báo). Phase 0 dùng **event bus
in-process** (`backend/app/events/`); giữ nguyên giao diện khi chuyển sang broker thật (Kafka/RabbitMQ).

Điểm kiến trúc khác:

- **RBAC theo không gian** — request gửi `X-Space-Id`; `require_min_role()` chặn theo vai trò.
- **Migrations** — Alembic (`make migrate`); mọi đổi schema đều qua revision.
- **Trợ lý LLM an toàn** — LLM chỉ phân loại ý định + trích giao dịch; **số liệu hỏi-đáp luôn
  tính từ DB** (không để LLM bịa số); lỗi/không key → fallback rule-based.

## Cấu trúc thư mục

```
budget-planner/
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── api/             # 13 router: auth, spaces, members, categories, budgets,
│   │   │                    #   wallets, transactions, recurring, goals, reports,
│   │   │                    #   assistant, notifications, audit
│   │   ├── core/            # config (BP_*), db, security (JWT/bcrypt)
│   │   ├── events/          # event bus + handlers (EDA)
│   │   ├── models/          # SQLAlchemy models
│   │   ├── rbac/            # dependency phân quyền
│   │   ├── schemas/         # Pydantic schema
│   │   ├── services/        # categorizer, wallet, budget, recurring, report,
│   │   │                    #   notification, assistant, llm
│   │   └── main.py
│   ├── alembic/             # migrations (4 revision)
│   ├── tests/               # pytest (139 test)
│   └── requirements.txt
├── frontend/                # React + Vite (src: pages, components, api, layout,
│                            #   auth, i18n vi/en, utils, theme)
├── docker-compose.yml       # db (postgres) + backend + frontend
├── Makefile
└── CHANGELOG.md
```

## Chạy nhanh (Makefile)

```bash
cd conquer/budget-planner

# Toàn bộ stack bằng Docker (db + backend + frontend)
make up                 # → backend :8000, frontend :5173 (tự alembic upgrade)
make down

# Hoặc dev từng phần
make backend-install    # tạo venv + cài deps
make migrate            # alembic upgrade head
make backend-dev        # uvicorn :8000  (Swagger tại /docs)
make frontend-install
make frontend-dev       # vite :5173
make test               # pytest
make lint               # ruff check + format
```

Mở http://localhost:5173, **đăng ký một tài khoản** rồi đăng nhập (chưa có seed sẵn —
mỗi tài khoản tự có một không gian riêng).

<details>
<summary>Chạy không cần Makefile (lệnh thô)</summary>

```bash
# Backend
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd ../frontend && npm install && npm run dev
```
</details>

## Biến môi trường

Backend đọc biến prefix `BP_` (xem **[`backend/.env.example`](backend/.env.example)**):

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `BP_DATABASE_URL` | `sqlite:///./budget_planner.db` | Kết nối CSDL (đổi `postgresql://...` cho prod) |
| `BP_SECRET_KEY` | `dev-secret-change-me` | Khoá ký JWT — **đổi ở production** |
| `BP_CORS_ORIGINS` | `["http://localhost:5173"]` | Origin frontend được phép (JSON list) |
| `BP_ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Hạn access token |
| `BP_REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Hạn refresh token |
| `BP_LLM_API_KEY` | *(trống)* | API key LLM — trống thì Trợ lý chạy rule-based |
| `BP_LLM_MODEL` | `gpt-4o-mini` | Model LLM |
| `BP_LLM_BASE_URL` | `https://api.openai.com/v1` | Endpoint OpenAI-compatible |

Frontend: `VITE_API_URL` (mặc định `http://localhost:8000`).

## API

Mọi endpoint cần `Authorization: Bearer <token>` (trừ `/auth/*`, `/health`) và header `X-Space-Id`.
Nhóm chính: `/auth`, `/spaces`, `/members`, `/categories`, `/budgets`, `/wallets` (+`/transfer`),
`/transactions` (+`/import`), `/recurring` (+`/run`), `/goals` (+`/{id}/contribute`),
`/reports` (`/summary`, `/export.csv`), `/assistant/message`, `/notifications`, `/audit-logs`.

👉 Tài liệu tương tác đầy đủ: **http://localhost:8000/docs** (Swagger UI).

## Kiểm thử & chất lượng

```bash
make test               # pytest (139 test)
make lint               # ruff check + format
make migrate            # áp migrations
cd frontend && npm run build
```

CI (GitHub Actions, `.github/workflows/`) chạy **ruff (lint+format) · pytest · docker build** trên mỗi PR.

## Bật Trợ lý LLM (tuỳ chọn)

```bash
export BP_LLM_API_KEY=sk-...          # OpenAI hoặc gateway tương thích
# tuỳ chọn: export BP_LLM_BASE_URL=...  export BP_LLM_MODEL=...
make backend-dev
```

Không đặt key → Trợ lý dùng parser **rule-based** (vẫn nhập giao dịch & trả lời số liệu).
Có key → LLM phân loại/trích linh hoạt hơn; số liệu vẫn tính từ DB.

## Quy ước & quy trình

- **GitFlow** — làm việc trên `develop`; tính năng → nhánh `feature/*` → PR vào `develop`;
  release qua `release/*` → tag `vX.Y.Z` trên `production`. Xem [`CHANGELOG.md`](CHANGELOG.md).
- **TDD** — viết test trước (`backend/tests/`), chạy `make test`.
- **Migrations** — mỗi đổi schema = 1 Alembic revision (`make migration m="..."`).
- **Standards** — `agent-os/standards/` (coding-style, naming, api/fastapi, testing/tdd, database/migrations).

## Ghi chú

Dự án học tập thuộc **AIO Conquer 2026**. Không commit dữ liệu nặng / bí mật (đã cấu hình `.gitignore`).
