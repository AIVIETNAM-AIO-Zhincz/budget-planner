# References for README + tài liệu

## Nguồn sự thật (đọc để viết chính xác)

- `conquer/budget-planner/backend/requirements.txt` — danh sách dependency.
- `conquer/budget-planner/backend/app/api/*.py` — 13 router (auth, spaces, members, categories, budgets, wallets, transactions, recurring, goals, reports, assistant, notifications, audit).
- `conquer/budget-planner/backend/app/core/config.py` — biến `BP_*`.
- `conquer/budget-planner/backend/alembic/versions/*` — 4 migration.
- `conquer/budget-planner/docker-compose.yml` + `backend/Dockerfile` + `frontend/Dockerfile` — cách chạy container, cổng, migrate.
- `conquer/budget-planner/frontend/package.json` — scripts (dev/build/preview) + deps; `VITE_API_URL`.
- `.github/workflows/{budget-planner.yml,ci.yml}` — pipeline ruff + pytest + docker build.
- Lịch sử 18 PR (#1–#18) — nội dung CHANGELOG.
