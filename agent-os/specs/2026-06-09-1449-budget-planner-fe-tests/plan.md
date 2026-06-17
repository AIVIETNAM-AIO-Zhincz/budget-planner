# Budget Planner — Bộ test Frontend đầu tiên (Vitest)

## Context

Backend có 141 pytest nhưng **frontend chưa có test nào**. Spec này dựng **Vitest + jsdom +
React Testing Library** và viết bộ test **logic-first** (giá trị cao, ít setup): tiện ích thuần
(`utils/format`, `utils/charts`), lõi `api/client` (gắn header, 204→null, ApiError, refresh-401),
+ 1 component smoke (`StatCard`). Thêm **job CI `frontend-test`** chạy `npm ci && npm test`.

**Quyết định đã chốt:**
- Logic-first: utils + api/client + 1 component smoke. Thêm CI job `frontend-test`.
- Không đổi code app (chỉ thêm test + cấu hình + devDeps). Nhánh `feature/budget-planner-fe-tests` từ `develop`.

## Sự thật đã khảo sát

- `package.json`: devDeps chỉ `vite` + `@vitejs/plugin-react`; scripts dev/build/preview (chưa có test).
- `vite.config.js`: `defineConfig` từ `vite` (chưa có khối `test`).
- `utils/format.js`: `formatAmount` (`toLocaleString("vi-VN")`), `categoryColor` (hash→palette, ổn định), `budgetTone` (≥100 error / ≥80 warning / else success).
- `utils/charts.js`: `summarize→{income,expense,balance,count}`, `expenseByCategory→[{name,value,color}]` (bỏ income, "Khác", sort desc), `flowByDate→{dates(sorted),income[],expense[]}`.
- `api/client.js`: `apiFetch(path, options, _retry)` gắn `Authorization`+`X-Space-Id` từ localStorage; `BASE=import.meta.env.VITE_API_URL||:8000`; 204→null; non-ok→`ApiError(msg,status)`; 401 (không /auth/*, có refresh) → `/auth/refresh` → retry 1 lần; refresh fail → `clearAuth()`+handler+throw 401. Export `ApiError`, `getAccessToken/getSpaceId/setTokens/setSpace/clearAuth/setUnauthorizedHandler`, `BASE_URL`.
- `components/StatCard.jsx`: props `{label,value,note,icon,accent}` — không dùng `t()` (render được với theme mặc định MUI).
- CI `.github/workflows/budget-planner.yml`: `defaults.run.working-directory: .../backend`; jobs `backend-test`, `docker-build`. → thêm job `frontend-test` (override working-directory sang frontend).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-1449-budget-planner-fe-tests/`.

## Task 2 — Cài & cấu hình Vitest

- `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/dom jsdom` (cập nhật `package.json` + `package-lock.json`).
- `vite.config.js`: đổi import sang `from "vitest/config"`; thêm khối `test: { environment: "jsdom", globals: true, setupFiles: "./src/test/setup.js", css: false }`.
- `src/test/setup.js`: `import "@testing-library/jest-dom"`; stub `window.matchMedia` (an toàn cho MUI).
- `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

## Task 3 — Viết test (logic-first)

- `src/utils/format.test.js`: `formatAmount` (50000→"50.000", 0→"0", chuỗi/NaN→"0"); `categoryColor` (ổn định cùng tên, trả hex trong palette); `budgetTone` (120→error, 90→warning, 40→success).
- `src/utils/charts.test.js`: `summarize` (income/expense/balance/count); `expenseByCategory` (bỏ income, gộp theo danh mục, sort desc, "Khác" cho rỗng); `flowByDate` (dates sort, mảng income/expense khớp).
- `src/api/client.test.js`: mock `global.fetch` + `localStorage`. Kiểm: gắn `Authorization`+`X-Space-Id`; 204→null; body JSON; non-ok→`ApiError` (đúng status); **401→refresh thành công→retry** trả body; **refresh fail→`clearAuth` + handler gọi + throw `ApiError(401)`**. (reset mock giữa các test.)
- `src/components/StatCard.test.jsx`: render `StatCard` với `label`/`value` → `screen.getByText` thấy cả hai (render tối thiểu, không cần i18n).

## Task 4 — CI job frontend-test

`.github/workflows/budget-planner.yml`: thêm job `frontend-test` — `actions/setup-node@v4` (node 20, cache npm theo `frontend/package-lock.json`), `working-directory` frontend, `npm ci`, `npm test`. Chạy song song `backend-test` (không chặn docker-build).

## Task 5 — Verify + giao nộp

- `npm test` xanh (local); `npm run build` vẫn xanh (không vỡ app).
- Xác nhận `git status` chỉ thêm test + config + devDeps (không đụng code app).
- Commit/push/PR vào `develop` → CI chạy cả backend-test + **frontend-test** + docker-build.

---

## Cấu trúc file

```
frontend/package.json · package-lock.json · vite.config.js   (sửa)
frontend/src/test/setup.js                                   (mới)
frontend/src/utils/{format,charts}.test.js                   (mới)
frontend/src/api/client.test.js                              (mới)
frontend/src/components/StatCard.test.jsx                    (mới)
.github/workflows/budget-planner.yml                         (sửa — job frontend-test)
```
Không đụng code app. Tái dùng export sẵn có của `utils`/`api/client`/`StatCard`.

## Standards áp dụng

- **testing** — test thuần/độc lập; mock biên (fetch/localStorage); tên `*.test.js(x)` cạnh file nguồn.
- **naming/coding-style** — không thêm dependency runtime (chỉ devDeps test); không đổi hành vi app.
- **ci** — job FE chạy song song; cache npm; `npm ci` cần `package-lock.json` (commit).

## Verification (lệnh)

```bash
cd conquer/budget-planner/frontend
npm install            # cài devDeps test
npm test               # vitest run — tất cả xanh
npm run build          # app vẫn build xanh
```
Kịch bản: `npm test` xanh; CI thêm job `frontend-test` xanh bên cạnh backend.
