# Budget Planner

> **Trợ lý tài chính AI cho cá nhân và hộ gia đình:** ghi chép bằng ngôn ngữ tự nhiên,
> tự phân loại, dự báo & gợi ý tiết kiệm — an toàn, trực quan, có phân quyền rõ ràng.

Ứng dụng web quản lý thu chi **đa người dùng, đa không gian (space)** với **phân quyền theo
tài nguyên (RBAC)**: ngân sách, ví, mục tiêu tiết kiệm, giao dịch định kỳ, báo cáo, trợ lý hội
thoại và thông báo. Sản phẩm **AI-first** — AI là trụ cột xuyên suốt chứ không phải tính năng phụ.

Dự án thực hiện trong chương trình **AIO Conquer 2026** (project song hành cùng khoá AIO2026 của AI Việt Nam).

![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb)
![DB](https://img.shields.io/badge/DB-PostgreSQL%20%2F%20SQLite-336791)

---

## Tính năng chính

- **Xác thực & phân quyền (RBAC)** — đăng nhập JWT; vai trò `viewer < member < admin < owner`, giới hạn theo từng tài nguyên.
- **Không gian & thành viên** — mỗi người một không gian riêng; mời thành viên, gán vai trò; dữ liệu cô lập theo không gian.
- **Ngân sách & ví** — hạn mức theo danh mục/tháng (cảnh báo khi vượt); ví cash/bank/e-wallet, chuyển tiền, số dư tự cập nhật.
- **Giao dịch** — CRUD, lọc & tìm kiếm, import/export CSV; **giao dịch định kỳ** tự sinh khi đến hạn.
- **Mục tiêu tiết kiệm & báo cáo** — theo dõi tiến độ; tổng hợp theo thời gian, top danh mục, biểu đồ, xuất CSV.
- **Trợ lý AI** — nhập giao dịch bằng ngôn ngữ tự nhiên + hỏi-đáp số liệu; rule-based, nâng cấp LLM tuỳ chọn (số liệu luôn tính từ cơ sở dữ liệu, không để mô hình bịa số).
- **Thông báo & giao diện** — chuông đếm chưa đọc; MUI, dark mode, đa ngôn ngữ vi/en, biểu đồ ECharts.

## Công nghệ

| Lớp | Công nghệ |
| --- | --- |
| **Backend** | FastAPI · SQLAlchemy 2.0 · Alembic · Pydantic v2 · JWT (python-jose) · kiến trúc hướng sự kiện (Event-Driven) |
| **Frontend** | React 18 · Vite · MUI v5 · ECharts · react-router-dom · react-i18next |
| **Cơ sở dữ liệu** | PostgreSQL (production/Docker) · SQLite (dev mặc định) |
| **Chất lượng** | pytest · ruff · GitHub Actions (CI) · Docker · phát triển theo TDD |

## Cấu trúc thư mục

```
budget-planner/      # Ứng dụng: backend (FastAPI) + frontend (React/Vite), docker-compose, Makefile
docs/                # Tài liệu sản phẩm
├── product-description.md   # Mô tả sản phẩm end-to-end (AI-first, RBAC)
└── product-backlog.md       # Backlog tính năng
report-template/     # Kit LaTeX để soạn báo cáo project
BRANCHING.md         # Quy ước nhánh (GitFlow gọn)
```

## Bắt đầu nhanh

```bash
cd budget-planner

# Cách 1 — chạy toàn bộ bằng Docker (backend + frontend + PostgreSQL)
make up           # khởi động;  make down để dừng

# Cách 2 — chạy dev tách lớp
make backend-install && make migrate && make backend-dev   # API FastAPI
make frontend-install && make frontend-dev                 # giao diện React

make test         # chạy test backend (pytest)
```

Chi tiết cài đặt, biến môi trường và kiến trúc xem trong [`budget-planner/README.md`](budget-planner/README.md).

## Tài liệu

- [`docs/product-description.md`](docs/product-description.md) — mô tả sản phẩm hoàn chỉnh: luồng đăng nhập → quản lý chi tiêu → chia sẻ hộ gia đình → phân quyền (RBAC), với AI làm trụ cột.
- [`docs/product-backlog.md`](docs/product-backlog.md) — backlog tính năng.
- [`BRANCHING.md`](BRANCHING.md) — chiến lược nhánh.
