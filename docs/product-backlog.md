# Budget Planner — Product Backlog

Danh sách công việc ưu tiên hoá (epic → user story) cho sản phẩm Budget Planner. Nguồn: [`product-description.md`](product-description.md) + roadmap (`agent-os/product/roadmap.md`). Tech Leader + Quản lý nhóm dùng backlog này để rã task theo tuần.

## Cách dùng & quy ước

- **Priority (MoSCoW):** 🔴 Must · 🟡 Should · 🟢 Could.
- **Size:** S (≤1 ngày) · M (vài ngày) · L (>1 tuần, nên tách nhỏ).
- **Owner (vị trí):** Pipeline · Data · Model · QA · TL (Tech Leader).
- **Status:** ✅ Done · 🚧 Doing · ⬜ Todo.
- **Bám TDD:** mỗi story "Done" khi **có test trước + xanh**.

---

## Epic 0 — Nền tảng & DevEx
| # | User story | Pri | Size | Owner | Status | Acceptance |
|---|---|:--:|:--:|:--:|:--:|---|
| 0.1 | Là dev, tôi muốn scaffold backend (FastAPI) + DB (SQLite/SQLAlchemy) để có nền code | 🔴 | M | TL | ✅ | `/health` xanh, app chạy |
| 0.2 | Là dev, tôi muốn quản lý schema bằng Alembic để version DB | 🔴 | S | TL/Pipeline | ✅ | `alembic upgrade head` tạo đủ bảng |
| 0.3 | Là dev, tôi muốn event bus (EDA) để các phần rời ghép qua sự kiện | 🔴 | M | TL | ✅ | publish/subscribe có test, lỗi handler không lan |
| 0.4 | Là dev, tôi muốn Docker + docker-compose để chạy cả stack | 🔴 | S | TL/Pipeline | ✅ | `docker compose up` chạy db+be+fe |
| 0.5 | Là dev, tôi muốn CI/CD (GitHub Actions) lint+test+build | 🔴 | S | TL/QA | ✅ | workflow xanh trên PR |
| 0.6 | Là dev, tôi muốn scaffold frontend React/Vite gọi API | 🔴 | M | Pipeline | ✅ | trang Transactions list/thêm |

## Epic 1 — Giao dịch & Danh mục
| # | User story | Pri | Size | Owner | Status | Acceptance |
|---|---|:--:|:--:|:--:|:--:|---|
| 1.1 | Là user, tôi muốn thêm giao dịch (thu/chi) để ghi chi tiêu | 🔴 | S | Pipeline | ✅ | POST tạo, amount>0 (422 nếu sai) |
| 1.2 | Là user, tôi muốn xem danh sách giao dịch của không gian | 🔴 | S | Pipeline | ✅ | lọc theo `space_id` |
| 1.3 | Là user, tôi muốn sửa/xoá giao dịch | 🔴 | S | Pipeline | ⬜ | PUT/DELETE + test quyền |
| 1.4 | Là user, tôi muốn quản lý danh mục (cha/con, thu/chi) | 🟡 | M | Data | ⬜ | CRUD category, gắn vào giao dịch |
| 1.5 | Là user, tôi muốn import giao dịch từ file CSV | 🟡 | M | Pipeline/Data | ⬜ | upload CSV → validate → tạo hàng loạt |
| 1.6 | Là user, tôi muốn nhiều ví và chuyển tiền giữa ví | 🟢 | M | Pipeline | ⬜ | Wallet CRUD + transfer |

## Epic 2 — Ngân sách & Cảnh báo (EDA)
| # | User story | Pri | Size | Owner | Status | Acceptance |
|---|---|:--:|:--:|:--:|:--:|---|
| 2.1 | Là user, tôi muốn đặt hạn mức ngân sách theo danh mục/tháng | 🔴 | M | Model | ⬜ | Budget CRUD |
| 2.2 | Là user, tôi muốn được cảnh báo khi sắp/đã vượt ngân sách | 🔴 | M | Model | ⬜ | handler phát `BudgetExceeded` khi vượt |
| 2.3 | Là user, tôi muốn đặt mục tiêu tiết kiệm | 🟢 | S | Model | ⬜ | theo dõi tiến độ tiết kiệm |

## Epic 3 — AI (trụ cột)
| # | User story | Pri | Size | Owner | Status | Acceptance |
|---|---|:--:|:--:|:--:|:--:|---|
| 3.1 | Là user, tôi muốn AI tự gợi ý danh mục cho giao dịch | 🔴 | S | Model | ✅ | baseline rule + fallback "Khác", có test |
| 3.2 | Là user, tôi muốn AI phân loại nâng cao (ML đã train) | 🔴 | M | Data/Model | ⬜ | model sklearn + eval accuracy/F1 |
| 3.3 | Là user, tôi muốn nhập giao dịch bằng ngôn ngữ tự nhiên | 🔴 | M | Model | ⬜ | "ăn trưa 50k" → {amount, category, date}, user xác nhận |
| 3.4 | Là user, tôi muốn AI dự báo chi tiêu tháng sau | 🟡 | L | Model | ⬜ | dự báo theo lịch sử + đánh giá sai số |
| 3.5 | Là user, tôi muốn trợ lý hỏi-đáp tài chính | 🟡 | L | Model/TL | ⬜ | LLM + tool-calling truy vấn DB thật (không bịa số) |
| 3.6 | Là user, tôi muốn AI gợi ý cách tiết kiệm | 🟢 | M | Model | ⬜ | gợi ý dựa pattern chi tiêu |
| 3.7 | Là Data, tôi muốn dataset giao dịch + nhãn + eval set | 🔴 | M | Data | ⬜ | data card + golden set |

## Epic 4 — Xác thực (Auth)
| # | User story | Pri | Size | Owner | Status | Acceptance |
|---|---|:--:|:--:|:--:|:--:|---|
| 4.1 | Là user, tôi muốn đăng ký bằng email/mật khẩu | 🔴 | M | TL/Pipeline | ⬜ | mật khẩu băm argon2/bcrypt |
| 4.2 | Là user, tôi muốn đăng nhập nhận JWT | 🔴 | M | TL | ⬜ | access+refresh token, đăng xuất thu hồi |
| 4.3 | Là user, tôi muốn quên/đặt lại mật khẩu | 🟡 | S | TL | ⬜ | link/OTP hết hạn |
| 4.4 | Là user, tôi muốn bật 2FA (TOTP) | 🟢 | M | TL | ⬜ | xác thực 2 lớp |
| 4.5 | Là user, tôi muốn đăng nhập Google (OAuth) | 🟢 | M | TL | ⬜ | OAuth2 flow |

## Epic 5 — Không gian & Phân quyền (RBAC)
| # | User story | Pri | Size | Owner | Status | Acceptance |
|---|---|:--:|:--:|:--:|:--:|---|
| 5.1 | Là owner, tôi muốn tạo không gian (household) | 🔴 | S | TL | ⬜ | Space CRUD, gán owner |
| 5.2 | Là owner, tôi muốn mời/xoá thành viên | 🔴 | M | TL | ⬜ | Membership + lời mời email |
| 5.3 | Là owner, tôi muốn gán vai trò (Owner/Admin/Member/Viewer) | 🔴 | M | TL | ⬜ | ma trận quyền enforce backend |
| 5.4 | Là hệ thống, mọi request kiểm tra quyền theo (vai trò×không gian×tài nguyên) | 🔴 | M | TL | ⬜ | Viewer sửa → 403 (test) |
| 5.5 | Là owner, tôi muốn xem audit log hành động nhạy cảm | 🟡 | S | TL | ✅* | log `transaction.created`; mở rộng cho đổi quyền/xoá |

## Epic 6 — Báo cáo & Dashboard
| # | User story | Pri | Size | Owner | Status | Acceptance |
|---|---|:--:|:--:|:--:|:--:|---|
| 6.1 | Là user, tôi muốn dashboard tổng quan thu/chi | 🔴 | M | Pipeline/Data | ⬜ | tổng hợp theo tháng |
| 6.2 | Là user, tôi muốn biểu đồ theo danh mục/thời gian | 🔴 | M | Pipeline | ⬜ | pie + line |
| 6.3 | Là user, tôi muốn xuất báo cáo PDF | 🟢 | S | Pipeline | ⬜ | export PDF |
| 6.4 | Là user, tôi muốn nhận tóm tắt tài chính hằng tuần (AI) | 🟢 | M | Model | ⬜ | tóm tắt tự động |

## Epic 7 — Vận hành & Bảo mật
| # | User story | Pri | Size | Owner | Status | Acceptance |
|---|---|:--:|:--:|:--:|:--:|---|
| 7.1 | Là dev, tôi muốn deploy lên cloud (Render/Railway/VPS) | 🟡 | M | TL/Pipeline | ⬜ | URL chạy được |
| 7.2 | Là dev, tôi muốn lên PostgreSQL ở production | 🟡 | S | Pipeline | ⬜ | đổi DATABASE_URL, migration chạy |
| 7.3 | Là dev, tôi muốn giám sát + log lỗi | 🟢 | M | TL | ⬜ | logging/monitoring cơ bản |

---

## Sprint 1 đề xuất (tuần này — sau khi nền P0 đã xong)
Ưu tiên hoàn thiện **lõi giao dịch + AI + bắt đầu auth**, chia theo vai trò:

| Story | Owner |
|---|---|
| 1.3 Sửa/xoá giao dịch · 1.4 Danh mục | Pipeline + Data |
| 2.1 Đặt ngân sách · 2.2 Cảnh báo vượt (EDA) | Model |
| 3.2 Phân loại ML · 3.7 Dataset + eval | Data + Model |
| 4.1 Đăng ký · 4.2 Đăng nhập JWT | Tech Leader |
| Viết test trước cho mọi story · review | QA |

> *5.5 đánh ✅\* vì audit log đã có cho giao dịch; cần mở rộng cho các hành động nhạy cảm khác.*

## 🔗 Liên kết
- [`product-description.md`](product-description.md)
- `agent-os/product/roadmap.md` · `agent-os/specs/2026-06-08-1853-budget-planner-phase-0/`
