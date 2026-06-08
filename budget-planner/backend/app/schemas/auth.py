"""Pydantic schema cho Auth (đăng ký/đăng nhập/token)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Payload đăng ký."""

    email: EmailStr
    password: str = Field(min_length=8, description="Mật khẩu tối thiểu 8 ký tự")
    name: str = Field(default="", max_length=255)


class UserRead(BaseModel):
    """Thông tin user trả về (không kèm mật khẩu)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    is_active: bool


class Token(BaseModel):
    """Cặp token trả về sau đăng nhập."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Payload làm mới access token."""

    refresh_token: str


class PasswordChange(BaseModel):
    """Payload đổi mật khẩu."""

    current_password: str
    new_password: str = Field(min_length=8, description="Mật khẩu mới tối thiểu 8 ký tự")


class ProfileUpdate(BaseModel):
    """Payload đổi thông tin hồ sơ."""

    name: str = Field(max_length=255)
