# Standards for Bộ test Frontend (Vitest)

---

## testing

- Test thuần/độc lập; mock biên ngoài (`global.fetch`, `localStorage`) — không gọi mạng thật.
- Tên `*.test.js`/`*.test.jsx` đặt cạnh file nguồn. `vitest run` trong CI.

## naming / coding-style

- Chỉ thêm **devDependencies** test (vitest, @testing-library/*, jsdom); không thêm dep runtime; không đổi hành vi app.

## ci

- Job `frontend-test` chạy song song `backend-test`; `actions/setup-node` cache npm; `npm ci` cần `package-lock.json` (commit).
