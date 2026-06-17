# Standards for Hồ sơ tài chính người dùng

Các chuẩn áp dụng (trích nguyên văn từ `agent-os/standards/`).

---

## database/migrations

- Quản lý schema bằng **Alembic**; **không** đổi schema thủ công trên DB.
- Mỗi thay đổi schema = **một revision** mới; message rõ nghĩa (`-m "add transaction table"`).
- Ưu tiên **`--autogenerate`** từ SQLAlchemy metadata, **review** file sinh ra trước khi chạy.
- **Không sửa** migration đã được apply/commit; cần đổi thì tạo revision mới.
- `alembic/env.py` trỏ tới `target_metadata` của models + lấy URL từ config (không hardcode).
- Áp dụng: `alembic upgrade head`; xem lịch sử: `alembic history`.
- Model & migration phải đồng bộ — chạy `--autogenerate` ra "no changes" nghĩa là khớp.

> Áp dụng: migration `add_user_profiles` (down_revision = head `c1946410be53`) `create_table` +
> `drop_table`; cột `dependents` có `server_default="0"`. Áp `upgrade head` + verify no-op lần 2.

---

## testing/tdd

- **Viết test trước**, implement sau (Test-Driven Development).
- Test trong `tests/` hoặc cùng cấp, đặt tên `test_*.py`, chạy bằng **`pytest`**.
- Mỗi hàm public có ≥ 1 test cho **case thường** + **case biên**.
- Test phải độc lập, không phụ thuộc thứ tự chạy; dùng fixture cho setup chung.
- Với API: test cả **happy path** lẫn **lỗi quyền** (vd Viewer không được sửa → 403).
- Với AI: test có **fallback** khi model không chắc; không assert cứng output sinh ngẫu nhiên.

> Áp dụng: `test_profile.py` (GET mặc định, PUT upsert, 422 validation, 401, cô lập user); cá nhân hoá
> test (profile None → hành vi cũ giữ nguyên).

---

## api/fastapi

- Router theo tài nguyên; dùng **Pydantic** cho request/response schema.
- Mọi endpoint trả về schema rõ ràng; lỗi trả mã HTTP đúng (`400/401/403/404/422`).
- **Validation ở schema** (Pydantic), không validate thủ công rải rác.
- **Auth & RBAC bắt buộc ở backend**; mỗi truy vấn lọc theo **`space_id`**.
- Ghi **audit log** cho hành động nhạy cảm; không log dữ liệu nhạy cảm.

> Áp dụng: `/profile` GET/PUT theo `get_current_user` (per-user — không lọc space); Pydantic validation
> (income ≥0, age 0–120, dependents ≥0). Không log thu nhập chi tiết.

---

## root/coding-style + naming

- PEP 8, ruff format/check, type hint + docstring tiếng Việt, hàm thuần, YAGNI.
- `snake_case` hàm/biến, `PascalCase` class (`UserProfile`/`ProfileRead`), `UPPER_SNAKE` hằng.

> Áp dụng: occupation/age/location chỉ lưu + hiển thị (chưa thêm rule — YAGNI); cá nhân hoá cụ thể chỉ
> dùng income + dependents.
