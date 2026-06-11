# Changelog

Tất cả thay đổi đáng chú ý của **Budget Planner** được ghi tại đây.
Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.0.0/);
dự án dùng [Semantic Versioning](https://semver.org/lang/vi/).

## [Unreleased]

- (chưa có)

## [0.2.0] — 2026-06-11

Mốc **Phase 2**: animation, hoàn thiện UI/UX, và 4 tính năng lập kế hoạch lấy cảm hứng từ template
"Monthly Budget" (9 PR, `#24`–`#32`). Tag: `budget-planner-v0.2.0`.

### Added — Tính năng Phase 2

- **Phân loại Nhu cầu/Mong muốn/Lãng phí**: gắn `need_level` cho danh mục chi + báo cáo % chi theo nhóm (50/30/20) — *migration #5*. (`#29`)
- **Dự kiến vs Thực tế**: Kế hoạch tháng (thu/chi dự kiến) đối chiếu thực tế + ✅đạt/❌chưa — *migration #6*. (`#30`)
- **Tổng quan năm**: trang 12 tháng (cột thu/chi + đường số dư luỹ kế) + thẻ tổng năm. (`#31`)
- **Quỹ khẩn cấp/dài hạn**: gắn `fund_type` cho mục tiêu tiết kiệm + dải tổng theo loại — *migration #7*. (`#32`)

### Added — Trải nghiệm

- **Animation GSAP**: stagger thẻ khi vào trang, StatCard đếm số, hover nhấc thẻ, chuyển trang — tôn trọng reduced-motion. (`#26`)
- **Cải thiện UI/UX batch 2**: phân trang giao dịch (+ endpoint `/transactions/stats`), % so kỳ trước ở Báo cáo, validation inline form, chuẩn hoá màu badge (golden-angle). (`#28`)

### Fixed

- **CORS**: cho phép gọi API từ `127.0.0.1:5173` (ngoài `localhost:5173`) khi chạy dev. (`#27`)

## [0.1.0] — 2026-06-09

Mốc **Phase 0–1**: nền tảng + đầy đủ tính năng cốt lõi, tài liệu & test (23 PR, `#1`–`#23`).
Tag: `budget-planner-v0.1.0`.

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

### Tài liệu & chất lượng

- **README** đầy đủ + `backend/.env.example` + CHANGELOG này. (`#19`)
- **Refactor DRY** backend: helper dùng chung (`format_vnd`/`get_owned_or_404`/`write_audit`/`raise_transfer_error`), hành vi không đổi. (`#20`)
- **Test Frontend** (Vitest + React Testing Library): utils · api/client · component/dialog · AuthContext — **31 test**; thêm job CI `frontend-test`. (`#21`, `#22`)
- **Cải thiện UI/UX**: sửa biểu đồ tròn (renderer SVG), line 2 trục Y, số tiền rút gọn, tổng kết giao dịch + tháng mặc định, quick prompts trợ lý. (`#23`)

### Infrastructure

- Kiến trúc **hướng sự kiện** (event bus + handlers).
- **Alembic** migrations (init → recurring → notifications → goals).
- CI **GitHub Actions**: GitGuardian · ruff (lint+format) · **pytest (141)** · **vitest (31)** · docker build. Triển khai **Docker Compose**.

[0.2.0]: https://github.com/AIVIETNAM-AIO-Zhincz/aio2026-practice/releases/tag/budget-planner-v0.2.0
[0.1.0]: https://github.com/AIVIETNAM-AIO-Zhincz/aio2026-practice/releases/tag/budget-planner-v0.1.0
[Unreleased]: https://github.com/AIVIETNAM-AIO-Zhincz/aio2026-practice/compare/budget-planner-v0.2.0...develop
