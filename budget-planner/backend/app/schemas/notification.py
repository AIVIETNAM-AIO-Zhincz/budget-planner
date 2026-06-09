"""Pydantic schema cho Notification."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    """Thông báo trả về client."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    space_id: str
    type: str
    message: str
    is_read: bool
    created_at: datetime
