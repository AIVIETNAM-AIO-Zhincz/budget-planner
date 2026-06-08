"""Pydantic schema cho Space + Membership (quản lý thành viên)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field

_ROLE_PATTERN = "^(owner|admin|member|viewer)$"


class SpaceCreate(BaseModel):
    """Payload tạo không gian."""

    name: str = Field(min_length=1, max_length=255)
    currency: str = Field(default="VND", max_length=8)


class SpaceUpdate(BaseModel):
    """Payload sửa không gian (partial)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    currency: str | None = Field(default=None, max_length=8)


class SpaceRead(BaseModel):
    """Không gian trả về kèm vai trò của user hiện tại."""

    id: str
    name: str
    owner_id: str | None
    currency: str
    role: str


class MemberRead(BaseModel):
    """Một thành viên của không gian (kèm thông tin user)."""

    id: str
    user_id: str
    email: str
    name: str
    role: str
    status: str


class MemberInvite(BaseModel):
    """Payload mời thành viên (user phải đã tồn tại)."""

    email: EmailStr
    role: str = Field(default="member", pattern=_ROLE_PATTERN)


class RoleUpdate(BaseModel):
    """Payload đổi vai trò thành viên."""

    model_config = ConfigDict(extra="forbid")

    role: str = Field(pattern=_ROLE_PATTERN)
