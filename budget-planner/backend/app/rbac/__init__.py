"""Phân quyền & ngữ cảnh không gian (RBAC).

Phase 0 (slice Transactions) CHƯA có auth, nên ``get_current_space_id`` tạm lấy
từ header ``X-Space-Id`` hoặc dùng không gian mặc định. Slice RBAC sau sẽ thay
bằng: xác thực user → tra Membership → kiểm tra (vai trò × không gian × tài nguyên).
"""

from __future__ import annotations

from fastapi import Header

from app.core.config import settings


def get_current_space_id(x_space_id: str | None = Header(default=None)) -> str:
    """Trả về space_id hiện tại (TODO: thay bằng auth + Membership ở slice RBAC)."""
    return x_space_id or settings.default_space_id
