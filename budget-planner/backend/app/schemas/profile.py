"""Pydantic schema cho Hồ sơ tài chính người dùng."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ProfileUpdate(BaseModel):
    """Payload tạo/cập nhật hồ sơ (partial — chỉ gửi trường muốn đổi)."""

    monthly_income: float | None = Field(default=None, ge=0)
    occupation: str | None = Field(default=None, max_length=255)
    age: int | None = Field(default=None, ge=0, le=120)
    location: str | None = Field(default=None, max_length=255)
    dependents: int | None = Field(default=None, ge=0)


class ProfileRead(BaseModel):
    """Hồ sơ tài chính trả về client."""

    model_config = ConfigDict(from_attributes=True)

    user_id: str
    monthly_income: float | None = None
    occupation: str | None = None
    age: int | None = None
    location: str | None = None
    dependents: int = 0
