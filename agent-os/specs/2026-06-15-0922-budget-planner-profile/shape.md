# Hồ sơ tài chính người dùng + cá nhân hoá — Shaping Notes

## Scope

Thêm **hồ sơ tài chính người dùng** (thu nhập/nghề/độ tuổi/nơi sống/người phụ thuộc) + **cá nhân hoá
lời khuyên** chatbot. Slice cuối (#4) của loạt "chatbot tư vấn", sau FAQ/allocation/goal (đã ở develop).

## Decisions (đã chốt với chủ repo)

1. **Phạm vi**: hồ sơ + cá nhân hoá lời khuyên.
2. **Lưu trữ**: bảng `user_profiles` **riêng** (1-1 với user), endpoint `/profile` (per-user, không space).
3. **Cá nhân hoá** (2 quy tắc cụ thể):
   - Quỹ khẩn cấp tăng theo **người phụ thuộc**: dependents>0 → 6–12× chi tiêu (else 3–6×).
   - **Thu nhập hồ sơ làm fallback** cho FAQ/allocation/goal khi tháng chưa ghi giao dịch thu.
   - occupation/age/location: chỉ lưu + hiển thị (chưa có rule cụ thể — YAGNI, để slice sau).
4. **Có migration** (`create_table user_profiles`, down_revision = head `c1946410be53`).
5. **Nhánh** `feature/budget-planner-profile` từ `develop` (không stack — 3 slice trước đã merge).

## Context

- **Visuals:** None.
- **References:** `models.User`, migration `c1946410be53_add_fund_type_to_goals.py` (mẫu),
  `api/auth.py` (`get_current_user`, `/auth/me`), `services/faq.py` (`_emergency_fund`),
  `services/assistant.py` (`_faq_context`/`_allocation_reply`/`_goal_reply`/`handle_message`),
  `api/assistant.py`, `pages/Settings.jsx` (`SettingCard`). Xem `references.md`.
- **Product alignment:** roadmap **Phase 3 (AI phân tích & trợ lý)** — cá nhân hoá; Production
  Description mục "điều chỉnh khuyến nghị tuỳ độ tuổi/nơi sống/người phụ thuộc".

## Standards Applied

- **database/migrations** — migration có upgrade/downgrade + `server_default` cho cột không null
  (`dependents`); áp + no-op verify.
- **testing/tdd** — `test_profile.py` (happy + 422 + 401 + cô lập) trước; cá nhân hoá test (profile None
  giữ hành vi cũ).
- **api/fastapi** — router `/profile` theo tài nguyên, Pydantic validation, `get_current_user`.
- **root/coding-style + naming**.
