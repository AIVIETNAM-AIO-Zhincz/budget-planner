# README + tài liệu — Shaping Notes

## Scope

Viết tài liệu tiếng Việt cho `conquer/budget-planner`: README chính + `backend/.env.example` + `CHANGELOG.md`. Docs-only, không đụng code.

## Decisions

- Tiếng Việt. 3 file: README.md, backend/.env.example, CHANGELOG.md.
- Không hard-code credential demo (hướng dẫn đăng ký). `.env.example` không chứa key thật.

## Context

- **Visuals:** None.
- **References:** `backend/requirements.txt`, `app/api/*` (13 router), `core/config.py` (BP_*), `docker-compose.yml` + Dockerfile, `frontend/package.json`, `alembic/versions` (4 migration), CI workflows.
- **Product alignment:** Chốt tài liệu sau 18 PR (Phase 0–1).

## Standards Applied

- **docs/writing** — rõ ràng, lệnh chạy được, không lộ bí mật.
- **naming/coding-style** — chỉ tài liệu, không thêm code/dep.
