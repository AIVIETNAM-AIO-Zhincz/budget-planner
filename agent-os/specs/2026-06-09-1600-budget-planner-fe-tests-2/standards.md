# Standards for Mở rộng test Frontend

---

## testing

- Render với providers thật (`I18nextProvider` + `MemoryRouter` + `ColorModeProvider`); tương tác bằng `@testing-library/user-event`.
- Mock biên ngoài (api modules) bằng `vi.mock`; KHÔNG gọi mạng thật.
- Text mong đợi lấy qua `i18n.t(key)` (bền với thay đổi wording). `*.test.jsx` cạnh file nguồn.

## naming / coding-style

- Chỉ thêm devDependency test (`@testing-library/user-event`); không đổi hành vi code app.

## ci

- Bộ test chạy trong job `frontend-test` đã có (PR #21); không sửa workflow.
