"""Tiện ích bảo mật: băm mật khẩu (bcrypt) + tạo/giải mã JWT (access/refresh)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# bcrypt giới hạn 72 byte cho mật khẩu → cắt bớt phần thừa (chuẩn an toàn).
_BCRYPT_MAX_BYTES = 72


def _encode(password: str) -> bytes:
    """Mã hoá mật khẩu sang bytes, cắt theo giới hạn 72 byte của bcrypt."""
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    """Băm mật khẩu bằng bcrypt."""
    return bcrypt.hashpw(_encode(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Kiểm mật khẩu khớp với hash; False nếu hash rỗng/sai."""
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(_encode(password), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _create_token(sub: str, token_type: str, expires_delta: timedelta) -> str:
    """Tạo JWT với subject + loại token + hạn dùng."""
    now = datetime.now(timezone.utc)
    payload = {"sub": sub, "type": token_type, "exp": now + expires_delta, "iat": now}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(sub: str) -> str:
    """Tạo access token (hạn theo phút)."""
    return _create_token(sub, "access", timedelta(minutes=settings.access_token_expire_minutes))


def create_refresh_token(sub: str) -> str:
    """Tạo refresh token (hạn theo ngày)."""
    return _create_token(sub, "refresh", timedelta(days=settings.refresh_token_expire_days))


def decode_token(token: str) -> dict:
    """Giải mã + xác thực JWT; ném ValueError nếu sai/hết hạn."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Token không hợp lệ hoặc đã hết hạn") from exc
