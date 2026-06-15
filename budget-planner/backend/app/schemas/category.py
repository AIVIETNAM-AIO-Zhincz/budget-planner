"""Pydantic schema cho Category."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    """Trường chung khi tạo/đọc danh mục."""

    name: str = Field(min_length=1, max_length=255)
    type: str = Field(default="expense", pattern="^(income|expense)$")
    parent_id: str | None = None
    need_level: str = Field(default="optional", pattern="^(mandatory|optional|wasteful)$")


class CategoryCreate(CategoryBase):
    """Payload tạo danh mục."""


class CategoryUpdate(BaseModel):
    """Payload cập nhật danh mục (partial — chỉ field gửi lên mới đổi)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: str | None = Field(default=None, pattern="^(income|expense)$")
    parent_id: str | None = None
    need_level: str | None = Field(default=None, pattern="^(mandatory|optional|wasteful)$")


class CategoryRead(CategoryBase):
    """Danh mục trả về client (kèm thống kê giao dịch)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    space_id: str
    tx_count: int = 0
    tx_total: float = 0.0
