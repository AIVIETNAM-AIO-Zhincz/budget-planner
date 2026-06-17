# Bộ test Frontend (Vitest) — Shaping Notes

## Scope

Dựng Vitest + jsdom + React Testing Library; test logic-first: utils/format, utils/charts, api/client (mock fetch/localStorage), 1 component smoke (StatCard). Thêm CI job frontend-test.

## Decisions

- Logic-first (ít setup, giá trị cao). Thêm CI job `frontend-test` (npm ci && npm test).
- Không đổi code app — chỉ test + config + devDeps.

## Context

- **Visuals:** None.
- **References:** `src/utils/{format,charts}.js`, `src/api/client.js` (apiFetch/ApiError/refresh-401), `src/components/StatCard.jsx`, `vite.config.js`, `.github/workflows/budget-planner.yml`.
- **Product alignment:** Chất lượng — phủ test cho FE.

## Standards Applied

- **testing** — test thuần, mock biên (fetch/localStorage), tên `*.test.js(x)` cạnh nguồn.
- **naming/coding-style** — chỉ devDeps test, không đổi hành vi app.
- **ci** — job FE song song; cache npm; cần package-lock.
