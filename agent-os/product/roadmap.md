# Product Roadmap

## Phase 0: MVP (Module 1) — lõi chạy được

- Xác thực: đăng ký + đăng nhập (email/mật khẩu).
- Một không gian (Space) + ví đầu tiên.
- Giao dịch: thêm/sửa/xoá thu–chi; import Comma-Separated Values (CSV).
- Danh mục + ngân sách theo danh mục/tháng + cảnh báo vượt.
- Báo cáo cơ bản: tổng hợp + biểu đồ (pie theo danh mục, line theo thời gian).
- **AI (cơ bản):** tự phân loại giao dịch (rule + Machine Learning đơn giản).

> Đây cũng là "Plan A" — vừa sức Module 1 mà đã có AI đúng yêu cầu.

## Phase 1: AI nhập liệu thông minh

- Nhập giao dịch bằng **ngôn ngữ tự nhiên** ("ăn trưa 50k hôm qua" → giao dịch).
- Tự phân loại nâng cao (model + đánh giá độ chính xác).

## Phase 2: Cộng tác & phân quyền (RBAC)

- Mời thành viên vào không gian.
- Vai trò Owner / Admin / Member / Viewer + ma trận quyền (kiểm tra ở backend).
- Nhật ký kiểm toán (audit log).

## Phase 3: AI phân tích & trợ lý

- Dự báo chi tiêu tháng sau.
- Gợi ý tiết kiệm cá nhân hoá.
- Trợ lý hỏi-đáp tài chính (LLM + tool-calling trên dữ liệu thật).

## Phase 4: Hoàn thiện trải nghiệm

- Dashboard nâng cao, giao dịch định kỳ, thông báo, xuất Portable Document Format (PDF).

## Phase 5: Bảo mật & vận hành

- 2FA (Two-Factor Authentication), OAuth Google, Super Admin.
- OCR hoá đơn (stretch), hoàn thiện bảo mật, Docker + CI/CD + deploy.

> Chi tiết tính năng & tiêu chí: [`conquer/docs/product-description.md`](../../conquer/docs/product-description.md)
