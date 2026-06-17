# Standards for README + tài liệu

---

## docs/writing

- Tiếng Việt rõ ràng; mỗi bước có lệnh chạy được (copy-paste). Không hard-code mật khẩu/credential thật.
- README cấu trúc chuẩn: giới thiệu → tính năng → công nghệ → kiến trúc → chạy (local/docker) → env → API → test/CI.

## security

- `.env.example` chỉ giá trị mẫu (key trống); `.env` đã trong `.gitignore`.

## naming / coding-style

- Chỉ thêm tài liệu; không code/dependency. CHANGELOG theo Keep a Changelog.
