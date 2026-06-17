# Database Migrations (Alembic)

- Quản lý schema bằng **Alembic**; **không** đổi schema thủ công trên DB.
- Mỗi thay đổi schema = **một revision** mới; message rõ nghĩa (`-m "add transaction table"`).
- Ưu tiên **`--autogenerate`** từ SQLAlchemy metadata, **review** file sinh ra trước khi chạy.
- **Không sửa** migration đã được apply/commit; cần đổi thì tạo revision mới.
- `alembic/env.py` trỏ tới `target_metadata` của models + lấy URL từ config (không hardcode).
- Áp dụng: `alembic upgrade head`; xem lịch sử: `alembic history`.
- Model & migration phải đồng bộ — chạy `--autogenerate` ra "no changes" nghĩa là khớp.
