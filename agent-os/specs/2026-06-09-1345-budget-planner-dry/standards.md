# Standards for Dọn trùng lặp backend (DRY)

---

## naming / coding-style

- DRY: một nguồn sự thật cho mỗi mẫu lặp. Helper đặt đúng tầng: `format_vnd` ở `core/` (thuần),
  helper raise `HTTPException` ở `api/_common.py`. Không thêm dependency (YAGNI).

## testing/tdd

- Thêm `tests/test_common.py` cho helper mới; **toàn bộ test cũ (139) phải xanh** → chứng minh hành vi không đổi (regression).

## api/fastapi

- Status code & hợp đồng API không đổi. Message lỗi có thể thống nhất (tests không assert message).

## database/migrations

- Không model mới ⇒ không revision; verify autogenerate no-op.
