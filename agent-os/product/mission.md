# Product Mission

## Problem

Cá nhân và hộ gia đình khó kiểm soát chi tiêu: ghi chép thủ công tốn công, phân loại giao dịch chán, không thấy bức tranh tổng thể, và khi nhiều người cùng quản lý một ngân sách thì thiếu cách kiểm soát ai được xem/sửa gì. Các app hiện có hoặc khó dùng (học phí cao), hoặc phân quyền sơ sài, hoặc thiếu hỗ trợ AI thực sự hữu ích.

## Target Users

- **Sinh viên / cá nhân:** ghi chi tiêu nhanh, biết tiền đi đâu, đặt hạn mức.
- **Cặp đôi / vợ chồng:** cùng theo dõi chi tiêu chung, minh bạch.
- **Phụ huynh ↔ con:** cho con xem/ghi nhưng không cho sửa ngân sách.
- **Nhóm ở ghép:** chia hoá đơn chung, biết ai trả gì.

## Solution

**Budget Planner — trợ lý tài chính AI có phân quyền.** Người dùng ghi chép nhanh (kể cả bằng câu nói tự nhiên), AI tự phân loại & phân tích, hệ thống cảnh báo vượt ngân sách, dự báo chi tiêu và gợi ý tiết kiệm. Nhiều người dùng chung một **"không gian" (household)** với **phân quyền theo vai trò (Role-Based Access Control, RBAC)** rõ ràng.

**Hai điểm khác biệt cốt lõi:**
1. **AI-first:** AI là trụ cột xuyên suốt (nhập ngôn ngữ tự nhiên, tự phân loại, phát hiện bất thường, dự báo, trợ lý hỏi-đáp, gợi ý tiết kiệm) — không phải tính năng phụ.
2. **Phân quyền bài bản:** RBAC theo từng tài nguyên (ví / danh mục / báo cáo), giới hạn theo không gian — vừa hợp gia đình, vừa kiểm soát chặt.

> Tài liệu chi tiết: [`conquer/docs/product-description.md`](../../conquer/docs/product-description.md)
