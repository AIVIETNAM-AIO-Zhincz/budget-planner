# Plan — Budget Planner Phase 0 (shape-spec)

## Context

Team AIO Conquer 2026 xây sản phẩm **Budget Planner** (xem `conquer/docs/product-description.md` + `agent-os/product/`). Đây là **spec đầu tiên** dùng Agent OS, bao trọn **Phase 0** của roadmap. Mục tiêu phiên này: (1) lưu spec đầy đủ cho team, (2) **scaffold** kiến trúc đã chốt, (3) làm **một lát cắt dọc** (vertical slice) để chứng minh stack chạy end-to-end. Các feature Phase 0 còn lại được mô tả trong spec để team build song song theo vai trò.

**Lựa chọn đã chốt với user:**
- Phạm vi spec: **toàn bộ Phase 0** (auth + space/RBAC cơ bản + ví + giao dịch + danh mục + ngân sách + báo cáo + AI phân loại).
- Frontend: **React** (Vite). Backend: **FastAPI**. → kiến trúc tách FE/BE.
- DB: **SQLite + SQLAlchemy** (lên PostgreSQL sau), **migrations bằng Alembic**.
- AI: tự phân loại giao dịch (scikit-learn baseline; có fallback rule).

## Kiến trúc & vị trí code

```
conquer/budget-planner/
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── main.py          # khởi tạo app + router
│   │   ├── core/            # config, db session, security
│   │   ├── models/          # SQLAlchemy models (User, Space, Membership, Wallet,
│   │   │                    #   Category, Transaction, Budget, AuditLog)
│   │   ├── schemas/         # Pydantic
│   │   ├── api/             # routers theo tài nguyên
│   │   ├── services/        # logic ngân sách, AI phân loại
│   │   └── rbac/            # middleware/dependency kiểm tra quyền
│   ├── alembic/             # migrations (env.py + versions/)
│   ├── alembic.ini
│   ├── tests/               # pytest
│   └── requirements.txt
└── frontend/                # React + Vite
    ├── src/{pages,components,api,lib}/
    └── package.json
```

## Tasks

### Task 1 — Lưu spec documentation (Agent OS)
Tạo `agent-os/specs/2026-06-08-1853-budget-planner-phase-0/`:
- `plan.md` — bản plan này.
- `shape.md` — scope, các quyết định (full Phase 0, React+FastAPI, SQLite+Alembic, AI baseline), context.
- `standards.md` — nội dung các standard áp dụng: `coding-style`, `naming`, `api/fastapi`, `testing/tdd` (+ `database/migrations` mới).
- `references.md` — "greenfield, chưa có code tham khảo trong repo" + tham chiếu ngoài (FastAPI, Alembic, Firefly III data model).
- `visuals/` — trống (chưa có mockup).

Đồng thời cập nhật:
- `agent-os/product/tech-stack.md` — thêm **Alembic** (DB migrations) + **React/Vite**.
- Tạo standard mới `agent-os/standards/database/migrations.md` (quy ước Alembic) + cập nhật `index.yml`.

### Task 2 — Scaffold backend + DB + Alembic
- `conquer/budget-planner/backend/` với FastAPI app tối thiểu (`/health`), `requirements.txt` (fastapi, uvicorn, sqlalchemy, alembic, pydantic, pytest, httpx, scikit-learn, python-jose/passlib).
- Cấu hình DB SQLite (`core/db.py`: engine + session), khai báo **toàn bộ models Phase 0** (gắn `space_id`).
- **Khởi tạo Alembic** (`alembic init`), chỉnh `env.py` trỏ tới metadata + URL config; tạo **migration đầu tiên** (`alembic revision --autogenerate -m "init schema"`).
- Test smoke `/health` (pytest + httpx).

### Task 3 — Scaffold frontend (React + Vite)
- `conquer/budget-planner/frontend/` Vite React, client API gọi backend, 1 trang demo gọi `/health` + 1 trang Transactions (list/thêm).

### Task 4 — Vertical slice: Transactions (chứng minh stack end-to-end)
- BE: model `Transaction` → migration Alembic → schema Pydantic → router CRUD (`/transactions`) lọc theo `space_id` → test (happy path + validation).
- AI: service phân loại danh mục baseline (rule + chỗ cắm ML), test có fallback.
- FE: trang Transactions gọi API thật (list + thêm, gợi ý category từ AI).

### Task 5 — Bộ khung cho team build phần còn lại của Phase 0
Trong `shape.md` liệt kê các slice còn lại + gợi ý chia vai trò (KHÔNG code trong phiên này):
- Auth (đăng ký/đăng nhập, JWT) — *Tech Leader/Pipeline*
- Space + RBAC (Owner/Admin/Member/Viewer) — *Tech Leader*
- Categories + Budgets + cảnh báo vượt — *Model*
- Reports/dashboard (biểu đồ) — *Pipeline/Data*
- AI phân loại nâng cao + dataset — *Data + Model*

### Task 6 — (Housekeeping) Dịch description Agent OS sang tiếng Việt
Theo yêu cầu user: dịch phần mô tả của 5 lệnh trong `.claude/commands/agent-os/*.md` sang tiếng Việt.
- Lưu ý: `.claude/` gitignored + sẽ bị ghi đè nếu chạy lại `project-install.sh` → đây là tiện ích local, không bền.
- Chỉ dịch phần mô tả/heading, **giữ nguyên** cú pháp lệnh, tên bước, code block để Agent OS vẫn chạy đúng.

## Standards áp dụng
`coding-style`, `naming`, `api/fastapi` (RBAC, space isolation, audit log), `testing/tdd`, + `database/migrations` (Alembic) mới.

## Verification
- `cd conquer/budget-planner/backend && pytest` → smoke `/health` + test Transactions xanh.
- `alembic upgrade head` tạo schema SQLite không lỗi; `alembic history` thấy migration.
- Chạy `uvicorn app.main:app` + `npm run dev` (frontend) → trang Transactions list/thêm gọi API thật, AI gợi ý category.
- Kiểm thử quyền (khi có RBAC ở slice sau): Viewer sửa → 403.

## Ghi chú phạm vi
Phiên này giao **scaffold + 1 vertical slice + spec đầy đủ**; KHÔNG cố code hết Phase 0 (full Phase 0 là việc nhiều tuần của cả team — đã ghi rõ slice còn lại trong spec để chia vai trò). Đúng tinh thần "làm nhỏ chạy được trước, mở rộng sau".
