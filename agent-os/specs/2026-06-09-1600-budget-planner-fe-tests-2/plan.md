# Budget Planner — Mở rộng test Frontend (component + context)

## Context

PR #21 đã dựng Vitest + 15 test (utils/client/StatCard). Backend phủ gần đủ; **FE còn nhiều
component/dialog/context chưa test**. Spec này thêm test cho: dialog không-fetch (ConfirmDialog,
WalletFormDialog, ContributeDialog), component đơn giản (CategoryChip, PageHeader, ComingSoon),
dialog có-fetch (TransactionFormDialog — mock api), và **AuthContext** (luồng login/logout).
Cần render với providers (i18n + theme + router) + `user-event`. Không đổi code app.

**Quyết định đã chốt:** phủ cả 4 nhóm (dialog không-fetch + có-fetch + component đơn giản + AuthContext).
Nhánh `feature/budget-planner-fe-tests-2` từ `develop`. Dùng `i18n.t(key)` cho text mong đợi (bền với wording).

## Sự thật đã khảo sát (hợp đồng)

- **i18n** `src/i18n/index.js` — default export là instance `i18n` (vi mặc định). Bọc `<I18nextProvider i18n={i18n}>`. Lấy text mong đợi bằng `i18n.t("...")`.
- **theme** `src/theme/ColorModeContext.jsx` — default export `ColorModeProvider` (kèm ThemeProvider+CssBaseline). Không có theme tĩnh → bọc bằng provider này.
- **ConfirmDialog**: props `{open,title,message,onCancel,onConfirm,confirming,confirmLabel}`; nút huỷ→`onCancel` (label `common.cancel`), xác nhận→`onConfirm` (label `confirmLabel||common.delete`); `confirming` disable.
- **WalletFormDialog**: `{open,onClose,onSubmit,submitting,initial}`; field name/type/balance; **submit chỉ khi name.trim()≠""**; payload `{name,type,balance:Number}`. Không fetch.
- **ContributeDialog**: `{open,onClose,onSubmit,submitting,goal,wallets,error}`; `sources=wallets.filter(w!==goal.wallet_id)`; amount>0; payload `{from_wallet_id,amount}`; `error`→Alert. Không fetch.
- **TransactionFormDialog**: nạp `listCategories()` (`../api/categories.js`) + `listWallets()` (`../api/wallets.js`) khi mở → **mock 2 module**; field type(toggle)/amount/note/category(Autocomplete freeSolo)/date(DatePicker dayjs)/wallet; payload `{amount,type,note,category_name,date,wallet_id}`.
- **CategoryChip** `{name}`→Chip (null nếu rỗng); **PageHeader** `{title,description,actions}`; **ComingSoon** `{hint}` (title `common.comingSoon`).
- **AuthContext** `auth/AuthContext.jsx`: `export default AuthProvider`, `export function useAuth()` → `{status,user,spaces,spaceId,login,register,logout,selectSpace,reload}`. `login(email,pw)` gọi `api/auth.login` (setTokens) → `loadSession` (`api/auth.getMe` + `api/spaces.listSpaces`) → status "authed"; `logout`→`clearAuth`+navigate. Mount: có token→loadSession, không→"anon". → **mock `api/auth`, `api/spaces`, `react-router useNavigate`** (hoặc bọc MemoryRouter).

---

## Task 1 — Lưu tài liệu spec

`agent-os/specs/2026-06-09-1600-budget-planner-fe-tests-2/`.

## Task 2 — Cài user-event + test-utils

- `npm install -D @testing-library/user-event` (cập nhật lock).
- `src/test/utils.jsx`: `renderWithProviders(ui, {route="/"}={})` bọc `<I18nextProvider i18n={i18n}><MemoryRouter initialEntries={[route]}><ColorModeProvider>{ui}</ColorModeProvider></MemoryRouter></I18nextProvider>`; re-export `screen`, `userEvent`. (Helper dùng chung cho mọi test component.)

## Task 3 — Test dialog không-fetch + component đơn giản

- `components/ConfirmDialog.test.jsx`: mở → thấy title/message; click nút `common.cancel`→`onCancel`; click nút xác nhận→`onConfirm`; `confirming` → nút disabled.
- `components/WalletFormDialog.test.jsx`: điền tên + số dư → submit gọi `onSubmit` đúng `{name,type,balance}`; submit khi **tên rỗng → onSubmit KHÔNG gọi**.
- `components/ContributeDialog.test.jsx`: `goal.wallet_id` bị loại khỏi select nguồn (chỉ còn ví khác); amount 0/để trống → không submit (hiện lỗi `amountRequired`); amount hợp lệ → `onSubmit({from_wallet_id,amount})`; `error` prop → Alert hiển thị.
- `components/CategoryChip.test.jsx` (render tên; rỗng→null), `PageHeader.test.jsx` (title+description+actions), `ComingSoon.test.jsx` (text `i18n.t("common.comingSoon")`).

## Task 4 — Test dialog có-fetch + AuthContext

- `components/TransactionFormDialog.test.jsx`: `vi.mock("../api/categories.js")` + `vi.mock("../api/wallets.js")` trả mảng mẫu; mở dialog → `await` nạp xong; điền amount → submit gọi `onSubmit` (amount đúng, type mặc định "expense"); submit khi amount trống/0 → không gọi.
- `auth/AuthContext.test.jsx`: `vi.mock("../api/auth.js")` (login/getMe), `vi.mock("../api/spaces.js")` (listSpaces); component thăm dò dùng `useAuth()` render `status` + nút login/logout. Bắt đầu **anon** (no token) → login → mock resolves → `status="authed"`, `user`/`spaces` set; logout → `clearAuth` gọi + `status` về anon. Bọc `MemoryRouter` cho `useNavigate`.

## Task 5 — Verify + giao nộp

- `npm test` xanh (15 cũ + ~mới); `npm run build` xanh.
- `git status` chỉ thêm test + test-utils + devDep (không đụng code app).
- Commit/push/PR → CI `frontend-test` chạy lại với bộ test mở rộng.

---

## Cấu trúc file

```
frontend/package.json · package-lock.json            (sửa — devDep user-event)
frontend/src/test/utils.jsx                          (mới — renderWithProviders)
frontend/src/components/{ConfirmDialog,WalletFormDialog,ContributeDialog,
   CategoryChip,PageHeader,ComingSoon,TransactionFormDialog}.test.jsx   (mới)
frontend/src/auth/AuthContext.test.jsx               (mới)
```
Tái dùng: `i18n` instance, `ColorModeProvider`, export sẵn của component/api. Không sửa code app.

## Standards áp dụng

- **testing** — render với providers thật (i18n/theme/router); mock biên (api modules) bằng `vi.mock`; tương tác bằng `user-event`; text mong đợi qua `i18n.t()`.
- **naming/coding-style** — chỉ devDeps test; không đổi hành vi app; `*.test.jsx` cạnh nguồn.
- **ci** — bộ test chạy trong job `frontend-test` sẵn có (không sửa workflow).

## Verification (lệnh)

```bash
cd conquer/budget-planner/frontend
npm install        # cài user-event
npm test           # vitest run — tất cả xanh
npm run build      # app vẫn xanh
```
Kịch bản: `npm test` xanh (component/dialog/context); CI `frontend-test` xanh.
