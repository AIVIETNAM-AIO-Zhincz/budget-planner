# Budget Planner — README + tài liệu dự án

## Context

Dự án `conquer/budget-planner` đã hoàn thiện tính năng qua **18 PR** nhưng **chưa có README**. Spec này viết tài liệu (tiếng Việt) để người mới hiểu & chạy được: **README chính** + **`.env.example`** (backend) + **`CHANGELOG.md`**. **Docs-only** — không đụng code/test/migration.

**Quyết định đã chốt:**
- Ngôn ngữ: **tiếng Việt**.
- Tạo: `conquer/budget-planner/README.md`, `conquer/budget-planner/backend/.env.example`, `conquer/budget-planner/CHANGELOG.md`.
- Nhánh `feature/budget-planner-docs` từ `develop`.

## Sự thật đã khảo sát (dùng để viết chính xác)

- **Backend**: FastAPI; `app/{api,core,events,models,rbac,schemas,services,main.py}`. 13 router: auth, spaces, members, categories, budgets, wallets, transactions, recurring, goals, reports, assistant, notifications, audit. SQLAlchemy 2.0 + Alembic (4 migration: init → recurring → notifications → goals). JWT (python-jose) + bcrypt; event bus; LLM qua httpx (OpenAI-compatible). `requirements.txt` (fastapi/uvicorn/sqlalchemy/alembic/pydantic/python-jose/bcrypt/python-multipart/email-validator/psycopg2-binary/scikit-learn; pytest/httpx).
- **Frontend**: React 18 + Vite (`scripts`: dev/build/preview), MUI v5 + @mui/x-date-pickers, ECharts, react-router-dom, react-i18next (vi/en), @heroicons, @fontsource. `VITE_API_URL` cấu hình base API.
- **Config** (`core/config.py`, prefix `BP_`): `database_url`, `secret_key`, `cors_origins`(list→JSON env), `jwt_algorithm`, `access_token_expire_minutes`, `refresh_token_expire_days`, `llm_api_key`, `llm_model`, `llm_base_url`, `llm_timeout`.
- **Docker**: `docker-compose.yml` (db postgres16 + backend 8000 + frontend 5173); backend Dockerfile `CMD alembic upgrade head && uvicorn ... :8000`. CI: `.github/workflows/{budget-planner.yml,ci.yml}` (ruff + pytest + docker build).
- Không có seed script → README hướng dẫn **đăng ký tài khoản** (không hard-code credential demo).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-1312-budget-planner-docs/`.

## Task 2 — README.md chính (tiếng Việt)

`conquer/budget-planner/README.md` gồm các mục:
- **Giới thiệu** + badge nhẹ (Python/React) + 1 đoạn mô tả (quản lý chi tiêu nhiều người dùng, đa không gian).
- **Tính năng** (gạch đầu dòng, nhóm): Auth JWT + RBAC (viewer/member/admin/owner) · Không gian & thành viên · Danh mục · Ngân sách (cảnh báo vượt) · Ví & chuyển tiền · Giao dịch (lọc/tìm/Import-Export CSV) · Định kỳ · Mục tiêu tiết kiệm · Báo cáo + xuất CSV · Dashboard · Trợ lý (rule + LLM tùy chọn) · Thông báo · dark mode · i18n vi/en.
- **Công nghệ** (bảng Backend/Frontend).
- **Kiến trúc** ngắn: event-driven (event bus), RBAC theo `X-Space-Id`, Alembic migrations, LLM fallback rule.
- **Cấu trúc thư mục** (cây rút gọn backend/frontend).
- **Chạy cục bộ**: Backend (`python -m venv .venv` → `pip install -r requirements.txt` → `alembic upgrade head` → `uvicorn app.main:app --reload`), Frontend (`npm install` → `npm run dev`); link :8000/docs (Swagger) + :5173. Đăng ký tài khoản qua UI.
- **Chạy bằng Docker**: `docker compose up --build` (tự migrate); cổng 8000/5173, Postgres.
- **Biến môi trường**: bảng `BP_*` (trỏ tới `.env.example`) + `VITE_API_URL` (FE).
- **API** (tóm tắt nhóm endpoint + link Swagger `/docs`).
- **Kiểm thử & chất lượng**: `pytest`, `ruff check`/`ruff format`, CI (GitHub Actions). Migrations (`alembic`).
- **Bật Trợ lý LLM**: export `BP_LLM_API_KEY` (+ base_url/model); không key → rule-based.
- **Giấy phép / ghi chú học tập** (AIO 2026).

## Task 3 — .env.example + CHANGELOG.md

- `backend/.env.example`: liệt kê `BP_*` kèm chú thích + giá trị mẫu an toàn (KHÔNG key thật): `BP_DATABASE_URL`, `BP_SECRET_KEY`, `BP_CORS_ORIGINS` (dạng JSON list), `BP_ACCESS_TOKEN_EXPIRE_MINUTES`, `BP_REFRESH_TOKEN_EXPIRE_DAYS`, `BP_LLM_API_KEY` (trống), `BP_LLM_MODEL`, `BP_LLM_BASE_URL`, `BP_LLM_TIMEOUT`. (Đảm bảo `.env` đã trong .gitignore — kiểm tra.)
- `CHANGELOG.md` (Keep a Changelog, tiếng Việt): nhóm **18 PR** thành các phần Added/Changed theo dòng tính năng; gắn `## [0.1.0-phase0] - 2026-06-09` (Unreleased→phase0) — tiền đề cho release tag sau.

## Task 4 — Verify + giao nộp

- Kiểm: tên biến trong `.env.example` khớp `Settings` (prefix `BP_` + field hoa); lệnh chạy trong README đúng (alembic/uvicorn/npm/docker compose); markdown không lỗi cú pháp (xem nhanh); link nội bộ hợp lệ.
- Không cần build (docs); xác nhận `git status` chỉ thêm file docs.
- Commit/push/PR vào `develop` sau khi người dùng xác nhận.

---

## Cấu trúc file

```
conquer/budget-planner/README.md         (mới)
conquer/budget-planner/backend/.env.example (mới)
conquer/budget-planner/CHANGELOG.md       (mới)
```
Không sửa code; không migration/test. Nội dung lấy từ "Sự thật đã khảo sát" ở trên.

## Standards áp dụng

- **docs/writing** — tiếng Việt rõ ràng, có ví dụ lệnh chạy được, không hard-code bí mật.
- **naming/coding-style** — không thêm code/dep; chỉ tài liệu. `.env.example` không chứa key thật.

## Verification (lệnh)

```bash
# kiểm biến .env.example khớp config (mắt thường) + .env trong .gitignore
grep -n "\.env" ../../.gitignore conquer/budget-planner/.gitignore 2>/dev/null
# (tuỳ chọn) thử lệnh trong README trên môi trường sạch
```
Kịch bản: người mới đọc README → dựng được backend+frontend (local hoặc docker), hiểu biến môi trường, biết cách test/CI và bật LLM.
