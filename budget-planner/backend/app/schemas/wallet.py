"""Pydantic schema cho Wallet (ví) + chuyển tiền."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

_TYPE_PATTERN = "^(cash|bank|e-wallet)$"


class WalletBase(BaseModel):
    """Trường chung của ví."""

    name: str = Field(min_length=1, max_length=255)
    type: str = Field(default="cash", pattern=_TYPE_PATTERN)


class WalletCreate(WalletBase):
    """Payload tạo ví (kèm số dư khởi tạo)."""

    balance: float = Field(default=0.0)


class WalletUpdate(BaseModel):
    """Payload sửa ví (partial)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: str | None = Field(default=None, pattern=_TYPE_PATTERN)
    balance: float | None = None


class WalletRead(WalletBase):
    """Ví trả về client."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    space_id: str
    balance: float


class TransferRequest(BaseModel):
    """Payload chuyển tiền giữa hai ví."""

    from_wallet_id: str
    to_wallet_id: str
    amount: float = Field(gt=0, description="Số tiền chuyển, phải > 0")
