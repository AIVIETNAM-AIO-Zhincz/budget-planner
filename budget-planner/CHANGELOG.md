# Changelog

Tất cả thay đổi đáng chú ý của **Budget Planner** được ghi tại đây.
Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/);
dự án dùng [Semantic Versioning](https://semver.org/lang/vi/).

## [Unreleased]

- (chưa có)

## [0.1.0-phase0] — 2026-06-09

Mốc hoàn thiện **Phase 0–1**: nền tảng + đầy đủ tính năng cốt lõi (18 PR, `#1`–`#18`).

### Added — Nền tảng & xác thực

- Khung Frontend MUI (shell, sidebar, topbar), **dark mode**, đa ngôn ngữ **vi/en**. (`#1`)
- **Xác thực JWT + RBAC** (`viewer/member/admin/owner`); đa không gian theo `X-Space-Id`. (`#4`)
- Đăng nhập FE + chuyển không gian + tự refresh token khi 401. (`#5`)
- Quản lý **thành viên** (mời, gán vai trò). (`#6`)
- **Cài đặt**: đổi mật khẩu, hồ sơ, sửa không gian, tạo không gian. (`#8`)

### Added — Quản lý chi tiêu

- **Danh mục** (cây thu/chi) + **Ngân sách** (hạn mức, **cảnh báo vượt** qua event bus). (`#2`, `#3`)
- **Giao dịch** đầy đủ: CRUD, lọc & tìm, gợi ý danh mục, gắn ví. (`#7`)
- **Ví & chuyển tiền** (cash/bank/e-wallet); số dư tự cập nhật theo giao dịch. (`#9`)
- **Giao dịch định kỳ** (ngày/tuần/tháng), tự sinh khi đến hạn — *migration #1*. (`#12`)
- **Mục tiêu tiết kiệm** (gắn ví, góp = chuyển tiền) — *migration #3*. (`#16`)
- **Import / Export CSV** giao dịch (preview, bỏ qua dòng lỗi). (`#11`, `#14`)

### Added — Phân tích & trợ lý

- **Báo cáo** nâng cao: tổng hợp theo khoảng thời gian, top danh mục, **xuất CSV**. (`#11`)
- **Dashboard** nâng cao: thẻ tổng, biểu đồ, ngân sách, ví, giao dịch gần đây, định kỳ, mục tiêu. (`#13`, `#18`)
- **Trợ lý hội thoại**: nhập giao dịch ngôn ngữ tự nhiên + hỏi-đáp số liệu (rule-based). (`#10`)
- **Trợ lý LLM** (OpenAI-compatible) tuỳ chọn, fallback rule; số liệu luôn tính từ DB. (`#17`)
- **Thông báo (chuông)**: vượt ngân sách / mời thành viên / định kỳ chạy — *migration #2*. (`#15`)

### Infrastructure

- Kiến trúc **hướng sự kiện** (event bus + handlers).
- **Alembic** migrations (init → recurring → notifications → goals).
- CI **GitHub Actions**: ruff (lint+format) · pytest · docker build. Triển khai **Docker Compose**.
- **139 pytest**, ruff sạch.

[Unreleased]: https://github.com/AIVIETNAM-AIO-Zhincz/aio2026-practice/compare/develop...HEAD
